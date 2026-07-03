const MODEL = "gemini-flash-latest";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

function buildFallbackSummary(notes: string) {
  const cleanedNotes = notes
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const userMessages = cleanedNotes
    .filter((line) => line.toLowerCase().startsWith("user:"))
    .map((line) => line.replace(/^user:\s*/i, ""));

  const samplePoints = userMessages.slice(0, 3).map((message) => {
    const trimmed = message.trim();
    return trimmed.length <= 120 ? trimmed : `${trimmed.slice(0, 117)}...`;
  });

  const discussionPoints =
    samplePoints.length > 0
      ? samplePoints.map((point) => `- ${point}`).join("\n")
      : "- The user completed a reflective voice session.\n- The conversation included emotional check-in and self-reflection.";

  return `## Key Discussion Points
${discussionPoints}

## Recommendations
- Review this session and notice any recurring thoughts or emotional triggers.
- Continue using short, regular check-ins to build awareness and consistency.`;
}

function buildPrompt(notes: string) {
  return `
You are an expert therapist and note-taker.

You will receive the full transcript of a conversation between a client and an AI emotional-wellness assistant.
Your task is to produce a clear, structured, concise summary for the user's history page.

Follow this exact format:

## Key Discussion Points
- Summarize the main topics the user talked about.
- Include emotional themes, personal struggles, progress, or concerns.
- Keep the points factual and neutral.
- 3 to 6 bullet points.

## Recommendations
- Provide actionable, supportive suggestions based on the discussion.
- Focus on emotional wellbeing, mindfulness, stress management, or healthy habits.
- 2 to 4 bullet points.
- Do NOT give medical or clinical advice.

Rules:
- Do NOT include timestamps, quotes, or analysis meta-discussion.
- Do NOT mention that this is an AI summary.
- Do NOT add sections other than the two listed above.
- Keep the entire output concise but meaningful.
- Maintain a compassionate, supportive tone.

Output only the formatted summary.

${notes}
`;
}

async function retryApiCall<T>(fn: () => Promise<T>, retries = 3, delay = 1000): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retries === 0) {
      throw error;
    }

    await new Promise((resolve) => setTimeout(resolve, delay));
    return retryApiCall(fn, retries - 1, delay * 2);
  }
}

export async function generateSessionSummary(notes: string) {
  if (!notes || notes.trim().length < 20) {
    throw new Error("Conversation too short to summarize");
  }

  if (!process.env.GEMINI_API_KEY) {
    throw new Error("Missing GEMINI_API_KEY");
  }

  const response = await retryApiCall(() =>
    fetch(`${API_URL}?key=${process.env.GEMINI_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: buildPrompt(notes) }],
          },
        ],
      }),
    })
  );

  const data = await response.json();

  if (!response.ok) {
    const errorMessage = data?.error?.message || data?.error || "Gemini request failed";
    throw new Error(errorMessage);
  }

  const summary = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
  if (!summary) {
    throw new Error("Gemini returned an empty summary");
  }

  return summary;
}

export async function generateSessionSummaryWithFallback(notes: string) {
  try {
    return await generateSessionSummary(notes);
  } catch (error) {
    console.error("Summary generation failed, using fallback summary:", error);
    return buildFallbackSummary(notes);
  }
}
