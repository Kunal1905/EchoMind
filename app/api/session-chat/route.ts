import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/config/db";
import { SessionChatTable } from "@/config/schema";
import { v4 as uuidv4 } from "uuid";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const { notes, sentimentAnalysis, duration } = await req.json();
    const user = await currentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!notes || notes.trim().length < 20) {
      return NextResponse.json(
        { error: "Conversation too short" },
        { status: 400 }
      );
    }

    const sessionId = uuidv4();
    const userEmail = user.primaryEmailAddress?.emailAddress ?? "";

    // 🔥 ALWAYS generate summary here
    const summaryRes = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}/api/generate-summary`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      }
    );

    const summaryData = await summaryRes.json();
    const finalSummary = summaryData?.summary ?? "";

    // Add timeout handling for database operation
    const dbInsertPromise = db.insert(SessionChatTable).values({
      sessionId,
      createdBy: userEmail,
      notes,
      summary: finalSummary,
      createdAt: new Date(),
    });

    // Add a timeout to prevent hanging
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Database operation timeout')), 10000)
    );

    await Promise.race([dbInsertPromise, timeoutPromise]);
    console.log("Database connection successful");

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Session save error:", err);
    console.error("Database connection failed:", err);
    
    // Handle specific error types
    if (err.message && err.message.includes('timeout')) {
      return NextResponse.json(
        { error: "Database connection timed out. Please try again." },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to save session", details: err.message },
      { status: 500 }
    );
  }
}


export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get('sessionId');
  
  try {
    const user = await currentUser();
    
    if (sessionId) {
      // Get specific session
      const result = await db.select().from(SessionChatTable)
        .where(eq(SessionChatTable.sessionId, sessionId));
      
      return NextResponse.json(result[0] || null);
    } else {
      // Get all sessions for the user
      const userEmail = user?.primaryEmailAddress?.emailAddress;
      if (!userEmail) {
        return NextResponse.json({ error: "User not authenticated" }, { status: 401 });
      }
      
      // Add timeout for database query
      const dbQueryPromise = db.select().from(SessionChatTable)
        .where(eq(SessionChatTable.createdBy, userEmail))
        .orderBy(SessionChatTable.createdAt);
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Database query timeout')), 10000)
      );
      
      const result = await Promise.race([dbQueryPromise, timeoutPromise]) as any[];
      
      return NextResponse.json(result);
    }
  } catch (e: any) {
    console.error("Error fetching sessions:", e);
    
    if (e.message && e.message.includes('timeout')) {
      return NextResponse.json({ error: "Database query timed out. Please try again." }, { status: 503 });
    }
    
    return NextResponse.json({ error: "Failed to fetch sessions", details: e.message }, { status: 500 });
  }
}