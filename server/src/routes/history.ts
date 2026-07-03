import { Router } from "express";
import { dbPooled } from "../config/db-pooled";
import { sessionChatTable } from "../config/schema";
import { requireUser, type AuthedRequest } from "../middleware/auth";
import { eq, desc } from "drizzle-orm";

const router = Router();

router.get("/", requireUser, async (req: AuthedRequest, res) => {
  try {
    const sessions = await dbPooled
      .select()
      .from(sessionChatTable)
      .where(eq(sessionChatTable.createdBy, req.authUserId!))
      .orderBy(desc(sessionChatTable.createdAt));

    res.json(sessions || []);
  } catch (error) {
    console.error("Error fetching history:", error);
    res.status(500).json({
      error: "Failed to fetch history",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

export default router;
