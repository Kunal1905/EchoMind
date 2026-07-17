import "dotenv/config";
import cors from "cors";
import express from "express";
import { clerkMiddleware } from "@clerk/express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";


import sessionChatRouter from "./routes/session-chat";
import historyRouter from "./routes/history";
import subscriptionRouter from "./routes/subscription";
import generateSummaryRouter from "./routes/generate-summary";
import vapiTokenRouter from "./routes/vapi-token";
import moodRouter from "./routes/mood";
import clerkWebhookRouter from "./routes/webhooks/clerk";
import vapiWebhookRouter from "./routes/webhooks/vapi";
import razorpayWebhookRouter from "./routes/webhooks/razorpay";
import summarizeQueueRouter from "./queue/summarize";
import myDataRouter from "./routes/my-data"

const REQUIRED = ["CLERK_SECRET_KEY", "DATABASE_URL"];
for (const key of REQUIRED) {
  if (!process.env[key]) throw new Error(`Missing required env var: ${key}`);
}
if (!process.env.CLIENT_ORIGINS && !process.env.CLIENT_ORIGIN) {
  throw new Error("Missing required env var: CLIENT_ORIGINS (or CLIENT_ORIGIN)");
}

// ⚠️ Non-fatal: calls run through the Vapi dashboard assistant, so its ID is required.
if (!process.env.VAPI_VOICE_ASSISTANT_ID) {
  console.warn(
    "⚠️  VAPI_VOICE_ASSISTANT_ID is not set — no calls can start. " +
    "Set it to your Vapi dashboard assistant ID (see server/.env.example) and redeploy."
  );
}

const app = express();
const port = Number(process.env.PORT || 4000);

// ✅ Security headers — protects against clickjacking, MIME sniffing, XSS
app.use(helmet({
  contentSecurityPolicy: false, // disabled — API server doesn't serve HTML
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));

// server/src/index.ts — replace the clientOrigin + cors block:

const rawOrigins = process.env.CLIENT_ORIGINS || process.env.CLIENT_ORIGIN || "http://localhost:3000";

// ✅ Support a comma-separated list, and defensively strip trailing slashes
const allowedOrigins = rawOrigins
  .split(",")
  .map((o) => o.trim().replace(/\/$/, "")) // strip any trailing slash
  .filter(Boolean);

if (process.env.NODE_ENV !== "production") {
  allowedOrigins.push("http://localhost:3000", "http://127.0.0.1:3000");
}

app.use(cors({
  origin: (requestOrigin, callback) => {
    // Allow non-browser requests (e.g. curl, server-to-server) with no origin header
    if (!requestOrigin) return callback(null, true);

    const cleaned = requestOrigin.replace(/\/$/, "");
    if (allowedOrigins.includes(cleaned)) {
      return callback(null, true);
    }

    console.warn(`[cors] Rejected origin: ${requestOrigin}`);
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization"],
}));

// ✅ RAW BODY for webhook routes MUST come before express.json()
// These routes need raw bytes for HMAC signature verification
app.use("/api/webhooks/clerk", express.raw({ type: "application/json" }));
app.use("/api/webhooks/vapi", express.raw({ type: "application/json" }));
app.use("/api/webhooks/razorpay", express.raw({ type: "application/json" }));
app.use("/api/queue/summarize", express.raw({ type: "application/json" }));

// JSON for all regular API routes
app.use(express.json({ limit: "1mb" }));
app.use(clerkMiddleware());

// ✅ Rate limiting — per IP (protects unauthenticated surface and general abuse)
const globalLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 120,           // 120 req/min per IP — generous for legit users
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests. Please slow down." },
  skip: (req) => req.path === "/health", // don't rate-limit health checks
});
app.use(globalLimit);

// ✅ Strict limit for expensive endpoints — 5 per minute per IP
const strictLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: { error: "Rate limit exceeded. Please wait before trying again." },
});
app.use("/api/vapi-token", strictLimit);
app.use("/api/generate-summary", strictLimit);

//Health check 
app.get("/health", (_req, res) => { res.json({ ok: true }); });

// API routes
app.use("/api/session-chat", sessionChatRouter);
app.use("/api/history", historyRouter);
app.use("/api/subscription", subscriptionRouter);
app.use("/api/generate-summary", generateSummaryRouter);
app.use("/api/vapi-token", vapiTokenRouter);
app.use("/api/mood", moodRouter);
app.use("/api/my-data", myDataRouter);

// Webhooks (raw body, no clerkMiddleware needed)
app.use("/api/webhooks/clerk", clerkWebhookRouter);
app.use("/api/webhooks/vapi", vapiWebhookRouter);
app.use("/api/webhooks/razorpay", razorpayWebhookRouter);

// Queue (QStash callbacks)
app.use("/api/queue/summarize", summarizeQueueRouter);

// ✅ Global error handler — prevents internal errors reaching the client
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("[unhandled]", err?.message || err);
  res.status(500).json({ error: "An unexpected error occurred" });
});

app.listen(port, () => {
  console.log(`EchoMind API listening on http://localhost:${port}`);
});
