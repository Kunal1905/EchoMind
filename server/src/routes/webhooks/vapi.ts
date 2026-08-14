import { Router } from "express";
import crypto from "crypto";
import { db } from "../../config/db";
import { sessionChatTable } from "../../config/schema";
import { eq, sql } from "drizzle-orm";
import { getRedis } from "../../lib/redis";
import { deductMinutesForDurationDelta } from "../../lib/minutes";
import { recordCallUsage } from "../../middleware/cost-guard";

const router = Router();

router.post("/", async (req, res) => {
  const rawBody = req.body as Buffer;
  const signature = req.headers["x-vapi-signature"] as string | undefined;
  const secret = process.env.VAPI_WEBHOOK_SECRET;

  // ✅ Fail CLOSED, not open — an unset secret used to mean "skip
  // verification and process the request anyway," which let anyone who
  // found this URL forge an end-of-call-report and drain any user's
  // minutes. Now a missing secret means the endpoint refuses everything.
  if (!secret) {
    console.error("[vapi-webhook] VAPI_WEBHOOK_SECRET not set — rejecting all requests until it's configured");
    return res.status(503).json({ error: "Webhook not configured" });
  }
  if (!signature) {
    console.warn("[vapi-webhook] Rejected: missing x-vapi-signature header");
    return res.status(401).json({ error: "Missing signature" });
  }
  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");
  const expectedBuf = Buffer.from(expected);
  const signatureBuf = Buffer.from(signature);
  if (
    expectedBuf.length !== signatureBuf.length ||
    !crypto.timingSafeEqual(expectedBuf, signatureBuf)
  ) {
    console.warn("[vapi-webhook] Rejected: signature mismatch — VAPI_WEBHOOK_SECRET must match the secret in your Vapi dashboard");
    return res.status(401).json({ error: "Invalid signature" });
  }

  let body: any;
  try {
    body = JSON.parse(rawBody.toString());
  } catch {
    return res.status(400).json({ error: "Invalid JSON" });
  }

  if (body.message?.type === "tool-calls") {
    const toolCalls = Array.isArray(body.message.toolCallList)
      ? body.message.toolCallList
      : [];
    const crisisToolCalls = toolCalls.filter(
      (toolCall: { name?: string; function?: { name?: string } }) =>
        toolCall.name === "show_crisis_support" ||
        toolCall.function?.name === "show_crisis_support",
    );

    if (crisisToolCalls.length === 0) {
      return res.status(400).json({ error: "Unsupported tool call" });
    }

    return res.status(200).json({
      results: crisisToolCalls.map((toolCall: { id: string }) => ({
        toolCallId: toolCall.id,
        result:
          "Crisis support is now visible on the user's screen. Do not read phone numbers aloud. Continue with a brief supportive safety check-in.",
      })),
    });
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

    const usageRecording = durationSec > 0
      ? recordCallUsage(userId, durationSec)
      : Promise.resolve();

    if (sessionId && durationSec > 0) {
      const [, existingSession] = await Promise.all([
        usageRecording,
        db
          .select({ durationSec: sessionChatTable.durationSec })
          .from(sessionChatTable)
          .where(eq(sessionChatTable.sessionId, sessionId))
          .limit(1),
      ]);
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
    } else {
      await usageRecording;
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
