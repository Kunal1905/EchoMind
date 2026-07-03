import { Router } from "express";
import { Webhook } from "svix";
import { db } from "../../config/db";
import { usersTable } from "../../config/schema";
import { eq } from "drizzle-orm";

const router = Router();

router.post("/", async (req, res) => {
  try {
    const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;
    if (!WEBHOOK_SECRET) {
      throw new Error("Missing CLERK_WEBHOOK_SECRET");
    }

    const payload = JSON.stringify(req.body);
    const headers = req.headers;

    const wh = new Webhook(WEBHOOK_SECRET);
    const evt = wh.verify(payload, {
      "svix-id": headers["svix-id"] as string,
      "svix-timestamp": headers["svix-timestamp"] as string,
      "svix-signature": headers["svix-signature"] as string,
    }) as any;

    const eventType = evt.type;

    if (eventType === "user.created") {
      const { id, first_name, last_name, email_addresses } = evt.data;
      const email = email_addresses?.[0]?.email_address || "";
      const name = `${first_name || ""} ${last_name || ""}`.trim() || "Anonymous User";

      const existingUser = await db.select().from(usersTable).where(eq(usersTable.id, id));
      if (existingUser.length === 0) {
        await db.insert(usersTable).values({
          id,
          name,
          email,
        });
        console.log("New user created via webhook:", id);
      }
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error processing Clerk webhook:", error);
    res.status(400).json({ success: false, error: "Invalid webhook signature" });
  }
});

export default router;
