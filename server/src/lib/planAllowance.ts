import { eq } from "drizzle-orm";
import { db } from "../config/db";
import { PLANS, type PlanKey } from "../config/plans";
import { usersTable } from "../config/schema";
import { getRedis } from "./redis";

function monthKey(date: Date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function isSameCalendarMonth(a?: Date | null, b = new Date()) {
  if (!a) return false;
  return monthKey(a) === monthKey(b);
}

export function getPlanAllowance(planId: string) {
  const plan = PLANS[planId as PlanKey] ?? PLANS.free;
  return plan.minutes;
}

export async function ensureMonthlyAllowance(userId: string) {
  const rows = await db
    .select({
      plan: usersTable.plan,
      resetAt: usersTable.minuteAllowanceResetAt,
    })
    .from(usersTable)
    .where(eq(usersTable.id, userId))
    .limit(1);

  const user = rows[0];
  if (!user || isSameCalendarMonth(user.resetAt)) return;

  const plan = PLANS[user.plan as PlanKey] ?? PLANS.free;
  // Minute packs are purchased balances, not subscriptions. They never expire
  // and must not be silently replenished without another captured payment.
  if (plan.billingModel === "pack") return;

  const allowance = plan.minutes;
  await db
    .update(usersTable)
    .set({
      minutesRemaining: allowance,
      minutesTotal: allowance,
      minuteAllowanceResetAt: new Date(),
    })
    .where(eq(usersTable.id, userId));

  const redis = getRedis();
  if (redis) {
    await redis.del(`user:${userId}:balance`).catch(() => {});
  }
}
