import { Router } from "express";
import crypto from "crypto";
import { db } from "../../config/db";
import { sessionChatTable } from "../../config/schema";
import { eq, sql } from "drizzle-orm";
import { getRedis } from "../../lib/redis";
import { deductMinutesForDurationDelta } from "../../lib/minutes";

const router = Router();

router.post("/", async (req, res) => {
  const rawBody = req.body as Buffer;
  const signature = req.headers["x-vapi-signature"] as string | undefined;
  const secret = process.env.VAPI_WEBHOOK_SECRET;

  // ✅ Verify Vapi HMAC signature
  if (secret) {
    if (!signature) {
      console.warn("[vapi-webhook] Rejected: missing x-vapi-signature header");
      return res.status(401).json({ error: "Missing signature" });
    }
    const expected = crypto
      .createHmac("sha256", secret)
      .update(rawBody)
      .digest("hex");
    if (!crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))) {
      console.warn("[vapi-webhook] Rejected: signature mismatch — VAPI_WEBHOOK_SECRET must match the secret in your Vapi dashboard");
      return res.status(401).json({ error: "Invalid signature" });
    }
  } else {
    console.warn("[vapi-webhook] VAPI_WEBHOOK_SECRET not set — signature verification SKIPPED (insecure; set it in env)");
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
    // userId / sessionId may live under call.metadata OR message.metadata
    const userId = (call?.metadata?.userId ?? body.message?.metadata?.userId) as string | undefined;
    const sessionId = (call?.metadata?.sessionId ?? body.message?.metadata?.sessionId) as string | undefined;

    console.log("[vapi-webhook] end-of-call-report:", {
      durationSec,
      hasCall: !!call,
      callMetadataKeys: call?.metadata ? Object.keys(call.metadata) : "(none)",
      messageMetadataKeys: body.message?.metadata ? Object.keys(body.message.metadata) : "(none)",
      userId: userId ?? "(MISSING)",
      sessionId: sessionId ?? "(MISSING)",
    });

    if (!userId) {
      console.warn("[vapi-webhook] No userId in call metadata — minutes NOT deducted. message keys:", Object.keys(body.message));
      return res.status(200).json({ received: true });
    }

    if (sessionId && durationSec > 0) {
      const existingSession = await db
        .select({ durationSec: sessionChatTable.durationSec })
        .from(sessionChatTable)
        .where(eq(sessionChatTable.sessionId, sessionId))
        .limit(1);
      const previousDurationSec = existingSession[0]?.durationSec ?? 0;
      const finalDurationSec = Math.max(previousDurationSec, durationSec);

      await db.insert(sessionChatTable)
        .values({
          sessionId,
          createdBy: userId,
          notes: null,
          summary: null,
          durationSec,
          createdAt: new Date(),
        })
        .onConflictDoUpdate({
          target: sessionChatTable.sessionId,
          set: {
            createdBy: userId,
            durationSec: sql`GREATEST(${sessionChatTable.durationSec}, ${durationSec})`,
          },
        });

      const deductedMinutes = await deductMinutesForDurationDelta(
        userId,
        previousDurationSec,
        finalDurationSec
      );

      if (deductedMinutes > 0) {
        console.log(`[vapi-webhook] -${deductedMinutes} min from user ${userId} (${finalDurationSec}s call)`);
      }
    }

    // Invalidate Redis balance cache
    const redis = getRedis();
    if (redis) {
      await redis.del(`user:${userId}:balance`).catch(() => { });
    }

    console.log(`[vapi-webhook] call ended for user ${userId} (${durationSec}s)`);
  }

  res.status(200).json({ received: true });
});

export default router;
