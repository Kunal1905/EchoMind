import { Router } from "express";
import { requireUser, type AuthedRequest } from "../middleware/auth";
import { db } from "../config/db";
import { usersTable } from "../config/schema";
import { eq } from "drizzle-orm";
import { getRedis } from "../lib/redis";

const router = Router();

router.post("/", requireUser, async (req: AuthedRequest, res) => {
  try {
    const userId = req.authUserId!;
    const userData = await db.select().from(usersTable).where(eq(usersTable.id, userId));

    if (userData.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = userData[0];
    const maxDurationSeconds = user.minutesRemaining * 60;

    const { memoryConsent } = req.body;
    const redis = getRedis();
    let memory = "";
    if (memoryConsent && redis) {
      const storedMemory = await redis.get(`user:${userId}:memory`);
      if (storedMemory) {
        memory = storedMemory as string;
      }
    }


    const token = {
      assistant: {
        firstMessage: "Hey there! How are you feeling today?",
        model: {
          provider: "openai",
          model: "gpt-4o-mini",
          messages: memory ? [{ role: "system", content: memory }] : [],
        },
        voice: {
          provider: "elevenlabs",
          voiceId: "pNInz6obpgDQGcFmaJgB",
        },
        maxDurationSeconds,
      },
    };

    res.json(token);
  } catch (error) {
    console.error("Error generating Vapi token:", error);
    res.status(500).json({
      error: "Failed to generate Vapi token",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

export default router;
