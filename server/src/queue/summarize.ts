import { Router } from "express";
import { z } from "zod";
import { db } from "../config/db";
import { sessionChatTable, moodEntriesTable } from "../config/schema";
import { v4 as uuidv4 } from "uuid";
import { eq } from "drizzle-orm";
import { generateSessionSummaryWithFallback } from "../lib/sessionSummary";

const router = Router();

const summarizeJobSchema = z.object({
  sessionId: z.string(),
  notes: z.string(),
  userId: z.string(),
  moodScore: z.number().int().min(1).max(10).optional(),
});

router.post("/", async (req, res) => {
  try {
    const { sessionId, notes, userId, moodScore } = summarizeJobSchema.parse(req.body);

    const summary = await generateSessionSummaryWithFallback(notes);

    await db
      .update(sessionChatTable)
      .set({ summary })
      .where(eq(sessionChatTable.sessionId, sessionId));

    if (moodScore) {
      await db.insert(moodEntriesTable).values({
        id: uuidv4(),
        userId,
        sessionId,
        moodScore,
      });
    }

    res.json({ success: true, summary });
  } catch (error) {
    console.error("Error processing summarize job:", error);
    res.status(500).json({ success: false, error: "Failed to process job" });
  }
});

export default router;
