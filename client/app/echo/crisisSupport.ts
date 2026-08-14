import {
  isVapiTranscriptEvent,
  type VapiTranscriptEvent,
} from "./transcriptMessages";

type ToolCall = {
  name?: string;
  function?: { name?: string };
};

type ToolWithToolCall = {
  toolCall?: ToolCall;
  function?: { name?: string };
};

type VapiToolCallsEvent = {
  type?: string;
  toolCallList?: ToolCall[];
  toolWithToolCallList?: ToolWithToolCall[];
};

const ENGLISH_NEGATED_CRISIS_PATTERNS = [
  /\b(?:i\s*(?:am|'m)\s+not|i\s+am\s+not)\s+suicidal\b/i,
  /\bi\s+(?:do\s+not|don't|never)\s+(?:want\s+to\s+)?(?:kill|hurt|harm)\s+myself\b/i,
  /\bi\s+(?:do\s+not|don't|never)\s+want\s+to\s+die\b/i,
];

const CRISIS_INTENT_PATTERNS = [
  /\bi\s*(?:am|'m)\s+suicidal\b/i,
  /\bi\s+(?:want|plan|intend|need)\s+to\s+(?:kill|hurt|harm)\s+myself\b/i,
  /\bi\s+(?:want|plan|intend|need)\s+to\s+(?:die|end\s+my\s+life|take\s+my\s+own\s+life)\b/i,
  /\bi\s+(?:do\s+not|don't)\s+want\s+to\s+(?:live|be\s+alive|exist)\b/i,
  /\bi(?:'d|\s+would)\s+be\s+better\s+off\s+dead\b/i,
  /\bi\s+(?:might|may|could|will|am\s+going\s+to)\s+(?:kill|hurt|harm)\s+myself\b/i,
  /(?:आत्महत्या|खुद\s+को\s+मार|स्वयं\s+को\s+मार|जीना\s+नहीं\s+चाह|मरना\s+चाह)/u,
  /(?:स्वतःला\s+मार|जगायचे\s+नाही|मरायचे\s+आहे)/u,
  /(?:தற்கொலை|என்னை\s+கொல்ல|வாழ\s+விரும்பவில்லை|சாக\s+வேண்டும்)/u,
];

export function containsCrisisIntent(text: string) {
  const normalized = text.trim();
  if (!normalized) return false;
  if (ENGLISH_NEGATED_CRISIS_PATTERNS.some((pattern) => pattern.test(normalized))) {
    return false;
  }
  return CRISIS_INTENT_PATTERNS.some((pattern) => pattern.test(normalized));
}

export function isFinalUserCrisisTranscript(event: VapiTranscriptEvent) {
  if (!isVapiTranscriptEvent(event) || event.role !== "user") return false;

  const isFinal =
    event.transcriptType === "final" ||
    event.type === "transcript[transcriptType='final']";
  return isFinal && containsCrisisIntent(event.transcript);
}

export function isShowCrisisSupportToolCall(event: unknown) {
  if (!event || typeof event !== "object") return false;

  const message = event as VapiToolCallsEvent;
  if (message.type !== "tool-calls") return false;

  const directCalls = message.toolCallList ?? [];
  const configuredCalls = message.toolWithToolCallList ?? [];

  return (
    directCalls.some(
      (toolCall) =>
        toolCall.name === "show_crisis_support" ||
        toolCall.function?.name === "show_crisis_support",
    ) ||
    configuredCalls.some(
      (tool) =>
        tool.toolCall?.function?.name === "show_crisis_support" ||
        tool.function?.name === "show_crisis_support",
    )
  );
}
