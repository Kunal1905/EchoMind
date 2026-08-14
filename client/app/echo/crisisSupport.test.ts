import assert from "node:assert/strict";
import test from "node:test";
import {
  containsCrisisIntent,
  isFinalUserCrisisTranscript,
  isShowCrisisSupportToolCall,
} from "./crisisSupport";

test("recognizes the flattened Vapi tool-calls event shape", () => {
  assert.equal(isShowCrisisSupportToolCall({
    type: "tool-calls",
    toolCallList: [{
      id: "call-1",
      name: "show_crisis_support",
      arguments: {},
    }],
  }), true);
});

test("recognizes the installed SDK tool-calls event shape", () => {
  assert.equal(isShowCrisisSupportToolCall({
    type: "tool-calls",
    toolCallList: [{
      id: "call-1",
      type: "function",
      function: { name: "show_crisis_support", arguments: "{}" },
    }],
  }), true);
});

test("recognizes the configured-tool event shape", () => {
  assert.equal(isShowCrisisSupportToolCall({
    type: "tool-calls",
    toolWithToolCallList: [{
      toolCall: { function: { name: "show_crisis_support" } },
    }],
  }), true);
});

test("ignores unrelated tools", () => {
  assert.equal(isShowCrisisSupportToolCall({
    type: "tool-calls",
    toolCallList: [{ function: { name: "get_weather" } }],
  }), false);
});

test("detects direct first-person crisis intent", () => {
  assert.equal(containsCrisisIntent("I want to end my life"), true);
  assert.equal(containsCrisisIntent("I don't want to live anymore"), true);
  assert.equal(containsCrisisIntent("मैं आत्महत्या करना चाहता हूं"), true);
  assert.equal(containsCrisisIntent("நான் தற்கொலை செய்ய நினைக்கிறேன்"), true);
});

test("does not trigger for explicit negation or ordinary distress", () => {
  assert.equal(containsCrisisIntent("I am not suicidal"), false);
  assert.equal(containsCrisisIntent("I don't want to hurt myself"), false);
  assert.equal(containsCrisisIntent("I had a really difficult day"), false);
});

test("uses only finalized user transcripts for the safety net", () => {
  const partial = {
    type: "transcript",
    role: "user",
    transcriptType: "partial",
    transcript: "I want to die",
  };
  const final = { ...partial, transcriptType: "final" };
  const assistant = { ...final, role: "assistant" };

  assert.equal(isFinalUserCrisisTranscript(partial), false);
  assert.equal(isFinalUserCrisisTranscript(final), true);
  assert.equal(isFinalUserCrisisTranscript(assistant), false);
});
