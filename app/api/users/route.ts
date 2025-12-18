import { currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/config/db";
import { usersTable } from "@/config/schema";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const clerkUser = await currentUser();

    if (!clerkUser) {
      return NextResponse.json(
        { success: false, error: "No authenticated user" },
        { status: 401 }
      );
    }

    const clerkUserId = clerkUser.id;
    const clerkEmail =
      clerkUser.emailAddresses?.[0]?.emailAddress || "no-email@example.com";

    const clerkName =
      `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() ||
      "Unnamed User";

    console.log("🔥 Clerk user:", {
      id: clerkUserId,
      email: clerkEmail,
    });

    // Check by Clerk ID instead of email
    const existingUser = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, clerkUserId));

    if (existingUser.length > 0) {
      return NextResponse.json({
        success: true,
        user: existingUser[0],
        message: "User already exists",
      });
    }

    // Insert
    const inserted = await db
      .insert(usersTable)
      .values({
        id: clerkUserId,
        name: clerkName,
        email: clerkEmail,        
      })
      .returning();
      console.log("🔥 Clerk email:", clerkEmail);

    return NextResponse.json({ success: true, user: inserted[0] });
  } catch (error) {
    console.error("❌ Error creating/fetching user:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
