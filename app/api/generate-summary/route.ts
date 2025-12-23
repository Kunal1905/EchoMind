import { NextRequest, NextResponse } from "next/server";

const MODEL = "gemini-flash-latest"; // works with generateContent
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

// Helper function to retry API calls
async function retryApiCall(fn: () => Promise<any>, retries = 3, delay = 1000): Promise<any> {
  try {
    return await fn();
  } catch (error) {
    if (retries === 0) throw error;
    await new Promise(resolve => setTimeout(resolve, delay));
    return retryApiCall(fn, retries - 1, delay * 2);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { notes } = await req.json();

    if (!notes || notes.trim().length < 20) {
      return NextResponse.json(
        { error: "Conversation too short to summarize" },
        { status: 400 }
      );
    }

    const prompt = `
You are an expert therapist and note-taker.

You will receive the full transcript of a conversation between a client and an AI emotional-wellness assistant. 
Your task is to produce a clear, structured, concise summary for the user's history page.

Follow this exact format:

---

## Key Discussion Points
• Summarize the main topics the user talked about.
• Include emotional themes, personal struggles, progress, or concerns.
• Keep the points factual and neutral.
• 3–6 bullet points.

## Recommendations
• Provide actionable, supportive suggestions based on the discussion.
• Focus on emotional wellbeing, mindfulness, stress management, or healthy habits.
• 2–4 bullet points.
• Do NOT give medical or clinical advice.

---

Rules:
- Do NOT include timestamps, quotes, or analysis meta-discussion.
- Do NOT mention that this is an AI summary.
- Do NOT add sections other than the two listed above.
- Keep the entire output concise but meaningful.
- Maintain a compassionate, supportive tone.

Output only the formatted summary.
${notes}
`;

    // Add retry logic for the API call
    const apiCall = () => fetch(
      `${API_URL}?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
        }),
      }
    );

    const res = await retryApiCall(apiCall);
    const data = await res.json();

    console.log("Gemini raw response:", data);

    if (!res.ok) {
      return NextResponse.json(
        { error: data.error || "Gemini request failed" },
        { status: 500 }
      );
    }

    const summary =
      data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    return NextResponse.json({
      summary: summary.trim(),
    });
  } catch (err: any) {
    console.error("Generate summary error:", err);
    return NextResponse.json(
      { error: "Failed to generate summary", details: err.message },
      { status: 500 }
    );
  }
}