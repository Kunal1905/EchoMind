import { Router } from "express";
import { db } from "../config/db";
import { dbPooled } from "../config/db-pooled";
import { usersTable, sessionChatTable, moodEntriesTable } from "../config/schema";
import { requireUser, type AuthedRequest } from "../middleware/auth";
import { eq, and } from "drizzle-orm";
import { getRedis } from "../lib/redis";

const router = Router();

// GET /api/my-data — what Echo knows about this user
router.get("/", requireUser, async (req: AuthedRequest, res) => {
  const userId = req.authUserId!;
  const [user, sessions, moods] = await Promise.all([
    db.select().from(usersTable).where(eq(usersTable.id, userId)),
    dbPooled.select({ sessionId: sessionChatTable.sessionId, summary: sessionChatTable.summary, createdAt: sessionChatTable.createdAt })
      .from(sessionChatTable).where(eq(sessionChatTable.createdBy, userId)),
    dbPooled.select().from(moodEntriesTable).where(eq(moodEntriesTable.userId, userId)),
  ]);

  res.json({
    account: {
      plan:             user[0]?.plan,
      minutesRemaining: user[0]?.minutesRemaining,
      memoryConsent:    user[0]?.memoryConsent,
    },
    sessions: sessions.map(s => ({
      sessionId:  s.sessionId,
      createdAt:  s.createdAt,
      hasSummary: !!s.summary,
    })),
    moodEntries: moods.length,
    dataStored: [
      "Session summaries (AI-generated, not raw transcripts)",
      "Mood scores (1-10) per session",
      "Your name and email (from sign-up)",
      "Minutes used / plan tier",
    ],
    dataNotStored: [
      "Raw audio recordings",
      "Full conversation transcripts after summary generation",
      "Location data",
      "Device identifiers",
    ],
  });
});

// POST /api/my-data/consent — give or withdraw memory consent
router.post("/consent", requireUser, async (req: AuthedRequest, res) => {
  const { granted } = req.body as { granted: boolean };
  await db.update(usersTable)
    .set({
      memoryConsent:   granted,
      memoryConsentAt: granted ? new Date() : null,
    })
    .where(eq(usersTable.id, req.authUserId!));

  // If withdrawing, clear memory cache
  if (!granted) {
    const redis = getRedis();
    if (redis) await redis.del(`user:${req.authUserId!}:memory`).catch(() => {});
  }

  res.json({ success: true, memoryConsent: granted });
});

// DELETE /api/my-data/session/:sessionId — delete one session
router.delete("/session/:sessionId", requireUser, async (req: AuthedRequest, res) => {
  const sessionId = String(req.params.sessionId);

  await db.delete(sessionChatTable)
    .where(
      and(
        eq(sessionChatTable.sessionId, sessionId),
        eq(sessionChatTable.createdBy, req.authUserId!)   // ownership check
      )
    );

  // Bust memory cache so deleted session is no longer injected
  const redis = getRedis();
  if (redis) await redis.del(`user:${req.authUserId!}:memory`).catch(() => {});

  res.json({ success: true });
});

// DELETE /api/my-data/all — delete all data (right to erasure — DPDP Act)
router.delete("/all", requireUser, async (req: AuthedRequest, res) => {
  const userId = req.authUserId!;

  await Promise.all([
    db.delete(sessionChatTable).where(eq(sessionChatTable.createdBy, userId)),
    db.delete(moodEntriesTable).where(eq(moodEntriesTable.userId, userId)),
  ]);

  // Reset minutes but keep account (they paid for it)
  await db.update(usersTable)
    .set({ memoryConsent: false, memoryConsentAt: null })
    .where(eq(usersTable.id, userId));

  const redis = getRedis();
  if (redis) {
    await Promise.all([
      redis.del(`user:${userId}:memory`),
      redis.del(`user:${userId}:balance`),
    ]).catch(() => {});
  }

  res.json({ success: true, message: "All session data deleted." });
});

export default router;