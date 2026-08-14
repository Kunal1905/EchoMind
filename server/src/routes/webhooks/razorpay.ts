import { Router } from "express";
import crypto from "crypto";
import { PLANS, isPurchasablePlan, type PlanKey } from "../../config/plans";
import { activatePaidPlan } from "../../lib/activatePaidPlan";

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

  const expectedBuffer = Buffer.from(expectedSignature, "hex");
  const signatureBuffer = Buffer.from(signature || "", "hex");
  if (
    signatureBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(expectedBuffer, signatureBuffer)
  ) {
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

    const result = await activatePaidPlan({
      userId,
      plan,
      paymentId,
      amount: body.payload?.payment?.entity?.amount,
    });

    if (result.alreadyProcessed) {
      console.log(`[razorpay-webhook] Payment ${paymentId} already processed — skipping duplicate credit`);
      return res.status(200).json({ received: true, alreadyProcessed: true });
    }

    console.log(`[razorpay-webhook] ${PLANS[plan].minutes} min monthly allowance → user ${userId} (${plan})`);
  }

  res.status(200).json({ received: true });
});

export default router;
