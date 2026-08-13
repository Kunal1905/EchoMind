export type TranscriptSender = "user" | "ai";

export type TranscriptMessage = {
  id: string;
  text: string;
  sender: TranscriptSender;
  timestamp: Date;
  isLive?: boolean;
  isSystemFallback?: boolean;
  committedText?: string;
};

export type VapiTranscriptEvent = {
  type?: string;
  role?: string;
  transcriptType?: string;
  transcript?: string;
};

export function isVapiTranscriptEvent(
  event: VapiTranscriptEvent,
): event is VapiTranscriptEvent & { transcript: string } {
  return (
    (event.type === "transcript" || event.type === "transcript[transcriptType='final']") &&
    (event.role === "user" || event.role === "assistant") &&
    typeof event.transcript === "string" &&
    event.transcript.trim().length > 0
  );
}

function joinTranscript(base: string, segment: string) {
  const normalizedBase = base.trim();
  const normalizedSegment = segment.trim();

  if (!normalizedBase) return normalizedSegment;
  if (!normalizedSegment || normalizedBase === normalizedSegment) return normalizedBase;
  if (normalizedBase.endsWith(normalizedSegment)) return normalizedBase;
  return `${normalizedBase} ${normalizedSegment}`;
}

export function applyTranscriptEvent(
  messages: TranscriptMessage[],
  event: VapiTranscriptEvent,
  createId: () => string = () => `transcript-${Date.now()}`,
  now: () => Date = () => new Date(),
) {
  if (!isVapiTranscriptEvent(event)) return messages;

  const sender: TranscriptSender = event.role === "assistant" ? "ai" : "user";
  const transcript = event.transcript.trim();
  const isFinal =
    event.transcriptType === "final" ||
    event.type === "transcript[transcriptType='final']";
  const last = messages[messages.length - 1];

  if (!last || last.sender !== sender || last.isSystemFallback) {
    const committedText = isFinal ? transcript : "";
    return [
      ...messages,
      {
        id: createId(),
        text: transcript,
        sender,
        timestamp: now(),
        isLive: !isFinal,
        committedText,
      },
    ];
  }

  const committedText = last.committedText ?? (last.isLive ? "" : last.text);
  const nextCommittedText = isFinal
    ? joinTranscript(committedText, transcript)
    : committedText;
  const nextText = isFinal
    ? nextCommittedText
    : joinTranscript(committedText, transcript);
  const updated = [...messages];

  updated[updated.length - 1] = {
    ...last,
    text: nextText,
    isLive: !isFinal,
    committedText: nextCommittedText,
  };

  return updated;
}
