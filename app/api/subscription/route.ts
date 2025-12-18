import { currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/config/db";
import { usersTable } from "@/config/schema";
import { eq, sql } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const user = await currentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user subscription data
    const userData = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, user.id));

    if (userData.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userSubscription = userData[0];

    return NextResponse.json({
      freeTrialUsed: userSubscription.freeTrialUsed,
      freeTrialLimit: userSubscription.freeTrialLimit,
      premiumCallsRemaining: userSubscription.premiumCallsRemaining,
      premiumCallsTotal: userSubscription.premiumCallsTotal,
      isPremium: (userSubscription.premiumCallsRemaining || 0) > 0,
    });
  } catch (error) {
    console.error("Error fetching subscription data:", error);
    return NextResponse.json(
      { error: "Failed to fetch subscription data" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { action, calls } = await req.json();
    const user = await currentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    switch (action) {
      case "useFreeCall":
        // Increment free trial used count
        await db
          .update(usersTable)
          .set({
            freeTrialUsed: sql`${usersTable.freeTrialUsed} + 1`,
          })
          .where(eq(usersTable.id, user.id));
        break;

      case "addPremiumCalls":
        // Add premium calls to user account
        await db
          .update(usersTable)
          .set({
            premiumCallsRemaining: sql`${usersTable.premiumCallsRemaining} + ${calls}`,
            premiumCallsTotal: sql`${usersTable.premiumCallsTotal} + ${calls}`,
          })
          .where(eq(usersTable.id, user.id));
        break;

      case "usePremiumCall":
        // Decrement premium calls remaining
        await db
          .update(usersTable)
          .set({
            premiumCallsRemaining: sql`${usersTable.premiumCallsRemaining} - 1`,
          })
          .where(eq(usersTable.id, user.id));
        break;

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    // Return updated subscription data
    const userData = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, user.id));

    const updatedUser = userData[0];

    return NextResponse.json({
      freeTrialUsed: updatedUser.freeTrialUsed,
      freeTrialLimit: updatedUser.freeTrialLimit,
      premiumCallsRemaining: updatedUser.premiumCallsRemaining,
      premiumCallsTotal: updatedUser.premiumCallsTotal,
      isPremium: (updatedUser.premiumCallsRemaining || 0) > 0,
    });
  } catch (error) {
    console.error("Error updating subscription data:", error);
    return NextResponse.json(
      { error: "Failed to update subscription data" },
      { status: 500 }
    );
  }
}