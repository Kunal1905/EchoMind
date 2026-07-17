import { Router } from "express";
import Razorpay from "razorpay";
import { db } from "../config/db";
import { usersTable } from "../config/schema";
import { requireUser, type AuthedRequest } from "../middleware/auth";
import { eq } from "drizzle-orm";
import { PLANS, type PlanKey } from "../config/plans";

const router = Router();

const razorpay = new Razorpay({
  key_id:     process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

// ✅ GET — read subscription (safe, read-only)
router.get("/", requireUser, async (req: AuthedRequest, res) => {
  try {
    const rows = await db.select().from(usersTable).where(eq(usersTable.id, req.authUserId!));
    if (!rows[0]) {
      return res.status(404).json({ error: "User not found. Please sign out and back in." });
    }
    const u = rows[0];
    const freeTrialLimit = PLANS.free.minutes;
    const freeTrialUsed = u.plan === "free"
      ? Math.min(freeTrialLimit, Math.max(0, freeTrialLimit - u.minutesRemaining))
      : freeTrialLimit;

    res.json({
      plan:             u.plan as PlanKey,
      minutesRemaining: u.minutesRemaining,
      minutesTotal:     u.plan === "free" ? freeTrialLimit : u.minutesTotal,
      freeTrialUsed,
      freeTrialLimit,
      isPremium:        u.plan !== "free",
    });
  } catch (error) {
    console.error("[subscription GET]", error);
    res.status(500).json({ error: "Failed to fetch subscription" });
  }
});

// ✅ POST /create-order — only creates a Razorpay order, never adds minutes directly
// Minutes are ONLY added by the Razorpay webhook after payment.captured is verified
router.post("/create-order", requireUser, async (req: AuthedRequest, res) => {
  const { planId } = req.body as { planId: PlanKey };
  const plan = PLANS[planId];

  if (!plan || plan.price === 0) {
    return res.status(400).json({ error: "Invalid plan" });
  }

  try {
    const order = await razorpay.orders.create({
      amount:   plan.price * 100, // paise
      currency: "INR",
      receipt:  `em_${req.authUserId!.slice(-8)}_${Date.now()}`,
      notes: {
        userId: req.authUserId!,
        plan:   planId,
      },
    });

    res.json({ orderId: order.id, amount: order.amount, currency: order.currency });
  } catch (error) {
    console.error("[subscription create-order]", error);
    res.status(500).json({ error: "Failed to create payment order" });
  }
});

// ❌ NO POST / with addMinutes — removed entirely
// Minute addition happens ONLY in webhooks/razorpay.ts after payment.captured

export default router;
