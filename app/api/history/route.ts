import { currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/config/db";
import { SessionChatTable } from "@/config/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const user = await currentUser();
  
  try {
    // Check if user is authenticated
    if (!user) {
      return NextResponse.json({ error: "User not authenticated" }, { status: 401 });
    }
    
    const userEmail = user.primaryEmailAddress?.emailAddress;
    if (!userEmail) {
      return NextResponse.json({ error: "User email not found" }, { status: 400 });
    }
    
    // Fetch all sessions for the user, ordered by creation date (newest first)
    const sessions = await db.select().from(SessionChatTable)
      .where(eq(SessionChatTable.createdBy, userEmail))
      .orderBy(desc(SessionChatTable.createdAt));
    
    return NextResponse.json(sessions);
  } catch (e) {
    console.error("Error fetching history:", e);
    return NextResponse.json({ error: "Failed to fetch history" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try{ 
    const user = await currentUser();
    if(!user) {
      return NextResponse.json(
        { error : "Not authenticated" },
        {status: 401}
      );
    }
    
    const body = await req.json();

    const {
      sessionId,
      notes,
      summary,
      sentimentAnalysis,
      duration
    } = body;

    if(!sessionId || !summary) {
      return NextResponse.json(
        { error: "Missing required fields" },
        {status: 400}
      );
    }

    //store in db
    await db.insert(SessionChatTable).values({
      sessionId,
      createdBy: user.id,
      notes,
      summary,
      sentimentAnalysis,
      duration,
    });

    return NextResponse.json({ success: true});
  } catch (err) {
    console.error("Error saving session: ", err);
    return NextResponse.json(
      {error: " Failed to save session"},
      {status: 500}
    );
  }
}