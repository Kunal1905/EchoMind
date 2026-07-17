import { clerkClient, getAuth } from "@clerk/express";
import type { NextFunction, Request, Response } from "express";
import { db } from "../config/db";
import { usersTable } from "../config/schema";

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

  try {
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

    next();
  } catch (error) {
    console.error("[auth] Failed to ensure user record:", error);
    res.status(500).json({ error: "Failed to prepare user account" });
  }
}
