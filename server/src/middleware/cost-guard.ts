/**
 * Cost-guard middleware for EchoMind's voice endpoints.
 *
 * Uses the Upstash Redis instance configured in the server stack.
 * Requires: npm install @upstash/redis @upstash/ratelimit
 *
 * Env vars expected (same ones your Upstash Redis client already uses):
 *   UPSTASH_REDIS_REST_URL
 *   UPSTASH_REDIS_REST_TOKEN
 */

import { Ratelimit } from "@upstash/ratelimit";
import type { Request, Response, NextFunction } from "express";
import { getAuth } from "@clerk/express";
import type { AuthedRequest } from "./auth";
import { getRedis } from "../lib/redis";
import { ensureMonthlyAllowance } from "../lib/planAllowance";

// ---------------------------------------------------------------------------
// 1. KILL SWITCH — check this first, before anything else spends money.
//    Flip it instantly from a script, an admin route, or the Upstash console
//    (SET killswitch:voice "on") if you see an abuse spike.
// ---------------------------------------------------------------------------
export async function killSwitchGuard(req: Request, res: Response, next: NextFunction) {
  try {
    const redis = getRedis();
    if (redis) {
      const disabled = await redis.get("killswitch:voice");
      if (disabled === "on") {
        return res.status(503).json({
          error: "Voice sessions are temporarily paused. Please try again shortly.",
        });
      }
    }
  } catch (error) {
    console.warn("[cost-guard] killSwitchGuard check failed:", error);
  }
  next();
}

// ---------------------------------------------------------------------------
// 2. RATE LIMITING on the call-start endpoint — stops a single user or IP
//    from spamming session creation, independent of Vapi's own concurrency cap.
// ---------------------------------------------------------------------------
let perUserLimiter: Ratelimit | null = null;
let perIpLimiter: Ratelimit | null = null;

function getLimiters() {
  const redis = getRedis();
  if (!redis) return null;

  if (!perUserLimiter) {
    perUserLimiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, "1 h"), // 5 call-starts per user per hour
      prefix: "ratelimit:user",
    });
  }

  if (!perIpLimiter) {
    perIpLimiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(15, "1 h"), // 15 call-starts per IP per hour
      prefix: "ratelimit:ip",
    });
  }

  return { perUserLimiter, perIpLimiter };
}

export async function callStartRateLimit(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const auth = getAuth(req);
    const userId = req.authUserId || auth?.userId;
    const ip = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() || req.ip;

    const limiters = getLimiters();
    if (limiters) {
      if (userId) {
        const { success } = await limiters.perUserLimiter.limit(userId);
        if (!success) {
          return res.status(429).json({
            error: "You've started a lot of sessions recently. Try again in a bit.",
          });
        }
      }

      const { success: ipOk } = await limiters.perIpLimiter.limit(ip ?? "unknown");
      if (!ipOk) {
        return res.status(429).json({
          error: "Too many requests from this network. Try again shortly.",
        });
      }
    }
  } catch (error) {
    console.warn("[cost-guard] callStartRateLimit check failed:", error);
  }

  next();
}

// ---------------------------------------------------------------------------
// 3. MONTHLY MINUTE ALLOWANCE per user. The DB minute balance is the source of
//    truth; this guard only rolls it over once per calendar month before a call.
// ---------------------------------------------------------------------------
export function monthKey(userId: string) {
  const now = new Date();
  const month = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
  return `usage:minutes:${userId}:${month}`;
}

export async function monthlyMinuteAllowanceGuard(req: AuthedRequest, res: Response, next: NextFunction) {
  const auth = getAuth(req);
  const userId = req.authUserId || auth?.userId;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  try {
    await ensureMonthlyAllowance(userId);
  } catch (error) {
    console.warn("[cost-guard] monthlyMinuteAllowanceGuard check failed:", error);
  }

  next();
}

// Call this from your Vapi "end-of-call-report" webhook handler, after you've
// verified the webhook signature — durationSeconds comes from Vapi's payload.
export async function recordCallUsage(userId: string, durationSeconds: number) {
  try {
    const redis = getRedis();
    if (redis) {
      const key = monthKey(userId);
      await redis.incrby(key, Math.round(durationSeconds));
      await redis.expire(key, 60 * 60 * 24 * 40); // auto-clean after the monthly window
    }
  } catch (error) {
    console.error("[cost-guard] recordCallUsage failed:", error);
  }
}
