import { Router } from "express";
import { z } from "zod";
import { requireUser, type AuthedRequest } from "../middleware/auth";
import { generateSessionSummary } from "../lib/sessionSummary";
import { perUserLimit } from "../middleware/per-user-rate-limit";

const router = Router();

const generateSummarySchema = z.object({
  notes: z.string().min(20).max(50_000),
});

router.post("/", 
  requireUser,
  perUserLimit({ windowSec: 60, max: 5, key: "generate-summary"}),
  async (req: AuthedRequest, res) => {
  try {
    const { notes } = generateSummarySchema.parse(req.body);
    res.json({ summary: await generateSessionSummary(notes) });
  } catch (error) {
    console.error("Generate summary error:", error);
    res.status(500).json({
      error: "Failed to generate summary",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

export default router;
