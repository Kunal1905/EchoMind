import { eq } from "drizzle-orm";
import { db } from "../config/db";
import { processedPaymentsTable, usersTable } from "../config/schema";
import { PLANS, type PurchasablePlanKey } from "../config/plans";
import { trackServer } from "./analytics";
import { getRedis } from "./redis";

type ActivatePaidPlanInput = {
  userId: string;
  plan: PurchasablePlanKey;
  paymentId: string;
  amount?: number;
};

export async function activatePaidPlan({
  userId,
  plan,
  paymentId,
  amount,
}: ActivatePaidPlanInput) {
  const planData = PLANS[plan];

  const activated = await db.transaction(async (tx) => {
    const claimed = await tx
      .insert(processedPaymentsTable)
      .values({
        paymentId,
        userId,
        plan,
        minutesCredited: planData.minutes,
      })
      .onConflictDoNothing({ target: processedPaymentsTable.paymentId })
      .returning({ paymentId: processedPaymentsTable.paymentId });

    if (claimed.length === 0) return false;

    await tx
      .update(usersTable)
      .set({
        plan,
        minutesRemaining: planData.minutes,
        minutesTotal: planData.minutes,
        minuteAllowanceResetAt: new Date(),
      })
      .where(eq(usersTable.id, userId));

    return true;
  });

  if (!activated) return { activated: false, alreadyProcessed: true };

  trackServer("payment_captured_server", userId, {
    plan,
    amount,
    monthlyAllowance: planData.minutes,
  });

  const redis = getRedis();
  if (redis) {
    await redis.del(`user:${userId}:balance`).catch(() => {});
  }

  return { activated: true, alreadyProcessed: false };
}
