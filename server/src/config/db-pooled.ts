import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";

if (!process.env.DATABASE_URL) {
  throw new Error("Missing DATABASE_URL_POOLED");
}

// ✅ Switched from neon-http (one HTTPS round-trip per query — built for
// edge/serverless functions that can't hold a connection open) to a real
// pooled connection. This server is a long-running process (app.listen()),
// so it should keep a warm pool instead of paying a fresh handshake on
// every single query — including the one that runs on every authenticated
// request in requireUser(). Node 22+ has a native WebSocket global, so no
// `ws` package is needed here (only required on Node 21 and below).
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.on("error", (err: Error) => console.error("[db] pool error:", err));

export const dbPooled = drizzle({
  client: pool,
  logger: process.env.NODE_ENV === "development",
});
