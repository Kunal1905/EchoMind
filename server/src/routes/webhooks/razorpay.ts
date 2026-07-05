import { Router } from "express";
import crypto from "crypto";
import { db } from "../../config/db";
import { usersTable } from "../../config/schema";
import { eq, sql } from "drizzle-orm";
import { PLANS, type PlanKey } from "../../config/plans";
import { getRedis } from "../../lib/redis";

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
    const plan   = notes.plan  as PlanKey | undefined;

    if (!userId || !plan || !PLANS[plan]) {
      console.warn("[razorpay-webhook] Missing userId or invalid plan in notes:", notes);
      return res.status(200).json({ received: true }); // 200 so Razorpay doesn't retry
    }

    const planData = PLANS[plan];

    await db.update(usersTable)
      .set({
        plan,
        minutesRemaining: sql`${usersTable.minutesRemaining} + ${planData.minutes}`,
        minutesTotal:     sql`${usersTable.minutesTotal}     + ${planData.minutes}`,
      })
      .where(eq(usersTable.id, userId));

    // Invalidate Redis balance cache
    const redis = getRedis();
    if (redis) {
      await redis.del(`user:${userId}:balance`).catch(() => {});
    }

    console.log(`[razorpay-webhook] +${planData.minutes} min → user ${userId} (${plan})`);
  }

  res.status(200).json({ received: true });
});

export default router;