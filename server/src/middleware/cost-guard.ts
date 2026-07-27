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
// 3. DAILY MINUTE CAP per user — the actual cost-control lever. Check BEFORE
//    starting a Vapi call; increment AFTER the call ends via Vapi's webhook.
// ---------------------------------------------------------------------------
export const FREE_TIER_DAILY_MINUTE_CAP = 15; // tune this to your real budget

export function todayKey(userId: string) {
  const date = new Date().toISOString().slice(0, 10); // YYYY-MM-DD, resets daily
  return `usage:minutes:${userId}:${date}`;
}

export async function dailyMinuteCapGuard(req: AuthedRequest, res: Response, next: NextFunction) {
  const auth = getAuth(req);
  const userId = req.authUserId || auth?.userId;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  try {
    const redis = getRedis();
    if (redis) {
      const usedSeconds = Number((await redis.get<number>(todayKey(userId))) ?? 0);
      const usedMinutes = usedSeconds / 60;

      if (usedMinutes >= FREE_TIER_DAILY_MINUTE_CAP) {
        return res.status(429).json({
          error: `Daily voice limit reached (${FREE_TIER_DAILY_MINUTE_CAP} min). Resets at midnight, or upgrade for more.`,
        });
      }
    }
  } catch (error) {
    console.warn("[cost-guard] dailyMinuteCapGuard check failed:", error);
  }

  next();
}

// Call this from your Vapi "end-of-call-report" webhook handler, after you've
// verified the webhook signature — durationSeconds comes from Vapi's payload.
export async function recordCallUsage(userId: string, durationSeconds: number) {
  try {
    const redis = getRedis();
    if (redis) {
      const key = todayKey(userId);
      await redis.incrby(key, Math.round(durationSeconds));
      await redis.expire(key, 60 * 60 * 26); // auto-clean ~a day after the window
    }
  } catch (error) {
    console.error("[cost-guard] recordCallUsage failed:", error);
  }
}
