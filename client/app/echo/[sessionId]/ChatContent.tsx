"use client";

import React, { useEffect, useRef, useState } from "react";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, Clock, CreditCard, Info, Loader2, LogIn, RefreshCw, Smartphone, UserPlus, X } from "lucide-react";
import Vapi from "@vapi-ai/web";
import { vapiClient, isVapiClientReady } from "../../lib/vapiClient";
import { VapiHUD } from "../../components/VapiHUD";
import { EchoOrb } from "../../components/EchoOrb";
import { v4 as uuidv4 } from "uuid";
import api from "@/app/lib/api";
import { usePostHog } from "posthog-js/react";
import { PrivacyConsentModal } from "../../components/PrivacyConsentModal";
import { MoodCheckModal } from "../../components/MoodCheckModal";
import { CrisisSupportDialog } from "../../components/CrisisSupportDialog";
import ConstellationField from "../../components/ConstellationField";
import {
  isFinalUserCrisisTranscript,
  isShowCrisisSupportToolCall,
} from "../crisisSupport";
import {
  applyTranscriptEvent,
  isVapiTranscriptEvent,
  type TranscriptMessage as Message,
  type VapiTranscriptEvent,
} from "../transcriptMessages";
import {
  releaseScreenWakeLock,
  requestScreenWakeLock,
  type ScreenWakeLockSentinel,
} from "../screenWakeLock";


type VoiceRecoveryNotice = {
  title: string;
  message: string;
  canReconnect?: boolean;
};

type VapiMessage = VapiTranscriptEvent & {
  status?: string;
  endedReason?: string;
};

type VapiErrorLike = {
  message?: unknown;
  status?: unknown;
  response?: unknown;
  type?: unknown;
  error?: unknown;
};

type NoMinutesData = {
  minutesRemaining?: number;
  freeTrialLimit?: number;
  freeTrialUsed?: number;
};

type ApiErrorLike = {
  message?: string;
  response?: {
    status?: number;
    data?: {
      error?: string;
      code?: string;
      freeTrialUsed?: number;
      minutesRemaining?: number;
      freeTrialLimit?: number;
    };
  };
};

const isDevelopment = process.env.NODE_ENV !== "production";
const debugWarn = (...args: unknown[]) => {
  if (isDevelopment) console.warn(...args);
};
const debugError = (...args: unknown[]) => {
  if (isDevelopment) console.error(...args);
};

const getErrorMessage = (error: unknown) => {
  if (typeof error === "string") return error;
  if (!error || typeof error !== "object") return String(error);

  const candidate = error as VapiErrorLike;
  if (typeof candidate.message === "string") return candidate.message;

  if (typeof candidate.error === "string") return candidate.error;
  if (candidate.error && typeof candidate.error === "object") {
    const nested = candidate.error as { message?: unknown; error?: unknown };
    if (typeof nested.message === "string") return nested.message;
    if (typeof nested.error === "string") return nested.error;
    if (nested.message) return JSON.stringify(nested.message);
  }

  return JSON.stringify(error);
};

function SessionHeadsUpNote() {
  return (
    <div className="mt-4 flex items-start gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-xs leading-relaxed text-[--color-ash-gray]">
      <Info className="mt-0.5 shrink-0 text-[--color-electric-iris]" size={15} />
      <p>
        Every Echo chat includes a spoken heads-up when about 1 minute remains,
        then wraps up gently. EchoMind can make mistakes; verify anything
        important.
      </p>
    </div>
  );
}

export function ChatContent({
  onNavigate = () => { },
  isPremium = false,
  premiumCalls = 0,
  freeTrialUsed = 0,
  freeTrialLimit = 5,
  onSessionComplete = () => { },
}: {
  onNavigate?: (page: string) => void;
  isPremium?: boolean;
  premiumCalls?: number;
  freeTrialUsed?: number;
  freeTrialLimit?: number;
  onSessionComplete?: () => void;
}) {
  const { isSignedIn } = useUser();

  const posthog = usePostHog();
  const [messages, setMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef<Message[]>([]);

  const [isRecording, setIsRecording] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isWaitingForAssistant, setIsWaitingForAssistant] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [sessionTime, setSessionTime] = useState(0);
  const [maxSessionSeconds, setMaxSessionSeconds] = useState<number | null>(null);
  const [oneMinuteWarningShown, setOneMinuteWarningShown] = useState(false);
  const warningTriggeredRef = useRef(false);
  const [sessionNotice, setSessionNotice] = useState<{
    title: string;
    message: string;
  } | null>(null);
  const [voiceRecoveryNotice, setVoiceRecoveryNotice] =
    useState<VoiceRecoveryNotice | null>(null);
  const [isCrisisSupportOpen, setIsCrisisSupportOpen] = useState(false);
  const [isAuthPromptOpen, setIsAuthPromptOpen] = useState(false);

  const [isConsentModalOpen, setIsConsentModalOpen] = useState(false);
  const [consentGranted, setConsentGranted] = useState<boolean | null>(null);

  // ✅ Post-session mood check-in — shown after a call ends, before
  // navigating to history. Promise-based so saveEndedSession can `await`
  // the user's response (or skip) before moving on.
  const [moodModalSessionId, setMoodModalSessionId] = useState<string | null>(null);
  const moodResolveRef = useRef<(() => void) | null>(null);

  const promptMoodCheck = (sessionId: string): Promise<void> => {
    return new Promise((resolve) => {
      moodResolveRef.current = resolve;
      setMoodModalSessionId(sessionId);
    });
  };

  const closeMoodModal = () => {
    setMoodModalSessionId(null);
    moodResolveRef.current?.();
    moodResolveRef.current = null;
  };

  //select language
  const [language, setLanguage] = useState<"en" | "hi" | "mr" | "ta">("en");

  const LANGUAGES = [
    { code: "en", label: "English" },
    { code: "hi", label: "हिंदी" },
    { code: "mr", label: "मराठी" },
    { code: "ta", label: "தமிழ்" },
  ];

  const vapiRef = useRef<Vapi | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const sessionResumeTokenRef = useRef<string | null>(null);
  const saveAttemptedRef = useRef(false);
  const callStartRef = useRef<number | null>(null); // ✅ live call-start timestamp (avoids stale state in the once-registered listener)
  const activeSegmentStartRef = useRef<number | null>(null);
  const accumulatedCallSecondsRef = useRef(0);
  const maxSessionSecondsRef = useRef<number | null>(null);
  const intentionalEndRef = useRef(false);
  const expectedEndRef = useRef(false);
  const reconnectAttemptRef = useRef(false);
  const isRecordingRef = useRef(false);
  const crisisSupportOpenRef = useRef(false);
  const lastRecoveryNoticeRef = useRef(0);
  const wakeLockRef = useRef<ScreenWakeLockSentinel | null>(null);
  const finishInterruptedSessionRef = useRef<() => void>(() => {});
  const eventContextRef = useRef({
    consentGranted,
    isPremium,
    onNavigate,
    onSessionComplete,
    posthog,
    premiumCalls,
  });

  // Load consent preference from localStorage on mount
  useEffect(() => {
    const pref = localStorage.getItem("memory_consent_preference");
    if (pref) {
      setConsentGranted(pref === "granted");
    }
  }, []);


  /* ---------------- INIT VAPI ---------------- */
  useEffect(() => {
    if (!vapiRef.current) {
      vapiRef.current = vapiClient;
    }
  }, []);

  useEffect(() => {
    isRecordingRef.current = isRecording;
  }, [isRecording]);

  useEffect(() => {
    eventContextRef.current = {
      consentGranted,
      isPremium,
      onNavigate,
      onSessionComplete,
      posthog,
      premiumCalls,
    };
  }, [consentGranted, isPremium, onNavigate, onSessionComplete, posthog, premiumCalls]);

  /* ---------------- SCREEN WAKE LOCK ---------------- */
  useEffect(() => {
    if (!isRecording) return;

    let cancelled = false;
    const acquireWakeLock = async () => {
      if (document.visibilityState !== "visible") return;
      try {
        const wakeLock = await requestScreenWakeLock(navigator, wakeLockRef.current);
        if (cancelled) {
          await releaseScreenWakeLock(wakeLock);
          return;
        }
        wakeLockRef.current = wakeLock;
      } catch (error) {
        if (isDevelopment) debugWarn("[wake-lock] Screen wake lock was unavailable", error);
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && isRecordingRef.current) {
        void acquireWakeLock();
      }
    };

    void acquireWakeLock();
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      const wakeLock = wakeLockRef.current;
      wakeLockRef.current = null;
      void releaseScreenWakeLock(wakeLock);
    };
  }, [isRecording]);

  /* ---------------- VAPI EVENTS ---------------- */
  useEffect(() => {
    const vapi = vapiRef.current;
    if (!vapi) return;

    const onCallStart = () => {
      const isReconnect = reconnectAttemptRef.current;
      sessionIdRef.current = sessionIdRef.current || uuidv4();
      callStartRef.current = callStartRef.current || Date.now();
      activeSegmentStartRef.current = Date.now();
      saveAttemptedRef.current = false;
      intentionalEndRef.current = false;
      expectedEndRef.current = false;
      reconnectAttemptRef.current = false;
      setIsRecording(true);
      setIsInitializing(false);
      setIsWaitingForAssistant(true);
      setVoiceRecoveryNotice(null);

      if (isReconnect) {
        eventContextRef.current.posthog.capture("voice_session_reconnected", {
          plan: eventContextRef.current.isPremium ? "paid" : "free",
        });
      } else {
        eventContextRef.current.posthog.capture("session_started", {
          plan: eventContextRef.current.isPremium ? "paid" : "free",
          minutesRemaining: eventContextRef.current.premiumCalls,
          hasMemory: !!eventContextRef.current.consentGranted,
        });
      }
    };

    const commitActiveSegment = () => {
      if (!activeSegmentStartRef.current) return;
      accumulatedCallSecondsRef.current += Math.max(
        0,
        Math.floor((Date.now() - activeSegmentStartRef.current) / 1000),
      );
      activeSegmentStartRef.current = null;
    };

    const getActiveDurationSeconds = () => {
      const currentSegmentSeconds = activeSegmentStartRef.current
        ? Math.max(0, Math.floor((Date.now() - activeSegmentStartRef.current) / 1000))
        : 0;
      return accumulatedCallSecondsRef.current + currentSegmentSeconds;
    };

    const saveEndedSession = async ({
      source,
      softNotice,
      delayBeforeNavigateMs = 0,
    }: {
      source: string;
      softNotice?: { title: string; message: string };
      delayBeforeNavigateMs?: number;
    }) => {
      setIsRecording(false);
      setIsWaitingForAssistant(false);
      setIsSaving(true);
      commitActiveSegment();

      // ensure we only try to save once
      if (saveAttemptedRef.current) {
        setIsSaving(false);
        return;
      }
      saveAttemptedRef.current = true;

      try {
        if (softNotice) {
          setSessionNotice(softNotice);
        }

        // Captured now — sessionIdRef.current gets cleared in `finally`
        // below, but we still need it after that point for the mood prompt.
        const completedSessionId = sessionIdRef.current;

        const notes = messagesRef.current
          .map((m) => `${m.sender}: ${m.text}`)
          .join("\n");

        const durationSec = accumulatedCallSecondsRef.current;

        const response = await api.post("/session-chat", {
          sessionId: sessionIdRef.current,
          notes,
          durationSec,
        });

        if (response.status !== 200 && response.status !== 201) {
          if (isDevelopment) debugError(`[${source}] Save failed:`, response.status);
        } else {
          // Track Session Completed in PostHog
          eventContextRef.current.posthog.capture("session_completed", {
            durationSec,
            plan: eventContextRef.current.isPremium ? "paid" : "free",
            hadIntention: false,
            endSource: source,
          });
          await eventContextRef.current.onSessionComplete();
          if (completedSessionId) {
            await promptMoodCheck(completedSessionId);
          }
          if (delayBeforeNavigateMs > 0) {
            await new Promise((resolve) => setTimeout(resolve, delayBeforeNavigateMs));
          }
          eventContextRef.current.onNavigate("history");
        }

      } catch (e) {
        if (isDevelopment) debugError("Save failed", e);
      } finally {
        setIsSaving(false);
        sessionIdRef.current = null;
        sessionResumeTokenRef.current = null;
        callStartRef.current = null;
        activeSegmentStartRef.current = null;
        accumulatedCallSecondsRef.current = 0;
        maxSessionSecondsRef.current = null;
        intentionalEndRef.current = false;
        expectedEndRef.current = false;
      }
    };

    const onCallEnd = async () => {
      const elapsedSeconds = getActiveDurationSeconds();
      const reachedSessionLimit = !!maxSessionSecondsRef.current &&
        elapsedSeconds >= Math.max(0, maxSessionSecondsRef.current - 5);
      const shouldComplete = intentionalEndRef.current || expectedEndRef.current || reachedSessionLimit;

      if (shouldComplete) {
        await saveEndedSession({ source: intentionalEndRef.current ? "user-ended" : "onCallEnd" });
        return;
      }

      commitActiveSegment();
      setIsRecording(false);
      setIsInitializing(false);
      setIsWaitingForAssistant(false);
      setIsSaving(false);
      setVoiceRecoveryNotice({
        title: "Your session was interrupted",
        message: "The voice connection ended unexpectedly. Reconnect to continue this same conversation without starting over.",
        canReconnect: true,
      });
      eventContextRef.current.posthog.capture("voice_session_interrupted", {
        plan: eventContextRef.current.isPremium ? "paid" : "free",
        elapsedSeconds,
      });
    };

    finishInterruptedSessionRef.current = () => {
      intentionalEndRef.current = true;
      void saveEndedSession({ source: "interrupted-session-finished" });
    };

    const showCrisisSupport = (source: "vapi_tool_call" | "transcript_safety_net") => {
      if (crisisSupportOpenRef.current) return;

      crisisSupportOpenRef.current = true;
      setIsCrisisSupportOpen(true);
      eventContextRef.current.posthog.capture("crisis_support_shown", { source });
    };

    const onMessage = (msg: VapiMessage) => {
      if (msg.type === "status-update" && msg.status === "ended") {
        expectedEndRef.current = true;
        return;
      }

      if (isShowCrisisSupportToolCall(msg)) {
        showCrisisSupport("vapi_tool_call");
        return;
      }

      if (!isVapiTranscriptEvent(msg)) return;

      if (isFinalUserCrisisTranscript(msg)) {
        showCrisisSupport("transcript_safety_net");
      }

      setIsWaitingForAssistant(false);
      setVoiceRecoveryNotice(null);

      setMessages((prev) => {
        const updated = applyTranscriptEvent(prev, msg);
        messagesRef.current = updated;
        return updated;
      });
    };

    const showSoftVoiceRecovery = (technicalMessage: string) => {
      const now = Date.now();
      const hasRecentFallback = now - lastRecoveryNoticeRef.current < 12000;
      const fallbackText = "I lost you for a second, but I am still here. Go ahead when you are ready.";

      lastRecoveryNoticeRef.current = now;
      setIsInitializing(false);
      setIsSaving(false);
      setIsWaitingForAssistant(false);
      setVoiceRecoveryNotice({
        title: "Small connection hiccup",
        message: fallbackText,
      });

      if (!hasRecentFallback) {
        setMessages((prev) => {
          const fallbackMessage: Message = {
            id: `voice-recovery-${now}`,
            text: fallbackText,
            sender: "ai",
            timestamp: new Date(),
            isSystemFallback: true,
          };
          const updated = [...prev, fallbackMessage];
          messagesRef.current = updated;
          return updated;
        });
      }

      eventContextRef.current.posthog.capture("voice_session_soft_recovery_shown", {
        plan: eventContextRef.current.isPremium ? "paid" : "free",
        technicalMessage: technicalMessage.slice(0, 240),
      });
    };

    const onError = async (error: unknown) => {
      if (isDevelopment) debugError("VAPI error", error);
      const errorDetails = (error && typeof error === "object" ? error : {}) as VapiErrorLike;
      let serializedError = "";
      try {
        serializedError = JSON.stringify(error) || "";
      } catch {
        serializedError = String(error);
      }
      const errorMessage = getErrorMessage(error);

      const lowerErrorMessage = errorMessage.toLowerCase();
      const lowerSerializedError = serializedError.toLowerCase();

      const isMeetingEnded =
        errorDetails.type === "ejected" ||
        lowerSerializedError.includes('"type":"ejected"') ||
        lowerSerializedError.includes("meeting has ended") ||
        lowerErrorMessage.includes("meeting has ended");

      if (isMeetingEnded) {
        expectedEndRef.current = true;
        setIsRecording(false);
        setIsWaitingForAssistant(false);
        await saveEndedSession({
          source: "vapi-ejected",
          softNotice: {
            title: "This session has ended",
            message:
              "I am really sorry this session ended here. I would love to talk more about what you are going through or what you are feeling when you have more minutes.",
          },
          delayBeforeNavigateMs: 1800,
        });
        return;
      }

      const isActiveSession = isRecordingRef.current || !!callStartRef.current;
      const isLikelyProviderHiccup =
        lowerSerializedError.includes("openai") ||
        lowerSerializedError.includes("elevenlabs") ||
        lowerSerializedError.includes("vapi") ||
        lowerSerializedError.includes("deepgram") ||
        lowerSerializedError.includes("websocket") ||
        lowerSerializedError.includes("network") ||
        lowerSerializedError.includes("connection") ||
        lowerSerializedError.includes("timeout") ||
        lowerSerializedError.includes("temporarily") ||
        lowerErrorMessage.includes("openai") ||
        lowerErrorMessage.includes("elevenlabs") ||
        lowerErrorMessage.includes("vapi") ||
        lowerErrorMessage.includes("deepgram") ||
        lowerErrorMessage.includes("websocket") ||
        lowerErrorMessage.includes("network") ||
        lowerErrorMessage.includes("connection") ||
        lowerErrorMessage.includes("timeout") ||
        lowerErrorMessage.includes("temporarily");

      if (isActiveSession && isLikelyProviderHiccup) {
        if (isDevelopment) debugWarn("[vapi] Soft recovery shown instead of raw error");
        showSoftVoiceRecovery(errorMessage);
        return;
      }

      setIsInitializing(false);
      setIsSaving(false);
      setIsWaitingForAssistant(false);

      // Provide more user-friendly error messages based on the error content
      if (lowerErrorMessage.includes("assistant not found")) {
        if (isDevelopment) debugError("Assistant configuration error");
        alert("Assistant configuration error. Please contact support to resolve this issue.");
      } else if (lowerErrorMessage.includes("400")) {
        if (isDevelopment) debugError("Bad request from VAPI");
        alert("Configuration error (Vapi 400): " + errorMessage.slice(0, 400));
      } else if (lowerErrorMessage.includes("401") || lowerErrorMessage.includes("unauthorized")) {
        if (isDevelopment) debugError("VAPI authentication error");
        alert("Authentication error. Please verify your API key is correct.");
      } else if (lowerErrorMessage.includes("403")) {
        if (isDevelopment) debugError("VAPI access forbidden");
        alert("Access error. Please check your account permissions.");
      } else if (isActiveSession) {
        if (isDevelopment) debugWarn("[vapi] Unclassified active-session error shown softly");
        showSoftVoiceRecovery(errorMessage);
      } else {
        if (isDevelopment) debugError("Unexpected VAPI error", errorMessage);
        alert(`An error occurred: ${errorMessage}`);
      }
    };

    vapi.on("call-start", onCallStart);
    vapi.on("call-end", onCallEnd);
    vapi.on("message", onMessage);
    vapi.on("error", onError);

    return () => {
      vapi.off("call-start", onCallStart);
      vapi.off("call-end", onCallEnd);
      vapi.off("message", onMessage);
      vapi.off("error", onError);
      finishInterruptedSessionRef.current = () => {};
    };
  }, []);

  /* ---------------- TIMER ---------------- */
  useEffect(() => {
    if (!isRecording) {
      setOneMinuteWarningShown(false);
      warningTriggeredRef.current = false;
      return;
    }
    const t = setInterval(() => {
      setSessionTime((s) => {
        const nextTime = s + 1;
        if (maxSessionSeconds && maxSessionSeconds > 60) {
          const remaining = maxSessionSeconds - nextTime;
          if (remaining <= 60 && !warningTriggeredRef.current) {
            warningTriggeredRef.current = true;
            setOneMinuteWarningShown(true);
          }
        }
        return nextTime;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [isRecording, maxSessionSeconds]);

  /* ---------------- AUTOSCROLL (CHAT ONLY) ---------------- */
  useEffect(() => {
    if (messages.length > 0) {
      const latestMessage = messages[messages.length - 1];
      messagesEndRef.current?.scrollIntoView({
        behavior: latestMessage.isLive ? "auto" : "smooth",
        block: "end",
      });
    }
  }, [messages]);

  /* ---------------- MIC HANDLER ---------------- */
  const toggleRecording = () => {
    if (!isSignedIn) {
      setIsAuthPromptOpen(true);
      return;
    }

    const vapi = vapiRef.current;
    if (!vapi || !isVapiClientReady()) {
      if (isDevelopment) debugError("VAPI client not initialized or missing API key");
      alert("VAPI client not ready. Please check your configuration.");
      return;
    }

    // ✅ ALWAYS allow stop
    if (isRecording) {
      intentionalEndRef.current = true;
      setIsSaving(true);
      vapi.stop();
      return;
    }

    // Start new session after checking consent
    if (consentGranted === null) {
      setIsConsentModalOpen(true);
    } else {
      startVoiceSession(consentGranted);
    }
  };

  const startVoiceSession = async (consent: boolean = false, resumeExisting = false) => {
    if (isRecording || isInitializing) return;
    if (resumeExisting && (!sessionIdRef.current || !sessionResumeTokenRef.current)) {
      setVoiceRecoveryNotice({
        title: "This session could not reconnect",
        message: "The secure recovery details are no longer available. Finish this session to preserve what was captured.",
        canReconnect: false,
      });
      return;
    }

    setIsInitializing(true);
    setSessionNotice(null);
    setVoiceRecoveryNotice(null);
    reconnectAttemptRef.current = resumeExisting;
    intentionalEndRef.current = false;
    expectedEndRef.current = false;

    if (!resumeExisting) {
      setMessages([]);
      messagesRef.current = [];
      setSessionTime(0);
      setMaxSessionSeconds(null);
      maxSessionSecondsRef.current = null;
      setOneMinuteWarningShown(false);
      warningTriggeredRef.current = false;
      saveAttemptedRef.current = false;
      callStartRef.current = null;
      activeSegmentStartRef.current = null;
      accumulatedCallSecondsRef.current = 0;
      sessionIdRef.current = null;
      sessionResumeTokenRef.current = null;
    }

    const showNoMinutesNotice = (data?: NoMinutesData) => {
      const minutesRemaining = data?.minutesRemaining ?? premiumCalls;
      const latestFreeTrialLimit = data?.freeTrialLimit ?? freeTrialLimit;
      const latestFreeTrialUsed = data?.freeTrialUsed ??
        Math.min(latestFreeTrialLimit, Math.max(0, latestFreeTrialLimit - minutesRemaining));

      setSessionNotice({
        title: isPremium ? "You're out of minutes" : "Your free minutes are used up",
        message: isPremium
          ? "Your current plan has 0 minutes remaining. Choose a plan when you are ready to continue."
          : `You have used ${latestFreeTrialUsed} of ${latestFreeTrialLimit} free minute${latestFreeTrialLimit === 1 ? "" : "s"}. Choose a plan when you are ready to continue.`,
      });
    };

    try {
      // 1. Ask server for call config (checks minutes balance, injects memory)
      const resumeMessages = resumeExisting
        ? messagesRef.current
            .slice(-8)
            .map((message) => ({
              role: message.sender === "user" ? "user" : "assistant",
              content: message.text.slice(0, 1_000),
            }))
        : undefined;
      const tokenRes = await api.post("/vapi-token", {
        sessionId: resumeExisting ? sessionIdRef.current : undefined,
        resumeToken: resumeExisting ? sessionResumeTokenRef.current : undefined,
        resumeMessages,
        memoryConsent: consent,
        language
      });

      if (tokenRes.status === 402) {
        // Track minutes exhausted in PostHog
        posthog.capture("minutes_exhausted", {
          plan: isPremium ? "paid" : "free",
          minutesUsed: freeTrialUsed,
        });

        showNoMinutesNotice(tokenRes.data);
        setIsInitializing(false);
        return;
      }

      const {
        assistantId,
        assistantOverrides,
        sessionId: serverSessionId,
        resumeToken,
      } = tokenRes.data;

      // Store the max duration for 1-minute warning calculation
      const maxSec = assistantOverrides?.maxDurationSeconds || (premiumCalls * 60);
      const totalMaxSeconds = resumeExisting
        ? accumulatedCallSecondsRef.current + maxSec
        : maxSec;
      setMaxSessionSeconds(totalMaxSeconds);
      maxSessionSecondsRef.current = totalMaxSeconds;

      // Store the session ID from the server (has userId in metadata)
      sessionIdRef.current = serverSessionId;
      sessionResumeTokenRef.current = resumeToken;

      // 2. Start Vapi with the full assistant config from server
      const vapi = vapiRef.current;
      if (!vapi) throw new Error("Vapi not initialized");

      // ✅ Start via the dashboard assistant (voice comes from there) + dynamic overrides
      const call = await vapi.start(assistantId, assistantOverrides);
      if (!call) throw new Error("Vapi did not establish the voice connection");

      // client/app/echo/[sessionId]/ChatContent.tsx — replace the catch block in startVoiceSession:
    } catch (err: unknown) {
      const apiError = err as ApiErrorLike;
      setIsInitializing(false);
      reconnectAttemptRef.current = false;

      if (resumeExisting) {
        setVoiceRecoveryNotice({
          title: "Reconnect did not complete",
          message: "Your conversation is still here. Check your connection and tap reconnect to try again.",
          canReconnect: true,
        });
      }

      // No response at all = network/CORS failure, not a server error
      if (!apiError.response) {
        if (isDevelopment) debugError("[startVoiceSession] Network/CORS error", apiError.message);
        if (resumeExisting) return;
        alert(
          "Couldn't reach the server. This usually means one of:\n" +
          "• The server is still starting up (free hosting spins down when idle — wait ~30s and retry)\n" +
          "• The deployed frontend is missing NEXT_PUBLIC_API_URL\n" +
          "• Your internet / local dev server is down\n\n" +
          "For Vercel, set NEXT_PUBLIC_API_URL to your Render backend URL, then redeploy."
        );
        return;
      }

      const status = apiError.response.status;

      if (status === 402) {
        posthog.capture("minutes_exhausted", {
          plan: isPremium ? "paid" : "free",
          minutesUsed: apiError.response.data?.freeTrialUsed ?? freeTrialUsed,
        });
        showNoMinutesNotice(apiError.response.data);
        return;
      }

      if (status === 429) {
        if (resumeExisting) return;
        alert("You're starting sessions too quickly. Please wait 30 seconds and try again.");
        return;
      }

      if (status === 401) {
        if (resumeExisting) return;
        alert("Your session has expired. Please refresh the page and sign in again.");
        return;
      }

      if (status === 500 || status === 503) {
        const serverError = apiError.response.data?.error || "The server could not prepare the call.";
        const serverCode = apiError.response.data?.code;
        if (isDevelopment) debugError("[startVoiceSession] Server error", status);
        if (!resumeExisting) {
          alert(serverCode ? `${serverError}\n\nCode: ${serverCode}` : serverError);
        }
        return;
      }

      // Genuine server error — log full details for debugging, show generic message to user
      if (isDevelopment) debugError("[startVoiceSession] Server error", status);
      if (!resumeExisting) {
        alert("Something went wrong starting your session. Please try again in a moment.");
      }
    }
  };


  const formatTime = (s: number) => {
    const mm = Math.floor(s / 60)
      .toString()
      .padStart(2, "0");
    const ss = (s % 60).toString().padStart(2, "0");
    return `${mm}:${ss}`;
  };

  /* ---------------- UI ---------------- */
  return (
    <div className="void-page pt-24 px-4 pb-40">
      <ConstellationField density="ambient" className="fixed opacity-35" />
      <CrisisSupportDialog
        isOpen={isCrisisSupportOpen}
        onDismiss={() => {
          crisisSupportOpenRef.current = false;
          setIsCrisisSupportOpen(false);
        }}
      />
      <AnimatePresence>
        {isAuthPromptOpen && (
          <motion.div
            className="fixed inset-0 z-[120] flex items-center justify-center bg-black/75 px-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="voice-auth-title"
          >
            <motion.div
              className="relative w-full max-w-md border border-white/15 bg-[#09090c] p-7 shadow-2xl shadow-black/60"
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
            >
              <button
                type="button"
                onClick={() => setIsAuthPromptOpen(false)}
                className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center text-white/50 transition hover:text-white"
                aria-label="Close sign-in prompt"
              >
                <X size={18} />
              </button>
              <p className="void-kicker mb-3">Ready when you are</p>
              <h2 id="voice-auth-title" className="pr-8 text-2xl font-semibold text-white">
                Sign in to begin speaking
              </h2>
              <p className="mt-3 text-sm leading-6 text-white/60">
                Your account keeps your minute balance, summaries, and privacy choices connected securely. You can continue exploring EchoMind without signing in.
              </p>
              <div className="mt-7 grid gap-3 sm:grid-cols-2">
                <Link
                  href={`/sign-in?redirect_url=${encodeURIComponent("/?view=chat")}`}
                  className="inline-flex min-h-12 items-center justify-center gap-2 bg-white px-4 text-sm font-semibold text-black transition hover:bg-white/90"
                >
                  <LogIn size={17} /> Sign in
                </Link>
                <Link
                  href={`/sign-up?redirect_url=${encodeURIComponent("/?view=chat")}`}
                  className="inline-flex min-h-12 items-center justify-center gap-2 border border-white/20 px-4 text-sm font-semibold text-white transition hover:border-white/40 hover:bg-white/5"
                >
                  <UserPlus size={17} /> Create account
                </Link>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Header */}
      <div className="relative z-10 container mx-auto max-w-4xl mb-10">
        <div className="flex items-center justify-between">
          <button
            onClick={() => onNavigate("home")}
            className="void-ghost flex items-center gap-2"
          >
            <ArrowLeft size={20} /> Back
          </button>
          <h3 className="void-kicker">
            Echo Session
          </h3>
        </div>
      </div>

      {/* Main Content - Centered for larger screens */}
      <div className="relative z-10 container mx-auto max-w-4xl">
        <div className="flex flex-col items-center">
          {/* Chat Area - Centered on all screens */}
          <div className="w-full max-w-2xl">
            {sessionNotice && (
              <div className="mb-4 border-t border-b border-amber-400/30 py-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-semibold text-amber-100">{sessionNotice.title}</p>
                    <p className="mt-1 text-sm text-amber-100/80">{sessionNotice.message}</p>
                  </div>
                  <button
                    onClick={() => onNavigate("sessions")}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-[--color-saffron-spark] px-4 py-2 text-sm font-semibold text-black transition-colors hover:opacity-90"
                  >
                    <CreditCard size={16} />
                    View plans
                  </button>
                </div>
              </div>
            )}
            {voiceRecoveryNotice && (
              <div className="mb-4 border-t border-b border-violet-400/25 py-4" role="status">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-semibold text-violet-100">
                      {voiceRecoveryNotice.title}
                    </p>
                    <p className="mt-1 text-sm text-violet-100/75">
                      {voiceRecoveryNotice.message}
                    </p>
                  </div>
                  {voiceRecoveryNotice.canReconnect ? (
                    <div className="flex shrink-0 flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => void startVoiceSession(consentGranted ?? false, true)}
                        disabled={isInitializing}
                        className="inline-flex min-h-10 items-center gap-2 rounded-full bg-[--color-electric-iris] px-4 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isInitializing ? <Loader2 className="animate-spin" size={16} /> : <RefreshCw size={16} />}
                        {isInitializing ? "Reconnecting..." : "Reconnect"}
                      </button>
                      <button
                        type="button"
                        onClick={() => finishInterruptedSessionRef.current()}
                        disabled={isInitializing || isSaving}
                        className="min-h-10 rounded-full border border-white/15 px-4 text-sm font-semibold text-white/75 transition hover:border-white/30 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Finish session
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setVoiceRecoveryNotice(null)}
                      className="self-start rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white/80 transition-colors hover:border-white/30 hover:text-white sm:self-auto"
                    >
                      Dismiss
                    </button>
                  )}
                </div>
              </div>
            )}
            {oneMinuteWarningShown && (
              <div className="mb-4 rounded-xl border border-amber-400/40 bg-amber-500/10 p-4 text-amber-100 flex items-center justify-between gap-3 shadow-lg backdrop-blur-md">
                <div className="flex items-center gap-3">
                  <Clock className="text-amber-300 animate-pulse shrink-0" size={20} />
                  <div>
                    <p className="font-semibold text-amber-200 text-sm">About 1 minute remaining</p>
                    <p className="text-xs text-amber-100/80 mt-0.5">
                      Echo is gently wrapping up this session with a spoken heads-up so your conversation finishes peacefully.
                    </p>
                  </div>
                </div>
              </div>
            )}
            <div className="border-t void-hairline pt-6">
              <div className="mb-4 grid gap-3 sm:grid-cols-2">
                <div className="flex items-center justify-between border-t void-hairline py-3">
                  <span className="text-[--color-silver-mist] flex items-center gap-2">
                    <Clock className="text-[--color-electric-iris]" size={18} /> Session Time
                  </span>
                  <span className="text-2xl font-mono text-white">
                    {formatTime(sessionTime)}
                  </span>
                </div>
                <div className="flex items-center justify-between border-t void-hairline py-3">
                  <span className="text-[--color-silver-mist]">Minutes Remaining</span>
                  <span className="text-2xl font-mono text-white">
                    {premiumCalls}
                  </span>
                </div>
              </div>
              {isRecording && (
                <div className="mb-4 flex items-center justify-center gap-2 text-xs text-white/55" role="note">
                  <Smartphone size={14} className="text-teal-300" />
                  <span>Keep this screen on during your session.</span>
                </div>
              )}



              {/* Messages Container */}
              <div className="border-t border-b void-hairline p-6 min-h-[400px] max-h-[60vh] overflow-y-auto">
                {messages.length === 0 ? (
                  <div className="flex min-h-[400px] flex-col items-center justify-center text-center space-y-6">
                    <EchoOrb size="md" isPulsing={isRecording} />
                    {!isRecording && !isInitializing && (
                      <div className="flex flex-wrap justify-center gap-2 mb-5">
                        {LANGUAGES.map((l) => (
                          <button
                            key={l.code}
                            type="button"
                            onClick={() => setLanguage(l.code as "en" | "hi" | "mr" | "ta")}
                            style={
                              language === l.code
                                ? {
                                    background: "rgba(128, 82, 255, 0.18)",
                                    border: "1px solid rgba(128, 82, 255, 0.7)",
                                    color: "#c4b0ff",
                                    boxShadow: "0 0 12px rgba(128, 82, 255, 0.25)",
                                  }
                                : {
                                    background: "transparent",
                                    border: "1px solid rgba(255, 255, 255, 0.14)",
                                    color: "#9a9a9a",
                                  }
                            }
                            className="px-4 py-1.5 rounded-full text-sm font-medium cursor-pointer select-none transition-all duration-200 hover:border-white/30 hover:text-white active:scale-95"
                          >
                            {l.label}
                          </button>
                        ))}
                      </div>
                    )}
                    <div className="w-full">
                      <VapiHUD
                        isRecording={isRecording}
                        onToggleRecording={toggleRecording}
                        isInitializing={isInitializing}
                        isWaitingForAssistant={isWaitingForAssistant}
                        isSaving={isSaving}
                      />
                    </div>
                    {!isRecording && premiumCalls <= 3 && premiumCalls > 0 && (
                      <p className="text-[--color-saffron-spark] text-sm text-center mb-2">
                        You have {premiumCalls} minute{premiumCalls !== 1 ? "s" : ""} left. This session will end
                        automatically when your time runs out.
                      </p>
                    )}
                    <p className="text-[--color-silver-mist] text-lg">
                      {isRecording
                        ? "Echo is listening & reflecting..."
                        : "Choose your language, then tap the mic to start."}
                    </p>
                    <p className="text-[--color-ash-gray] text-sm max-w-md">
                      Share your thoughts and feelings freely. I&apos;m here to
                      listen and help you explore your emotions.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-4">
                      {messages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`flex ${msg.sender === "user"
                            ? "justify-end"
                            : "justify-start"
                            }`}
                        >
                          <div
                            className={`max-w-[85%] px-4 py-3 rounded-2xl border ${msg.sender === "user"
                              ? "border-[--color-electric-iris] bg-[--color-electric-iris] text-white rounded-br-none"
                              : msg.isSystemFallback
                              ? "border-violet-400/30 bg-violet-500/10 text-violet-100 rounded-bl-none"
                              : "border-white/15 bg-transparent text-[--color-silver-mist] rounded-bl-none"
                              }`}
                          >
                            <p>{msg.text}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>
              <SessionHeadsUpNote />
            </div>
          </div>

          {/* Loading indicator during initialization */}
          <AnimatePresence>
            {isInitializing && (
              <motion.div
                className="mt-4 w-full max-w-2xl"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <div className="flex items-center justify-center gap-2 border-t void-hairline py-4">
                  <Loader2 className="animate-spin text-[--color-electric-iris]" size={20} />
                  <span className="text-[--color-silver-mist] font-medium">Echo is tuning in and preparing your session...</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Loading indicator during saving */}
          <AnimatePresence>
            {isSaving && (
              <motion.div
                className="mt-4 w-full max-w-2xl"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <div className="flex items-center justify-center gap-2 border-t void-hairline py-4">
                  <Loader2 className="animate-spin text-[--color-electric-iris]" size={20} />
                  <span className="text-[--color-silver-mist] font-medium">Echo is preserving your session reflections...</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {messages.length > 0 && (
          <div className="mt-6 w-full max-w-2xl">
            <div className="flex justify-center">
              <div className="relative w-full">
                <VapiHUD
                  isRecording={isRecording}
                  onToggleRecording={toggleRecording}
                  isInitializing={isInitializing}
                  isWaitingForAssistant={isWaitingForAssistant}
                  isSaving={isSaving}
                />
              </div>
            </div>
          </div>
          )}
          <PrivacyConsentModal
            isOpen={isConsentModalOpen}
            onClose={() => setIsConsentModalOpen(false)}
            onConsentGiven={(granted) => {
              setConsentGranted(granted);
              startVoiceSession(granted);
            }}
          />
          {moodModalSessionId && (
            <MoodCheckModal
              isOpen={!!moodModalSessionId}
              sessionId={moodModalSessionId}
              onDone={closeMoodModal}
            />
          )}
        </div>
      </div>
    </div>
  );
}


export default ChatContent;
