import { Router } from "express";
import { db } from "../../config/db";
import { usersTable } from "../../config/schema";
import { eq, sql } from "drizzle-orm";
import { PLANS, type PlanKey } from "../../config/plans";

const router = Router();

router.post("/", async (req, res) => {
  try {
    const { event, payload } = req.body;

    if (event === "payment.captured") {
      const orderId = payload.payment.entity.order_id;
      const notes = payload.payment.entity.notes || {};
      const userId = notes.userId;
      const plan = notes.plan as PlanKey;

      if (userId && plan && PLANS[plan]) {
        await db
          .update(usersTable)
          .set({
            minutesRemaining: sql`${usersTable.minutesRemaining} + ${PLANS[plan].minutes}`,
            minutesTotal: sql`${usersTable.minutesTotal} + ${PLANS[plan].minutes}`,
            plan,
          })
          .where(eq(usersTable.id, userId));

        console.log("Payment successful, updated user plan:", userId, plan);
      }
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error processing Razorpay webhook:", error);
    res.status(500).json({ success: false, error: "Failed to process webhook" });
  }
});

export default router;
