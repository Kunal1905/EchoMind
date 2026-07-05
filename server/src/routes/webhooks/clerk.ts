import { Router } from "express";
import { Webhook } from "svix";
import { db } from "../../config/db";
import { usersTable } from "../../config/schema";
import { eq } from "drizzle-orm";

const router = Router();

router.post("/", async (req, res) => {
  const secret = process.env.CLERK_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[clerk-webhook] CLERK_WEBHOOK_SECRET not set");
    return res.status(500).json({ error: "Server misconfigured" });
  }

  // req.body is a Buffer because of express.raw() in index.ts
  const rawBody = (req.body as Buffer).toString("utf-8");

  const wh = new Webhook(secret);
  let evt: any;

  try {
    // ✅ Verify with ORIGINAL raw body bytes — not re-serialized JSON
    evt = wh.verify(rawBody, {
      "svix-id":        req.headers["svix-id"]        as string,
      "svix-timestamp": req.headers["svix-timestamp"] as string,
      "svix-signature": req.headers["svix-signature"] as string,
    });
  } catch (err) {
    console.warn("[clerk-webhook] Invalid signature:", err);
    return res.status(400).json({ error: "Invalid signature" });
  }

  if (evt.type === "user.created") {
    const { id, first_name, last_name, email_addresses } = evt.data;
    const email = email_addresses?.[0]?.email_address || "";
    const name  = `${first_name || ""} ${last_name || ""}`.trim() || "User";

    const existing = await db.select().from(usersTable).where(eq(usersTable.id, id));
    if (existing.length === 0) {
      await db.insert(usersTable).values({ id, name, email });
      console.log("[clerk-webhook] Created user:", id);
    }
  }

  res.status(200).json({ success: true });
});

export default router;