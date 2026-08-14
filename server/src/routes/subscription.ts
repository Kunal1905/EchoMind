import { Router } from "express";
import crypto from "crypto";
import Razorpay from "razorpay";
import { z } from "zod";
import { db } from "../config/db";
import { usersTable } from "../config/schema";
import { requireUser, type AuthedRequest } from "../middleware/auth";
import { eq } from "drizzle-orm";
import { PLANS, isPurchasablePlan, type PlanKey } from "../config/plans";
import { activatePaidPlan } from "../lib/activatePaidPlan";

const router = Router();

const razorpay = new Razorpay({
  key_id:     process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

const paymentVerificationSchema = z.object({
  razorpay_payment_id: z.string().min(1),
  razorpay_order_id: z.string().min(1),
  razorpay_signature: z.string().regex(/^[a-f0-9]{64}$/i),
});

function signaturesMatch(expected: string, received: string) {
  const expectedBuffer = Buffer.from(expected, "hex");
  const receivedBuffer = Buffer.from(received, "hex");
  return (
    expectedBuffer.length === receivedBuffer.length &&
    crypto.timingSafeEqual(expectedBuffer, receivedBuffer)
  );
}

// ✅ GET — read subscription (safe, read-only)
router.get("/", requireUser, async (req: AuthedRequest, res) => {
  try {
    const rows = await db.select().from(usersTable).where(eq(usersTable.id, req.authUserId!));
    if (!rows[0]) {
      return res.status(404).json({ error: "User not found. Please sign out and back in." });
    }
    const u = rows[0];
    const freeTrialLimit = PLANS.free.minutes;
    const freeTrialUsed = u.plan === "free"
      ? Math.min(freeTrialLimit, Math.max(0, freeTrialLimit - u.minutesRemaining))
      : freeTrialLimit;

    res.json({
      plan:             u.plan as PlanKey,
      minutesRemaining: u.minutesRemaining,
      minutesTotal:     u.plan === "free" ? freeTrialLimit : u.minutesTotal,
      freeTrialUsed,
      freeTrialLimit,
      isPremium:        u.plan !== "free",
      allowanceResetAt:  u.minuteAllowanceResetAt,
    });
  } catch (error) {
    console.error("[subscription GET]", error);
    res.status(500).json({ error: "Failed to fetch subscription" });
  }
});

// Creates the server-owned order. Plan activation happens only after a
// captured payment is verified here or delivered through the webhook.
router.post("/create-order", requireUser, async (req: AuthedRequest, res) => {
  const { planId } = req.body as { planId: PlanKey };
  const plan = PLANS[planId];

  if (!plan) {
    return res.status(400).json({ error: "Invalid plan" });
  }

  if (!isPurchasablePlan(planId)) {
    return res.status(400).json({ error: `${plan.name} is coming soon and is not purchasable yet.` });
  }

  try {
    const order = await razorpay.orders.create({
      amount:   plan.price * 100, // paise
      currency: "INR",
      receipt:  `em_${req.authUserId!.slice(-8)}_${Date.now()}`,
      notes: {
        userId: req.authUserId!,
        plan:   planId,
      },
    });

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error("[subscription create-order]", error);
    res.status(500).json({ error: "Failed to create payment order" });
  }
});

router.post("/verify-payment", requireUser, async (req: AuthedRequest, res) => {
  const parsed = paymentVerificationSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid payment verification response" });
  }

  const {
    razorpay_payment_id: paymentId,
    razorpay_order_id: orderId,
    razorpay_signature: signature,
  } = parsed.data;

  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) {
    return res.status(500).json({ error: "Payment verification is not configured" });
  }

  try {
    const expectedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(`${orderId}|${paymentId}`)
      .digest("hex");

    if (!signaturesMatch(expectedSignature, signature)) {
      return res.status(400).json({ error: "Payment signature verification failed" });
    }

    const order = await razorpay.orders.fetch(orderId);
    const orderUserId = String(order.notes?.userId || "");
    const plan = String(order.notes?.plan || "") as PlanKey;

    if (order.id !== orderId || orderUserId !== req.authUserId || !isPurchasablePlan(plan)) {
      return res.status(400).json({ error: "Payment order does not match this account" });
    }

    const expectedAmount = PLANS[plan].price * 100;
    if (Number(order.amount) !== expectedAmount || order.currency !== "INR") {
      return res.status(400).json({ error: "Payment order amount does not match the selected plan" });
    }

    let payment = await razorpay.payments.fetch(paymentId);
    if (
      payment.order_id !== orderId ||
      Number(payment.amount) !== expectedAmount ||
      payment.currency !== "INR"
    ) {
      return res.status(400).json({ error: "Payment details do not match the order" });
    }

    if (payment.status === "authorized") {
      payment = await razorpay.payments.capture(paymentId, expectedAmount, "INR");
    }

    if (payment.status !== "captured") {
      return res.status(409).json({ error: "Payment has not been captured yet" });
    }

    const result = await activatePaidPlan({
      userId: req.authUserId!,
      plan,
      paymentId,
      amount: Number(payment.amount),
    });

    return res.json({
      verified: true,
      plan,
      minutes: PLANS[plan].minutes,
      alreadyProcessed: result.alreadyProcessed,
    });
  } catch (error) {
    console.error("[subscription verify-payment]", error);
    return res.status(500).json({ error: "Failed to verify payment" });
  }
});

// There is intentionally no client-controlled "add minutes" endpoint.

export default router;
