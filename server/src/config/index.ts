import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";

if (!process.env.DATABASE_URL) {
  throw new Error("Missing DATABASE_URL");
}

// Note: this file isn't currently imported anywhere (db.ts is used instead) —
// kept in sync with the same driver fix in case that changes.
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.on("error", (err: Error) => console.error("[config/index] pool error:", err));

export const db = drizzle({
  client: pool,
  logger: process.env.NODE_ENV === "development",
});