import { Router } from "express";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { db } from "../config/db";
import { sessionChatTable, moodEntriesTable } from "../config/schema";
import { requireUser, type AuthedRequest } from "../middleware/auth";
import { generateSessionSummaryWithFallback } from "../lib/sessionSummary";
import { eq, desc, and } from "drizzle-orm";
import { perUserLimit } from "../middleware/per-user-rate-limit";


const router = Router();

// Replace the schema:
const sessionChatSchema = z.object({
  sessionId: z.string().min(1).max(100).optional(),
  notes: z.string().min(20).max(50_000),   // ✅ 50K chars ~ 10,000 words
  durationSec: z.number().int().min(0).max(7200).optional().default(0),
});

router.post("/",
  requireUser,
  perUserLimit({ windowSec: 3600, max: 20, key: "session-save" }),
  async (req: AuthedRequest, res) => {
    try {
      const { sessionId, notes, durationSec } = sessionChatSchema.parse(req.body);
      const finalSessionId = sessionId || uuidv4();

      //save immediately don't wait for gemini 
      await db.insert(sessionChatTable)
        .values({
          sessionId: finalSessionId,
          createdBy: req.authUserId!,
          notes,
          summary: null,     // filled by async job
          durationSec,
          createdAt: new Date(),
        })
        .onConflictDoUpdate({  // ✅ idempotent — duplicate saves don't crash
          target: sessionChatTable.sessionId,
          set: { notes, durationSec },
        });

      // ✅ Non-blocking background summary generation
      const appUrl = process.env.APP_URL || `http://localhost:${process.env.PORT || 4000}`;
      const queueSec = process.env.QUEUE_SECRET || "";
      fetch(`${appUrl}/api/queue/summarize`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-queue-secret": queueSec },
        body: JSON.stringify({ sessionId: finalSessionId, notes, userId: req.authUserId! }),
      }).catch(err => console.error("[session-chat] queue enqueue failed:", err));

      res.json({ success: true, sessionId: finalSessionId });
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

