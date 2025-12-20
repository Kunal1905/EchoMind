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
      // Create user if not exists
      await db.insert(usersTable).values({
        id: user.id,
        name: user.fullName || user.firstName || "User",
        email: user.primaryEmailAddress?.emailAddress || "",
      });
      
      // Return default subscription data for new user
      return NextResponse.json({
        freeTrialUsed: 0,
        freeTrialLimit: 3,
        premiumCallsRemaining: 0,
        premiumCallsTotal: 0,
        isPremium: false,
      });
    }

    const userSubscription = userData[0];

    return NextResponse.json({
      freeTrialUsed: userSubscription.freeTrialUsed || 0,
      freeTrialLimit: userSubscription.freeTrialLimit || 3,
      premiumCallsRemaining: userSubscription.premiumCallsRemaining || 0,
      premiumCallsTotal: userSubscription.premiumCallsTotal || 0,
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

    // Ensure user exists
    const userData = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, user.id));

    if (userData.length === 0) {
      // Create user if not exists
      await db.insert(usersTable).values({
        id: user.id,
        name: user.fullName || user.firstName || "User",
        email: user.primaryEmailAddress?.emailAddress || "",
      });
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
            premiumCallsRemaining: sql`${usersTable.premiumCallsRemaining} + ${calls || 0}`,
            premiumCallsTotal: sql`${usersTable.premiumCallsTotal} + ${calls || 0}`,
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
    const updatedUserData = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, user.id));

    const updatedUser = updatedUserData[0];

    return NextResponse.json({
      freeTrialUsed: updatedUser.freeTrialUsed || 0,
      freeTrialLimit: updatedUser.freeTrialLimit || 3,
      premiumCallsRemaining: updatedUser.premiumCallsRemaining || 0,
      premiumCallsTotal: updatedUser.premiumCallsTotal || 0,
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