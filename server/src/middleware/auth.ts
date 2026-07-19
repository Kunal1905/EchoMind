import { clerkClient, getAuth } from "@clerk/express";
import type { NextFunction, Request, Response } from "express";
import { db } from "../config/db";
import { usersTable } from "../config/schema";
import { getRedis } from "../lib/redis";

export type AuthedRequest = Request & {
  authUserId?: string;
};

function getStringClaim(claims: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = claims[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

async function getUserProfile(userId: string, claims: Record<string, unknown>) {
  const firstName = getStringClaim(claims, ["first_name", "given_name"]);
  const lastName = getStringClaim(claims, ["last_name", "family_name"]);
  let name = getStringClaim(claims, ["name", "full_name"]) ||
    `${firstName} ${lastName}`.trim();
  let email = getStringClaim(claims, ["email", "email_address"]);

  if (!name || !email) {
    try {
      const user = await clerkClient.users.getUser(userId);
      const clerkName = `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
        user.username ||
        "";
      const primaryEmail = user.emailAddresses.find((address) =>
        address.id === user.primaryEmailAddressId
      )?.emailAddress || user.emailAddresses[0]?.emailAddress || "";

      name ||= clerkName;
      email ||= primaryEmail;
    } catch (error) {
      console.warn("[auth] Could not fetch Clerk user profile:", error);
    }
  }

  return {
    name: name || "EchoMind User",
    email: email || `${userId}@clerk.local`,
  };
}

export async function requireUser(req: AuthedRequest, res: Response, next: NextFunction) {
  const auth = getAuth(req);

  if (!auth.userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  req.authUserId = auth.userId;
  const cacheKey = `user:${auth.userId}:seen`;

  try {
    const redis = getRedis();

    // ✅ Skip the DB write entirely once we've upserted this user recently.
    // Turns "one DB write per request" into "one DB write per hour per
    // active user." A Redis error here is treated as a cache miss (falls
    // through to the normal DB path), never as a request failure.
    if (redis) {
      try {
        const seen = await redis.get(cacheKey);
        if (seen) {
          return next();
        }
      } catch (redisError) {
        console.warn("[auth] Redis cache check failed, falling back to DB write:", redisError);
      }
    }

    const claims = ((auth as typeof auth & {
      sessionClaims?: Record<string, unknown>;
    }).sessionClaims) || {};
    const { name, email } = await getUserProfile(auth.userId, claims);

    await db.insert(usersTable)
      .values({
        id: auth.userId,
        name,
        email,
      })
      .onConflictDoUpdate({
        target: usersTable.id,
        set: { name, email },
      });

    if (redis) {
      // Fire-and-forget — don't make the request wait on caching its own
      // result. Worst case on failure: one extra DB write next request.
      redis.set(cacheKey, "1", { ex: 3600 }).catch((err: unknown) =>
        console.warn("[auth] Failed to cache user-seen flag:", err)
      );
    }

    next();
  } catch (error) {
    console.error("[auth] Failed to ensure user record:", error);
    res.status(500).json({ error: "Failed to prepare user account" });
  }
}