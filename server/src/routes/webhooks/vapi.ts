import { Router } from "express";
import crypto from "crypto";
import { db } from "../../config/db";
import { usersTable, sessionChatTable } from "../../config/schema";
import { eq, sql } from "drizzle-orm";
import { getRedis } from "../../lib/redis";

const router = Router();

router.post("/", async (req, res) => {
  const rawBody  = req.body as Buffer;
  const signature = req.headers["x-vapi-signature"] as string | undefined;
  const secret    = process.env.VAPI_WEBHOOK_SECRET;

  // ✅ Verify Vapi HMAC signature
  if (secret) {
    if (!signature) {
      return res.status(401).json({ error: "Missing signature" });
    }
    const expected = crypto
      .createHmac("sha256", secret)
      .update(rawBody)
      .digest("hex");
    if (!crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))) {
      return res.status(401).json({ error: "Invalid signature" });
    }
  }

  let body: any;
  try {
    body = JSON.parse(rawBody.toString());
  } catch {
    return res.status(400).json({ error: "Invalid JSON" });
  }

  // ✅ Correct event type from Vapi
  if (body.message?.type === "end-of-call-report") {
    const call = body.message.call;

    // ✅ Correct duration field from Vapi payload
    const durationSec = Math.ceil(call?.durationSeconds ?? 0);
    const durationMin = Math.ceil(durationSec / 60);

    // userId and sessionId come from metadata set in vapi-token.ts
    const userId    = call?.metadata?.userId    as string | undefined;
    const sessionId = call?.metadata?.sessionId as string | undefined;

    if (!userId) {
      console.warn("[vapi-webhook] No userId in call metadata");
      return res.status(200).json({ received: true });
    }

    // ✅ Deduct minutes (never go below 0)
    await db.update(usersTable)
      .set({
        minutesRemaining: sql`GREATEST(${usersTable.minutesRemaining} - ${durationMin}, 0)`,
        minutesTotal:     sql`${usersTable.minutesTotal} + ${durationMin}`,
      })
      .where(eq(usersTable.id, userId));

    // Update session duration if we know the sessionId
    if (sessionId && durationSec > 0) {
      await db.update(sessionChatTable)
        .set({ durationSec })
        .where(eq(sessionChatTable.sessionId, sessionId));
    }

    // Invalidate Redis balance cache
    const redis = getRedis();
    if (redis) {
      await redis.del(`user:${userId}:balance`).catch(() => {});
    }

    console.log(`[vapi-webhook] -${durationMin} min from user ${userId} (${durationSec}s call)`);
  }

  res.status(200).json({ received: true });
});

export default router;