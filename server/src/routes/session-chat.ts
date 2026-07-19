import { Router } from "express";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { db } from "../config/db";
import { sessionChatTable, moodEntriesTable } from "../config/schema";
import { requireUser, type AuthedRequest } from "../middleware/auth";
import { eq, desc, and, sql } from "drizzle-orm";
import { perUserLimit } from "../middleware/per-user-rate-limit";
import { getRedis } from "../lib/redis";
import { generateSessionSummaryWithFallback } from "../lib/sessionSummary";
import { deductMinutesForDurationDelta } from "../lib/minutes";


const router = Router();

// Replace the schema:
const sessionChatSchema = z.object({
  sessionId: z.string().min(1).max(100).optional(),
  notes: z.string().max(50_000).optional().default("No transcript captured for this session."),
  durationSec: z.number().int().min(0).max(7200).optional().default(0),
});

router.post("/",
  requireUser,
  perUserLimit({ windowSec: 3600, max: 20, key: "session-save" }),
  async (req: AuthedRequest, res) => {
    try {
      const parsedBody = sessionChatSchema.parse(req.body);
      const { sessionId, durationSec } = parsedBody;
      const notes = parsedBody.notes.trim() || "No transcript captured for this session.";
      const finalSessionId = sessionId || uuidv4();
      const existingSession = await db
        .select({ durationSec: sessionChatTable.durationSec, createdBy: sessionChatTable.createdBy })
        .from(sessionChatTable)
        .where(eq(sessionChatTable.sessionId, finalSessionId))
        .limit(1);

      // ✅ Ownership check — a session that already belongs to someone else
      // can't be overwritten just because the caller knows/guesses its ID.
      // (createdBy is null right after the Vapi webhook creates the row
      // before this endpoint ever runs, so null is treated as "unclaimed".)
      if (existingSession[0] && existingSession[0].createdBy && existingSession[0].createdBy !== req.authUserId) {
        return res.status(403).json({ error: "This session belongs to a different account" });
      }

      const previousDurationSec = existingSession[0]?.durationSec ?? 0;
      const finalDurationSec = Math.max(previousDurationSec, durationSec);

      //save immediately, respond fast
      await db.insert(sessionChatTable)
        .values({
          sessionId: finalSessionId,
          createdBy: req.authUserId!,
          notes,
          summary: null,     // filled right after, by the direct call below
          durationSec,
          createdAt: new Date(),
        })
        .onConflictDoUpdate({  // ✅ idempotent — duplicate saves don't crash
          target: sessionChatTable.sessionId,
          set: {
            createdBy: req.authUserId!,
            notes,
            durationSec: sql`GREATEST(${sessionChatTable.durationSec}, ${durationSec})`,
          },
        });

      const deductedMinutes = await deductMinutesForDurationDelta(
        req.authUserId!,
        previousDurationSec,
        finalDurationSec
      );
      if (deductedMinutes > 0) {
        console.log(`[session-chat] -${deductedMinutes} min from user ${req.authUserId} (${finalDurationSec}s call)`);
      }

      res.json({ success: true, sessionId: finalSessionId, deductedMinutes, durationSec: finalDurationSec });

      // ✅ Generate + store the summary AFTER responding, by calling the function
      // directly (no HTTP round-trip to /api/queue/summarize that can 404 / fail
      // silently). generateSessionSummaryWithFallback always returns a string
      // (real Gemini summary, or a fallback if Gemini is over-quota/unavailable).
      generateSessionSummaryWithFallback(notes)
        .then((summary) =>
          db.update(sessionChatTable)
            .set({ summary })
            .where(eq(sessionChatTable.sessionId, finalSessionId))
        )
        .catch((e) => console.error("[session-chat] summary generation failed:", e));
    } catch (error) {
      console.error("Session save error:", error);
      res.status(500).json({
        error: "Failed to save session",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

router.get("/", requireUser, async (req: AuthedRequest, res) => {
  try {
    const { sessionId } = req.query;
    if (sessionId) {
      const result = await db
        .select()
        .from(sessionChatTable)
        .where(
          and(
            eq(sessionChatTable.sessionId, sessionId as string),
            eq(sessionChatTable.createdBy, req.authUserId!)   // ← this line was missing
          )
        );

      if (!result[0]) {
        return res.status(404).json({ error: "Session not found" });
      }
      return res.json(result[0]);
    } else {
      const result = await db
        .select()
        .from(sessionChatTable)
        .where(eq(sessionChatTable.createdBy, req.authUserId!))
        .orderBy(desc(sessionChatTable.createdAt));
      return res.json(result);
    }
  } catch (error) {
    console.error("Error fetching sessions:", error);
    res.status(500).json({
      error: "Failed to fetch sessions",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

router.delete("/:sessionId", requireUser, async (req: AuthedRequest, res) => {
  try {
    const sessionId = req.params.sessionId as string;
    const userId = req.authUserId!;


    // 1. Delete associated mood entries
    await db
      .delete(moodEntriesTable)
      .where(
        and(
          eq(moodEntriesTable.sessionId, sessionId),
          eq(moodEntriesTable.userId, userId)
        )
      );

    // 2. Delete the session chat itself
    await db
      .delete(sessionChatTable)
      .where(
        and(
          eq(sessionChatTable.sessionId, sessionId),
          eq(sessionChatTable.createdBy, userId)
        )
      );

    // Bust memory cache so deleted session no longer appears in future memory context
    const redis = getRedis();
    if (redis) await redis.del(`user:${req.authUserId!}:memory`).catch(() => { });
    res.json({ success: true });
  } catch (error) {
    console.error("Session delete error:", error);
    res.status(500).json({
      error: "Failed to delete session",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

export default router;