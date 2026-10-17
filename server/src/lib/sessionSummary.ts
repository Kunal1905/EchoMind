const DEFAULT_MODEL = "gemini-3.8-flash";
const DEFAULT_FALLBACK_MODEL = "gemini-3.5-flash-lite";
const API_ROOT = "https://generativelanguage.googleapis.com/v1beta/models";
const REQUEST_TIMEOUT_MS = 30_000;
const MAX_MESSAGE_LENGTH = 220;

class GeminiRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly retryAfterMs?: number,
  ) {
    super(message);
    this.name = "GeminiRequestError";
  }
}

function cleanMessage(message: string) {
  const compact = message.replace(/\s+/g, " ").trim();
  if (compact.length <= MAX_MESSAGE_LENGTH) return compact;
  return `${compact.slice(0, MAX_MESSAGE_LENGTH - 1).trimEnd()}…`;
}

function buildFallbackSummary(notes: string) {
  const userMessages = notes
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.toLowerCase().startsWith("user:"))
    .map((line) => cleanMessage(line.replace(/^user:\s*/i, "")))
    .filter(Boolean);

  const ignoredMessages = new Set([
    "hi",
    "hello",
    "hey",
    "how are you",
    "how are you doing",
    "thanks",
    "thank you",
  ]);
  const seen = new Set<string>();
  const meaningfulMessages = userMessages.filter((message) => {
    const normalized = message.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, "").trim();
    if (normalized.length < 3 || ignoredMessages.has(normalized) || seen.has(normalized)) {
      return false;
    }
    seen.add(normalized);
    return true;
  });

  const discussionPoints = meaningfulMessages.length > 0
    ? meaningfulMessages
        .slice(0, 4)
        .map((message) => `- You shared: ${message}`)
        .join("\n")
    : [
        "- This was a short emotional check-in.",
        "- There was not enough transcript detail to identify a specific theme reliably.",
      ].join("\n");

  const combined = meaningfulMessages.join(" ").toLowerCase();
  const suggestions = [
    "- Revisit the part of the conversation that felt most important when you have more space.",
  ];
  if (/\b(stress|stressed|anxious|anxiety|overwhelm|overwhelmed|pressure)\b/.test(combined)) {
    suggestions.unshift("- Consider a brief pause to name the main source of pressure and what feels manageable right now.");
  } else if (/\b(sad|low|lonely|upset|hurt|grief|grieving)\b/.test(combined)) {
    suggestions.unshift("- Give the feeling some room without requiring yourself to solve it immediately.");
  } else if (/\b(sleep|tired|exhausted|fatigue)\b/.test(combined)) {
    suggestions.unshift("- Notice whether rest, routine, or a smaller commitment would feel supportive today.");
  } else {
    suggestions.unshift("- Notice what influenced how you felt and what, if anything, helped.");
  }

  return `## Key Discussion Points\n${discussionPoints}\n\n## Recommendations\n${suggestions.join("\n")}`;
}

function buildPrompt(notes: string) {
  return `
You are a careful emotional-wellness note-taker, not a therapist or clinician.

You will receive the full transcript of a conversation between a user and an AI emotional-wellness assistant.
Produce a clear, structured, concise summary for the user's private history page.

Follow this exact format:

## Key Discussion Points
- Summarize the main topics the user actually discussed.
- Include emotional themes, personal struggles, progress, or concerns when present.
- Keep the points factual and neutral.
- Use 2 to 5 complete bullet points.

## Recommendations
- Offer gentle, optional next steps grounded in the transcript.
- Use language such as "consider" or "you might" rather than commands.
- Do not diagnose, provide medical advice, or claim clinical certainty.
- Use 1 to 3 complete bullet points.

Rules:
- Base every detail on the transcript. Do not invent names, events, feelings, or causes.
- Do not include timestamps, direct quotes, or analysis meta-discussion.
- Do not copy tiny transcript fragments as standalone bullets; synthesize the theme.
- Do not mention that this is an AI summary.
- Do not add sections other than the two listed above.
- If the transcript is too short for a reliable theme, say so plainly.
- Keep the entire output concise and compassionate.

Output only the formatted summary.

${notes}
`;
}

function parseRetryAfter(value: string | null) {
  if (!value) return undefined;
  const seconds = Number(value);
  if (Number.isFinite(seconds)) return Math.max(0, seconds * 1000);
  const date = Date.parse(value);
  return Number.isNaN(date) ? undefined : Math.max(0, date - Date.now());
}

function isRetryableError(error: unknown) {
  if (error instanceof GeminiRequestError) {
    return error.status === 408 || error.status === 429 || error.status >= 500;
  }

  if (error instanceof TypeError) return true;
  const name = (error as { name?: string } | null)?.name;
  return name === "AbortError" || name === "TimeoutError";
}

async function retryApiCall<T>(
  fn: () => Promise<T>,
  model: string,
  maxAttempts = 4,
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (!isRetryableError(error) || attempt === maxAttempts) throw error;

      const retryAfterMs = error instanceof GeminiRequestError ? error.retryAfterMs : undefined;
      const exponentialDelay = 1000 * (2 ** (attempt - 1));
      const jitter = Math.floor(Math.random() * 350);
      const delay = Math.min(retryAfterMs ?? exponentialDelay + jitter, 10_000);
      console.warn(`[summary] ${model} attempt ${attempt} failed; retrying in ${delay}ms`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

async function requestSummary(model: string, notes: string) {
  const response = await fetch(
    `${API_ROOT}/${encodeURIComponent(model)}:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: buildPrompt(notes) }] }],
        generationConfig: { maxOutputTokens: 700 },
      }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    },
  );

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const errorMessage = data?.error?.message || data?.error || `Gemini request failed (${response.status})`;
    throw new GeminiRequestError(
      typeof errorMessage === "string" ? errorMessage : JSON.stringify(errorMessage),
      response.status,
      parseRetryAfter(response.headers.get("retry-after")),
    );
  }

  const summary = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
  if (!summary) throw new Error("Gemini returned an empty summary");
  return summary;
}

export async function generateSessionSummary(notes: string) {
  if (!notes || notes.trim().length < 20) {
    throw new Error("Conversation too short to summarize");
  }
  if (!process.env.GEMINI_API_KEY) throw new Error("Missing GEMINI_API_KEY");

  const primaryModel = process.env.GEMINI_SUMMARY_MODEL || DEFAULT_MODEL;
  const fallbackModel = process.env.GEMINI_SUMMARY_FALLBACK_MODEL || DEFAULT_FALLBACK_MODEL;
  const models = Array.from(new Set([primaryModel, fallbackModel]));
  let lastError: unknown;

  for (const [index, model] of models.entries()) {
    try {
      return await retryApiCall(
        () => requestSummary(model, notes),
        model,
        index === 0 ? 4 : 2,
      );
    } catch (error) {
      lastError = error;
      const status = error instanceof GeminiRequestError ? error.status : undefined;
      console.error(`[summary] ${model} failed after retries:`, error);
      if (status === 401 || status === 403) break;
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Summary generation failed");
}

export async function generateSessionSummaryWithFallback(notes: string) {
  try {
    return await generateSessionSummary(notes);
  } catch (error) {
    console.error("Summary generation failed, using transcript-based fallback:", error);
    return buildFallbackSummary(notes);
  }
}
