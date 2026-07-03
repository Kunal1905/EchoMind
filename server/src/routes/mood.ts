import { Router } from "express";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { db } from "../config/db";
import { moodEntriesTable } from "../config/schema";
import { requireUser, type AuthedRequest } from "../middleware/auth";
import { eq, desc } from "drizzle-orm";

const router = Router();

const moodEntrySchema = z.object({
  sessionId: z.string().optional(),
  moodScore: z.number().int().min(1).max(10),
});

router.post("/", requireUser, async (req: AuthedRequest, res) => {
  try {
    const { sessionId, moodScore } = moodEntrySchema.parse(req.body);
    const id = uuidv4();

    await db.insert(moodEntriesTable).values({
      id,
      userId: req.authUserId!,
      sessionId,
      moodScore,
      createdAt: new Date(),
    });

    res.json({ success: true, id });
  } catch (error) {
    console.error("Error saving mood entry:", error);
    res.status(500).json({
      error: "Failed to save mood entry",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

router.get("/", requireUser, async (req: AuthedRequest, res) => {
  try {
    const entries = await db
      .select()
      .from(moodEntriesTable)
      .where(eq(moodEntriesTable.userId, req.authUserId!))
      .orderBy(desc(moodEntriesTable.createdAt));

    res.json(entries || []);
  } catch (error) {
    console.error("Error fetching mood entries:", error);
    res.status(500).json({
      error: "Failed to fetch mood entries",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

export default router;
