import { Redis } from "@upstash/redis";

let redisInstance: Redis | null = null;

export function getRedis() {
  if (redisInstance) {
    return redisInstance;
  }

  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    console.warn("Redis credentials not found, using memory fallback");
    return null;
  }

  try {
    redisInstance = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
    return redisInstance;
  } catch (error) {
    console.warn("Failed to connect to Redis, using memory fallback:", error);
    return null;
  }
}
