import { Router } from "express";
import crypto from "crypto";
import { db } from "../../config/db";
import { usersTable, processedPaymentsTable } from "../../config/schema";
import { eq } from "drizzle-orm";
import { PLANS, isPurchasablePlan, type PlanKey } from "../../config/plans";
import { getRedis } from "../../lib/redis";
import { trackServer } from "../../lib/analytics";

const router = Router();

router.post("/", async (req, res) => {
  // req.body is a Buffer because of express.raw() in index.ts
  const rawBody = req.body as Buffer;
  const signature = req.headers["x-razorpay-signature"] as string;
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

  if (!secret) {
    console.error("[razorpay-webhook] RAZORPAY_WEBHOOK_SECRET not set");
    return res.status(500).json({ error: "Server misconfigured" });
  }

  // ✅ Verify HMAC signature
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");

  if (!signature || !crypto.timingSafeEqual(
    Buffer.from(expectedSignature),
    Buffer.from(signature)
  )) {
    console.warn("[razorpay-webhook] Invalid signature");
    return res.status(400).json({ error: "Invalid signature" });
  }

  let body: any;
  try {
    body = JSON.parse(rawBody.toString());
  } catch {
    return res.status(400).json({ error: "Invalid JSON" });
  }

  if (body.event === "payment.captured") {
    const notes = body.payload?.payment?.entity?.notes || {};
    const userId = notes.userId as string | undefined;
    const plan = notes.plan as PlanKey | undefined;
    const paymentId = body.payload?.payment?.entity?.id as string | undefined;

    if (!userId || !plan || !PLANS[plan] || !paymentId) {
      console.warn("[razorpay-webhook] Missing userId/plan/paymentId in payload:", { notes, paymentId });
      return res.status(200).json({ received: true }); // 200 so Razorpay doesn't retry
    }

    if (!isPurchasablePlan(plan)) {
      console.warn("[razorpay-webhook] Ignoring non-purchasable plan in payload:", { userId, plan, paymentId });
      return res.status(200).json({ received: true });
    }

    const planData = PLANS[plan];

    // ✅ Idempotency gate — atomic at the DB level. If this payment ID was
    // already recorded (e.g. Razorpay retried the webhook), the insert is a
    // no-op and .returning() comes back empty, so we skip crediting again.
    // This is race-safe even if two deliveries for the same payment arrive
    // at the same instant, unlike a "check then insert" pattern would be.
    const claimed = await db.insert(processedPaymentsTable)
      .values({
        paymentId,
        userId,
        plan,
        minutesCredited: planData.minutes,
      })
      .onConflictDoNothing({ target: processedPaymentsTable.paymentId })
      .returning({ paymentId: processedPaymentsTable.paymentId });

    if (claimed.length === 0) {
      console.log(`[razorpay-webhook] Payment ${paymentId} already processed — skipping duplicate credit`);
      return res.status(200).json({ received: true, alreadyProcessed: true });
    }

    await db.update(usersTable)
      .set({
        plan,
        minutesRemaining: planData.minutes,
        minutesTotal: planData.minutes,
        minuteAllowanceResetAt: new Date(),
      })
      .where(eq(usersTable.id, userId));

    trackServer("payment_captured_server", userId, {
      plan,
      amount: body.payload?.payment?.entity?.amount,
      monthlyAllowance: planData.minutes,
    });

    // Invalidate Redis balance cache
    const redis = getRedis();
    if (redis) {
      await redis.del(`user:${userId}:balance`).catch(() => { });
    }

    console.log(`[razorpay-webhook] ${planData.minutes} min monthly allowance → user ${userId} (${plan})`);
  }

  res.status(200).json({ received: true });
});

export default router;
