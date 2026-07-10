import type { Response, NextFunction } from "express";
import type { AuthedRequest } from "./auth";
import { getRedis } from "../lib/redis";

interface Options {
  windowSec: number;
  max:       number;
  key:       string;  // e.g. "vapi-token", "generate-summary"
}

export function perUserLimit({ windowSec, max, key }: Options) {
  return async (req: AuthedRequest, res: Response, next: NextFunction) => {
    const userId = req.authUserId;
    if (!userId) return next(); // let requireUser handle auth

    const redis = getRedis();
    if (!redis) return next(); // degrade gracefully if Redis down

    const redisKey = `rl:${key}:${userId}`;
    try {
      const count = await redis.incr(redisKey);
      if (count === 1) {
        await redis.expire(redisKey, windowSec);
      }
      if (count > max) {
        return res.status(429).json({
          error: `Too many requests. You can call this endpoint ${max} times per ${windowSec} seconds.`,
          retryAfter: windowSec,
        });
      }
    } catch {
      // Redis down → let through (don't block users when cache is unavailable)
    }
    next();
  };
}