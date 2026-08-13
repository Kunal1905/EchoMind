import assert from "node:assert/strict";
import test from "node:test";
import {
  applyTranscriptEvent,
  type TranscriptMessage,
} from "./transcriptMessages";

const id = () => "message-1";
const now = () => new Date("2026-08-14T00:00:00.000Z");

test("updates cumulative partial transcripts in one live block", () => {
  let messages: TranscriptMessage[] = [];
  messages = applyTranscriptEvent(messages, {
    type: "transcript",
    role: "user",
    transcriptType: "partial",
    transcript: "I have",
  }, id, now);
  messages = applyTranscriptEvent(messages, {
    type: "transcript",
    role: "user",
    transcriptType: "partial",
    transcript: "I have had a hard day",
  }, id, now);

  assert.equal(messages.length, 1);
  assert.equal(messages[0].text, "I have had a hard day");
  assert.equal(messages[0].isLive, true);
});

test("finalizes a partial without creating a second block", () => {
  let messages: TranscriptMessage[] = [];
  messages = applyTranscriptEvent(messages, {
    type: "transcript",
    role: "assistant",
    transcriptType: "partial",
    transcript: "That sounds",
  }, id, now);
  messages = applyTranscriptEvent(messages, {
    type: "transcript[transcriptType='final']",
    role: "assistant",
    transcriptType: "final",
    transcript: "That sounds really difficult.",
  }, id, now);

  assert.equal(messages.length, 1);
  assert.equal(messages[0].text, "That sounds really difficult.");
  assert.equal(messages[0].isLive, false);
});

test("groups consecutive finalized utterances from the same speaker", () => {
  let messages: TranscriptMessage[] = [];
  messages = applyTranscriptEvent(messages, {
    type: "transcript",
    role: "user",
    transcriptType: "final",
    transcript: "I felt overwhelmed.",
  }, id, now);
  messages = applyTranscriptEvent(messages, {
    type: "transcript",
    role: "user",
    transcriptType: "final",
    transcript: "Then I took a short walk.",
  }, id, now);

  assert.equal(messages.length, 1);
  assert.equal(messages[0].text, "I felt overwhelmed. Then I took a short walk.");
});

test("keeps finalized text while the next same-speaker utterance is partial", () => {
  let messages: TranscriptMessage[] = [];
  messages = applyTranscriptEvent(messages, {
    type: "transcript",
    role: "user",
    transcriptType: "final",
    transcript: "I felt overwhelmed.",
  }, id, now);
  messages = applyTranscriptEvent(messages, {
    type: "transcript",
    role: "user",
    transcriptType: "partial",
    transcript: "Then I took",
  }, id, now);
  messages = applyTranscriptEvent(messages, {
    type: "transcript",
    role: "user",
    transcriptType: "partial",
    transcript: "Then I took a short walk",
  }, id, now);

  assert.equal(messages.length, 1);
  assert.equal(messages[0].text, "I felt overwhelmed. Then I took a short walk");
  assert.equal(messages[0].isLive, true);
});

test("starts a new block when the speaker changes", () => {
  let messages: TranscriptMessage[] = [];
  messages = applyTranscriptEvent(messages, {
    type: "transcript",
    role: "user",
    transcriptType: "final",
    transcript: "I am tired.",
  }, id, now);
  messages = applyTranscriptEvent(messages, {
    type: "transcript",
    role: "assistant",
    transcriptType: "partial",
    transcript: "Let us slow down",
  }, () => "message-2", now);

  assert.equal(messages.length, 2);
  assert.equal(messages[1].sender, "ai");
  assert.equal(messages[1].text, "Let us slow down");
});

test("ignores empty and unrelated Vapi messages", () => {
  const existing: TranscriptMessage[] = [];
  assert.equal(applyTranscriptEvent(existing, { type: "status-update" }), existing);
  assert.equal(applyTranscriptEvent(existing, {
    type: "transcript",
    role: "user",
    transcriptType: "partial",
    transcript: "   ",
  }), existing);
});
