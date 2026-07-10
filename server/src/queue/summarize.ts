import { Router } from "express";
import { z } from "zod";
import { db } from "../config/db";
import { sessionChatTable, moodEntriesTable } from "../config/schema";
import { v4 as uuidv4 } from "uuid";
import { eq } from "drizzle-orm";
import { generateSessionSummaryWithFallback } from "../lib/sessionSummary";
import { getRedis } from "../lib/redis";

const router = Router();

router.post("/", async (req, res) => {
  // ✅ Verify only your own server can call this
  const secret = process.env.QUEUE_SECRET;
  if (secret && req.headers["x-queue-secret"] !== secret) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  let body: any;
  try {
    // req.body is Buffer from express.raw() in index.ts
    body = JSON.parse((req.body as Buffer).toString("utf-8"));
  } catch {
    return res.status(400).json({ error: "Invalid JSON" });
  }

  const schema = z.object({
    sessionId: z.string().max(100),
    notes:     z.string().min(20).max(50_000),  // ✅ max length
    userId:    z.string().max(100),
    moodScore: z.number().int().min(1).max(10).optional(),
  });

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid payload" });
  }

  const { sessionId, notes, userId, moodScore } = parsed.data;

  try {
    const summary = await generateSessionSummaryWithFallback(notes);

    await db.update(sessionChatTable)
      .set({ summary })
      .where(eq(sessionChatTable.sessionId, sessionId));

    if (moodScore) {
      await db.insert(moodEntriesTable).values({
        id: uuidv4(), userId, sessionId, moodScore,
      });
    }

    // Bust memory cache
    const redis = getRedis();
    if (redis) await redis.del(`user:${userId}:memory`).catch(() => {});

    res.json({ success: true });
  } catch (error) {
    console.error("[queue/summarize]", error);
    res.status(500).json({ error: "Failed to process job" });
  }
});

export default router;