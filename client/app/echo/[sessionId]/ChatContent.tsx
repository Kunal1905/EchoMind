"use client";

import React, { useEffect, useRef, useState } from "react";
import { redirect } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, Clock, CreditCard, Loader2 } from "lucide-react";
import Vapi from "@vapi-ai/web";
import { vapiClient, isVapiClientReady } from "../../lib/vapiClient";
import { VapiHUD } from "../../components/VapiHUD";
import { EchoOrb } from "../../components/EchoOrb";
import { v4 as uuidv4 } from "uuid";
import api from "@/app/lib/api";
import { usePostHog } from "posthog-js/react";
import { PrivacyConsentModal } from "../../components/PrivacyConsentModal";
import { MoodCheckModal } from "../../components/MoodCheckModal";
import ConstellationField from "../../components/ConstellationField";


interface Message {
  id: string;
  text: string;
  sender: "user" | "ai";
  timestamp: Date;
  isLive?: boolean;
  isSystemFallback?: boolean;
}

type VoiceRecoveryNotice = {
  title: string;
  message: string;
};

type VapiTranscriptMessage = {
  type?: string;
  role?: string;
  transcriptType?: string;
  transcript?: string;
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
  if (!isSignedIn) redirect("/sign-in");

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
  const saveAttemptedRef = useRef(false);
  const callStartRef = useRef<number | null>(null); // ✅ live call-start timestamp (avoids stale state in the once-registered listener)
  const isRecordingRef = useRef(false);
  const lastRecoveryNoticeRef = useRef(0);

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

  /* ---------------- VAPI EVENTS ---------------- */
  useEffect(() => {
    const vapi = vapiRef.current;
    if (!vapi) return;

    const onCallStart = () => {
      sessionIdRef.current = sessionIdRef.current || uuidv4();
      callStartRef.current = Date.now();
      saveAttemptedRef.current = false;
      setIsRecording(true);
      setIsInitializing(false);
      setIsWaitingForAssistant(true);
      setVoiceRecoveryNotice(null);

      // Track Session Started in PostHog
      posthog.capture("session_started", {
        plan: isPremium ? "premium" : "free",
        minutesRemaining: premiumCalls,
        hasMemory: !!consentGranted,
      });
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

        // ✅ Compute duration from the ref, not sessionTime state (which is stale
        // inside this once-registered listener). This drives the stored time AND
        // the minutes deducted in /session-chat.
        const durationSec = callStartRef.current
          ? Math.max(0, Math.floor((Date.now() - callStartRef.current) / 1000))
          : sessionTime;

        console.log(`[${source}] saving session:`, {
          messagesCaptured: messagesRef.current.length,
          notesLength: notes.length,
          durationSec,
          sessionId: sessionIdRef.current,
        });

        const response = await api.post("/session-chat", {
          sessionId: sessionIdRef.current,
          notes,
          durationSec,
        });

        if (response.status !== 200 && response.status !== 201) {
          console.error(`[${source}] Save failed:`, response.status, response.data);
        } else {
          console.log(`[${source}] session saved OK`);
          // Track Session Completed in PostHog
          posthog.capture("session_completed", {
            durationSec,
            plan: isPremium ? "premium" : "free",
            hadIntention: false,
            endSource: source,
          });
          await onSessionComplete();
          if (completedSessionId) {
            await promptMoodCheck(completedSessionId);
          }
          if (delayBeforeNavigateMs > 0) {
            await new Promise((resolve) => setTimeout(resolve, delayBeforeNavigateMs));
          }
          onNavigate("history");
        }

      } catch (e) {
        console.error("Save failed", e);
      } finally {
        setIsSaving(false);
        sessionIdRef.current = null;
        callStartRef.current = null;
      }
    };

    const onCallEnd = async () => {
      await saveEndedSession({ source: "onCallEnd" });
    };

    const onMessage = (msg: VapiTranscriptMessage) => {
      if (msg?.type !== "transcript") return;

      const sender: "user" | "ai" = msg.role === "assistant" ? "ai" : "user";
      const isFinal = msg.transcriptType === "final";
      const transcript = msg.transcript || "";

      setIsWaitingForAssistant(false);
      setVoiceRecoveryNotice(null);

      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last && last.sender === sender && last.isLive) {
          const copy = [...prev];
          copy[copy.length - 1] = {
            ...last,
            text: transcript,
            isLive: !isFinal,
          };
          messagesRef.current = copy;
          return copy;
        }

        const newMessage: Message = {
          id: `${sender}-${Date.now()}`,
          text: transcript,
          sender,
          timestamp: new Date(),
          isLive: !isFinal,
        };

        const updated = [...prev, newMessage];
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

      posthog.capture("voice_session_soft_recovery_shown", {
        plan: isPremium ? "premium" : "free",
        technicalMessage: technicalMessage.slice(0, 240),
      });
    };

    const onError = async (error: unknown) => {
      console.error("VAPI Error:", error);
      console.error("FULL ERROR", error);
      const errorDetails = (error && typeof error === "object" ? error : {}) as VapiErrorLike;
      let serializedError = "";
      try {
        serializedError = JSON.stringify(error) || "";
        console.error("JSON", JSON.stringify(error, null, 2));
      } catch {
        serializedError = String(error);
        console.error("JSON", serializedError);
      }
      console.error("message", errorDetails.message);
      console.error("status", errorDetails.status);
      console.error("response", errorDetails.response);
      const errorMessage = getErrorMessage(error);

      const lowerErrorMessage = errorMessage.toLowerCase();
      const lowerSerializedError = serializedError.toLowerCase();

      const isMeetingEnded =
        errorDetails.type === "ejected" ||
        lowerSerializedError.includes('"type":"ejected"') ||
        lowerSerializedError.includes("meeting has ended") ||
        lowerErrorMessage.includes("meeting has ended");

      if (isMeetingEnded) {
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
        console.warn("[vapi] Soft recovery shown instead of raw error:", errorMessage);
        showSoftVoiceRecovery(errorMessage);
        return;
      }

      setIsInitializing(false);
      setIsSaving(false);
      setIsWaitingForAssistant(false);

      // Provide more user-friendly error messages based on the error content
      if (lowerErrorMessage.includes("assistant not found")) {
        console.error("Assistant configuration error. Please verify your assistant ID is correct and properly configured in the VAPI dashboard.");
        alert("Assistant configuration error. Please contact support to resolve this issue.");
      } else if (lowerErrorMessage.includes("400")) {
        console.error("Bad request error. This may be due to an invalid assistant configuration.", errorMessage);
        alert("Configuration error (Vapi 400): " + errorMessage.slice(0, 400) + "\n\nOpen the browser console and share the 'FULL ERROR' / 'JSON' Vapi logs for the exact rejected field.");
      } else if (lowerErrorMessage.includes("401") || lowerErrorMessage.includes("unauthorized")) {
        console.error("Authentication error. Please verify your API key is correct and has proper permissions.");
        alert("Authentication error. Please verify your API key is correct.");
      } else if (lowerErrorMessage.includes("403")) {
        console.error("Access forbidden. Please check your VAPI account permissions.");
        alert("Access error. Please check your account permissions.");
      } else if (isActiveSession) {
        console.warn("[vapi] Unclassified active-session error shown softly:", errorMessage);
        showSoftVoiceRecovery(errorMessage);
      } else {
        console.error("An unexpected error occurred:", errorMessage);
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
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  /* ---------------- MIC HANDLER ---------------- */
  const toggleRecording = () => {
    const vapi = vapiRef.current;
    if (!vapi || !isVapiClientReady()) {
      console.error("VAPI client not initialized or missing API key");
      alert("VAPI client not ready. Please check your configuration.");
      return;
    }

    // ✅ ALWAYS allow stop
    if (isRecording) {
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

  const startVoiceSession = async (consent: boolean = false) => {
    if (isRecording || isInitializing) return;
    setIsInitializing(true);
    setSessionNotice(null);
    setVoiceRecoveryNotice(null);
    setMessages([]);
    messagesRef.current = [];
    setSessionTime(0);
    setOneMinuteWarningShown(false);
    warningTriggeredRef.current = false;
    saveAttemptedRef.current = false;
    callStartRef.current = null;

    const showNoMinutesNotice = (data?: NoMinutesData) => {
      const minutesRemaining = data?.minutesRemaining ?? premiumCalls;
      const latestFreeTrialLimit = data?.freeTrialLimit ?? freeTrialLimit;
      const latestFreeTrialUsed = data?.freeTrialUsed ??
        Math.min(latestFreeTrialLimit, Math.max(0, latestFreeTrialLimit - minutesRemaining));

      setSessionNotice({
        title: isPremium ? "You're out of minutes" : "Your free minutes are used up",
        message: isPremium
          ? "Your current plan has 0 minutes remaining. Add more minutes when you are ready to continue."
          : `You have used ${latestFreeTrialUsed} of ${latestFreeTrialLimit} free minute${latestFreeTrialLimit === 1 ? "" : "s"}. Add more minutes when you are ready to continue.`,
      });
    };

    try {
      // 1. Ask server for call config (checks minutes balance, injects memory)
      const tokenRes = await api.post("/vapi-token", {
        sessionId: sessionIdRef.current ?? undefined,
        memoryConsent: consent,
        language
      });

      if (tokenRes.status === 402) {
        // Track minutes exhausted in PostHog
        posthog.capture("minutes_exhausted", {
          plan: isPremium ? "premium" : "free",
          minutesUsed: freeTrialUsed,
        });

        showNoMinutesNotice(tokenRes.data);
        setIsInitializing(false);
        return;
      }

      const { assistantId, assistantOverrides, sessionId: serverSessionId } = tokenRes.data;

      // Store the max duration for 1-minute warning calculation
      const maxSec = assistantOverrides?.maxDurationSeconds || (premiumCalls * 60);
      setMaxSessionSeconds(maxSec);

      // Store the session ID from the server (has userId in metadata)
      sessionIdRef.current = serverSessionId;

      // 2. Start Vapi with the full assistant config from server
      const vapi = vapiRef.current;
      if (!vapi) throw new Error("Vapi not initialized");

      console.log(
        "Starting Vapi assistant:",
        assistantId,
        "with overrides:",
        JSON.stringify(assistantOverrides, null, 2)
      );

      // ✅ Start via the dashboard assistant (voice comes from there) + dynamic overrides
      vapi.start(assistantId, assistantOverrides);

      // client/app/echo/[sessionId]/ChatContent.tsx — replace the catch block in startVoiceSession:
    } catch (err: unknown) {
      const apiError = err as ApiErrorLike;
      setIsInitializing(false);

      // No response at all = network/CORS failure, not a server error
      if (!apiError.response) {
        console.error("[startVoiceSession] Network/CORS error:", apiError.message);
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
          plan: isPremium ? "premium" : "free",
          minutesUsed: apiError.response.data?.freeTrialUsed ?? freeTrialUsed,
        });
        showNoMinutesNotice(apiError.response.data);
        return;
      }

      if (status === 429) {
        alert("You're starting sessions too quickly. Please wait 30 seconds and try again.");
        return;
      }

      if (status === 401) {
        alert("Your session has expired. Please refresh the page and sign in again.");
        return;
      }

      if (status === 500 || status === 503) {
        const serverError = apiError.response.data?.error || "The server could not prepare the call.";
        const serverCode = apiError.response.data?.code;
        console.error("[startVoiceSession] Server error:", status, apiError.response.data);
        alert(serverCode ? `${serverError}\n\nCode: ${serverCode}` : serverError);
        return;
      }

      // Genuine server error — log full details for debugging, show generic message to user
      console.error("[startVoiceSession] Server error:", status, apiError.response.data);
      alert("Something went wrong starting your session. Please try again in a moment.");
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
              <div className="mb-4 border-t border-b border-violet-400/25 py-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-semibold text-violet-100">
                      {voiceRecoveryNotice.title}
                    </p>
                    <p className="mt-1 text-sm text-violet-100/75">
                      {voiceRecoveryNotice.message}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setVoiceRecoveryNotice(null)}
                    className="self-start rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white/80 transition-colors hover:border-white/30 hover:text-white sm:self-auto"
                  >
                    Dismiss
                  </button>
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



              {/* Messages Container */}
              <div className="border-t border-b void-hairline p-6 min-h-[400px] max-h-[60vh] overflow-y-auto">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center space-y-6">
                    <EchoOrb size="lg" isPulsing={isRecording} />
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
                    {!isRecording && premiumCalls <= 3 && premiumCalls > 0 && (
                      <p className="text-[--color-saffron-spark] text-sm text-center mb-2">
                        You have {premiumCalls} minute{premiumCalls !== 1 ? "s" : ""} left. This session will end
                        automatically when your time runs out.
                      </p>
                    )}
                    <p className="text-[--color-silver-mist] animate-pulse text-lg">
                      {isRecording
                        ? "Echo is listening & reflecting..."
                        : "Press the mic when you're ready to share with Echo."}
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

          {/* HUD - Now positioned below chat in the flow instead of fixed */}
          <div className="mt-6 w-full max-w-2xl">
            <div className="flex justify-center">
              <div className="relative"> {/* Wrapper to contain the HUD without fixed positioning */}
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
