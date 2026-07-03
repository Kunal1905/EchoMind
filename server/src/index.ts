import "dotenv/config";
import cors from "cors";
import express from "express";
import { clerkMiddleware } from "@clerk/express";

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

const app = express();
const port = Number(process.env.PORT || 4000);
const clientOrigin = process.env.CLIENT_ORIGIN || "http://localhost:3000";

app.use(
  cors({
    origin: clientOrigin,
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(clerkMiddleware());

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/api/session-chat", sessionChatRouter);
app.use("/api/history", historyRouter);
app.use("/api/subscription", subscriptionRouter);
app.use("/api/generate-summary", generateSummaryRouter);
app.use("/api/vapi-token", vapiTokenRouter);
app.use("/api/mood", moodRouter);
app.use("/api/webhooks/clerk", clerkWebhookRouter);
app.use("/api/webhooks/vapi", vapiWebhookRouter);
app.use("/api/webhooks/razorpay", razorpayWebhookRouter);
app.use("/api/queue/summarize", summarizeQueueRouter);

app.listen(port, () => {
  console.log(`EchoMind API listening on http://localhost:${port}`);
});
