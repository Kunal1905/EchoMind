import { Router } from "express";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { db } from "../config/db";
import { sessionChatTable } from "../config/schema";
import { requireUser, type AuthedRequest } from "../middleware/auth";
import { generateSessionSummaryWithFallback } from "../lib/sessionSummary";
import { eq, desc, and } from "drizzle-orm";

const router = Router();

const sessionChatSchema = z.object({
  sessionId: z.string().min(1).optional(),
  notes: z.string().min(20),
  durationSec: z.number().int().optional().default(0),
});

router.post("/", requireUser, async (req: AuthedRequest, res) => {
  try {
    const { sessionId, notes, durationSec } = sessionChatSchema.parse(req.body);
    const finalSessionId = sessionId || uuidv4();
    const finalSummary = await generateSessionSummaryWithFallback(notes);

    await db.insert(sessionChatTable).values({
      sessionId: finalSessionId,
      createdBy: req.authUserId!,
      notes,
      summary: finalSummary,
      durationSec,
      createdAt: new Date(),
    });

    res.json({ success: true, summary: finalSummary, sessionId: finalSessionId });
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

export default router;
