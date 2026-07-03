import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

if (!process.env.DATABASE_URL_POOLED) {
  throw new Error("Missing DATABASE_URL_POOLED");
}

const sql = neon(process.env.DATABASE_URL_POOLED);

export const dbPooled = drizzle({
  client: sql,
  logger: process.env.NODE_ENV === "development",
});
