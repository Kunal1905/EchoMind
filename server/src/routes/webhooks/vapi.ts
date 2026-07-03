import { Router } from "express";
import { db } from "../../config/db";
import { usersTable } from "../../config/schema";
import { eq, sql } from "drizzle-orm";
import { getRedis } from "../../lib/redis";

const router = Router();

router.post("/", async (req, res) => {
  try {
    const { type, call } = req.body;

    if (type === "call.ended") {
      const userId = call.assistantVariables?.userId;
      const durationSeconds = call.endedAt - call.startedAt;
      const durationMinutes = Math.ceil(durationSeconds / 60);
      const transcript = call.transcript;

      if (userId) {
        await db
          .update(usersTable)
          .set({
            minutesRemaining: sql`GREATEST(${usersTable.minutesRemaining} - ${durationMinutes}, 0)`,
          })
          .where(eq(usersTable.id, userId));

        const redis = getRedis();
        if (redis && transcript) {
          const existingMemory = (await redis.get(`user:${userId}:memory`)) || "";
          const newMemory = `${existingMemory}\n---\n${new Date().toISOString()}\n${transcript}`;
          await redis.set(`user:${userId}:memory`, newMemory, { ex: 86400 * 30 });
        }

        console.log("Call ended, updated user minutes:", userId);
      }
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error processing Vapi webhook:", error);
    res.status(500).json({ success: false, error: "Failed to process webhook" });
  }
});

export default router;
