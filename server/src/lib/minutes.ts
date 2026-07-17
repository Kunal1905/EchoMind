import { eq, sql } from "drizzle-orm";
import { db } from "../config/db";
import { usersTable } from "../config/schema";
import { getRedis } from "./redis";

export function toBillableMinutes(durationSec?: number | null) {
  return Math.max(0, Math.ceil(Math.max(0, durationSec ?? 0) / 60));
}

export async function deductMinutesForDurationDelta(
  userId: string,
  previousDurationSec?: number | null,
  nextDurationSec?: number | null
) {
  const previousMinutes = toBillableMinutes(previousDurationSec);
  const nextMinutes = toBillableMinutes(nextDurationSec);
  const minutesToDeduct = Math.max(0, nextMinutes - previousMinutes);

  if (minutesToDeduct === 0) {
    return 0;
  }

  await db.update(usersTable)
    .set({
      minutesRemaining: sql`GREATEST(${usersTable.minutesRemaining} - ${minutesToDeduct}, 0)`,
      minutesTotal: sql`${usersTable.minutesTotal} + ${minutesToDeduct}`,
    })
    .where(eq(usersTable.id, userId));

  const redis = getRedis();
  if (redis) {
    await redis.del(`user:${userId}:balance`).catch(() => {});
  }

  return minutesToDeduct;
}
