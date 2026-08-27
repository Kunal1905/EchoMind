import { Router } from "express";
import crypto from "crypto";
import Razorpay from "razorpay";
import PDFDocument from "pdfkit";
import { z } from "zod";
import { db } from "../config/db";
import { processedPaymentsTable, usersTable } from "../config/schema";
import { requireUser, type AuthedRequest } from "../middleware/auth";
import { and, desc, eq } from "drizzle-orm";
import { PLANS, isPaidPlan, isPurchasablePlan, type PlanKey } from "../config/plans";
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

router.get("/billing", requireUser, async (req: AuthedRequest, res) => {
  try {
    const [users, payments] = await Promise.all([
      db
        .select({ email: usersTable.email, plan: usersTable.plan })
        .from(usersTable)
        .where(eq(usersTable.id, req.authUserId!))
        .limit(1),
      db
        .select()
        .from(processedPaymentsTable)
        .where(eq(processedPaymentsTable.userId, req.authUserId!))
        .orderBy(desc(processedPaymentsTable.createdAt)),
    ]);

    const user = users[0];
    if (!user) return res.status(404).json({ error: "User not found" });

    return res.json({
      billingModel: "one_time",
      billingEmail: user.email,
      currentPlan: user.plan,
      paymentMethodOnFile: null,
      nextBilling: null,
      taxStatus: "not_separately_itemised",
      payments: payments.map((payment) => {
        const plan = PLANS[payment.plan as PlanKey];
        return {
          paymentId: payment.paymentId,
          plan: payment.plan,
          planName: plan?.name || payment.plan,
          amount: payment.amountPaid ?? (plan ? plan.price * 100 : null),
          currency: payment.currency || "INR",
          paymentMethod: payment.paymentMethod,
          cardLast4: payment.cardLast4,
          billingEmail: payment.billingEmail || user.email,
          createdAt: payment.createdAt,
          receiptAvailable: true,
        };
      }),
    });
  } catch (error) {
    console.error("[subscription billing]", error);
    return res.status(500).json({ error: "Failed to load billing history" });
  }
});

router.get("/receipts/:paymentId", requireUser, async (req: AuthedRequest, res) => {
  try {
    const paymentId = Array.isArray(req.params.paymentId)
      ? req.params.paymentId[0]
      : req.params.paymentId;
    const rows = await db
      .select()
      .from(processedPaymentsTable)
      .where(and(
        eq(processedPaymentsTable.paymentId, paymentId),
        eq(processedPaymentsTable.userId, req.authUserId!)
      ))
      .limit(1);

    const payment = rows[0];
    if (!payment) return res.status(404).json({ error: "Payment receipt not found" });

    const plan = PLANS[payment.plan as PlanKey];
    const amount = payment.amountPaid ?? (plan ? plan.price * 100 : 0);
    const currency = payment.currency || "INR";
    const date = payment.createdAt ? new Date(payment.createdAt) : new Date();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="echomind-receipt-${payment.paymentId}.pdf"`
    );

    const doc = new PDFDocument({ size: "A4", margin: 56 });
    doc.pipe(res);
    doc.fontSize(24).text("EchoMind Payment Receipt");
    doc.moveDown(0.35);
    doc.fontSize(10).fillColor("#555555").text("This receipt confirms payment and is not a tax invoice.");
    doc.moveDown(2);
    doc.fillColor("#111111").fontSize(11);
    doc.text(`Receipt reference: ${payment.paymentId}`);
    doc.text(`Payment date: ${date.toISOString().slice(0, 10)}`);
    doc.text(`Plan: ${plan?.name || payment.plan}`);
    doc.text(
      plan?.billingModel === "pack"
        ? `Voice minutes added: ${payment.minutesCredited} (no expiry)`
        : `Voice allowance: ${payment.minutesCredited} minutes per calendar month`
    );
    doc.text(`Amount paid: ${currency} ${(amount / 100).toFixed(2)}`);
    doc.text(`Payment method: ${payment.paymentMethod || "Razorpay"}${payment.cardLast4 ? ` ending in ${payment.cardLast4}` : ""}`);
    doc.text(`Billing email: ${payment.billingEmail || "Account email"}`);
    doc.text("Tax: Not separately itemised");
    doc.moveDown(2);
    doc.fillColor("#555555").fontSize(9).text("Processed securely by Razorpay. EchoMind does not store complete card or bank details.");
    doc.text("Website: https://echomind.co.in");
    doc.end();
  } catch (error) {
    console.error("[subscription receipt]", error);
    if (!res.headersSent) return res.status(500).json({ error: "Failed to generate receipt" });
    return res.end();
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

    if (order.id !== orderId || orderUserId !== req.authUserId || !isPaidPlan(plan)) {
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

    let cardLast4: string | undefined;
    if (payment.card_id) {
      const card = await razorpay.cards.fetch(payment.card_id);
      cardLast4 = card.last4;
    }

    const result = await activatePaidPlan({
      userId: req.authUserId!,
      plan,
      paymentId,
      amount: Number(payment.amount),
      currency: payment.currency,
      paymentMethod: payment.method,
      cardLast4,
      billingEmail: payment.email,
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
