import { eq, sql } from "drizzle-orm";
import { db } from "../config/db";
import { processedPaymentsTable, usersTable } from "../config/schema";
import { PLANS, type PaidPlanKey } from "../config/plans";
import { trackServer } from "./analytics";
import { getRedis } from "./redis";

type ActivatePaidPlanInput = {
  userId: string;
  plan: PaidPlanKey;
  paymentId: string;
  amount?: number;
  currency?: string;
  paymentMethod?: string;
  cardLast4?: string;
  billingEmail?: string;
};

export async function activatePaidPlan({
  userId,
  plan,
  paymentId,
  amount,
  currency = "INR",
  paymentMethod,
  cardLast4,
  billingEmail,
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
        amountPaid: amount,
        currency,
        paymentMethod,
        cardLast4,
        billingEmail,
      })
      .onConflictDoNothing({ target: processedPaymentsTable.paymentId })
      .returning({ paymentId: processedPaymentsTable.paymentId });

    if (claimed.length === 0) return false;

    const balanceUpdate = planData.billingModel === "pack"
      ? {
          plan,
          minutesRemaining: sql`${usersTable.minutesRemaining} + ${planData.minutes}`,
          minutesTotal: sql`${usersTable.minutesTotal} + ${planData.minutes}`,
        }
      : {
          plan,
          minutesRemaining: planData.minutes,
          minutesTotal: planData.minutes,
          minuteAllowanceResetAt: new Date(),
        };

    await tx
      .update(usersTable)
      .set(balanceUpdate)
      .where(eq(usersTable.id, userId));

    return true;
  });

  if (!activated) return { activated: false, alreadyProcessed: true };

  trackServer("payment_captured_server", userId, {
    plan,
    amount,
    minutesCredited: planData.minutes,
    billingModel: planData.billingModel,
  });

  const redis = getRedis();
  if (redis) {
    await redis.del(`user:${userId}:balance`).catch(() => {});
  }

  return { activated: true, alreadyProcessed: false };
}
