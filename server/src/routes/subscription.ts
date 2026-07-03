import { Router } from "express";
import { z } from "zod";
import { db } from "../config/db";
import { usersTable } from "../config/schema";
import { requireUser, type AuthedRequest } from "../middleware/auth";
import { eq, sql } from "drizzle-orm";
import { PLANS, type PlanKey } from "../config/plans";

const router = Router();

router.get("/", requireUser, async (req: AuthedRequest, res) => {
  try {
    const userId = req.authUserId!;
    const userData = await db.select().from(usersTable).where(eq(usersTable.id, userId));

    if (userData.length === 0) {
      await db.insert(usersTable).values({
        id: userId,
        name: "User",
        email: "",
      });

      return res.json({
        plan: "free",
        minutesRemaining: PLANS.free.minutes,
        minutesTotal: 0,
        isPremium: false,
      });
    }

    const userSubscription = userData[0];

    res.json({
      plan: userSubscription.plan as PlanKey,
      minutesRemaining: userSubscription.minutesRemaining,
      minutesTotal: userSubscription.minutesTotal,
      isPremium: userSubscription.plan !== "free",
    });
  } catch (error) {
    console.error("Error fetching subscription data:", error);
    res.status(500).json({
      error: "Failed to fetch subscription data",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

const subscriptionActionSchema = z.object({
  action: z.enum(["addMinutes"]),
  minutes: z.number().int().positive().optional(),
  plan: z.enum(["basic", "pro", "premium"]).optional(),
});

router.post("/", requireUser, async (req: AuthedRequest, res) => {
  try {
    const { action, minutes, plan } = subscriptionActionSchema.parse(req.body);
    const userId = req.authUserId!;

    const userData = await db.select().from(usersTable).where(eq(usersTable.id, userId));

    if (userData.length === 0) {
      await db.insert(usersTable).values({
        id: userId,
        name: "User",
        email: "",
      });
    }

    if (action === "addMinutes") {
      const minutesToAdd = minutes ?? (plan ? PLANS[plan].minutes : 0);
      await db
        .update(usersTable)
        .set({
          minutesRemaining: sql`${usersTable.minutesRemaining} + ${minutesToAdd}`,
          minutesTotal: sql`${usersTable.minutesTotal} + ${minutesToAdd}`,
          plan: plan ? plan : usersTable.plan,
        })
        .where(eq(usersTable.id, userId));
    }

    const [updatedUser] = await db.select().from(usersTable).where(eq(usersTable.id, userId));

    res.json({
      plan: updatedUser.plan as PlanKey,
      minutesRemaining: updatedUser.minutesRemaining,
      minutesTotal: updatedUser.minutesTotal,
      isPremium: updatedUser.plan !== "free",
    });
  } catch (error) {
    console.error("Error updating subscription data:", error);
    res.status(500).json({
      error: "Failed to update subscription data",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

export default router;
