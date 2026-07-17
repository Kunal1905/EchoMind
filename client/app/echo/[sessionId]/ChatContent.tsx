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


interface Message {
  id: string;
  text: string;
  sender: "user" | "ai";
  timestamp: Date;
  isLive?: boolean;
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
  const [sessionNotice, setSessionNotice] = useState<{
    title: string;
    message: string;
  } | null>(null);

  const [isConsentModalOpen, setIsConsentModalOpen] = useState(false);
  const [consentGranted, setConsentGranted] = useState<boolean | null>(null);

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

  const API_KEY = process.env.NEXT_PUBLIC_VAPI_API_KEY!;

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

  /* ---------------- VAPI EVENTS ---------------- */
  useEffect(() => {
    const vapi = vapiRef.current;
    if (!vapi) return;

    const onCallStart = () => {
      sessionIdRef.current = sessionIdRef.current || uuidv4();
      callStartRef.current = Date.now();
      setIsRecording(true);
      setIsInitializing(false);
      setIsWaitingForAssistant(true);

      // Track Session Started in PostHog
      posthog.capture("session_started", {
        plan: isPremium ? "premium" : "free",
        minutesRemaining: premiumCalls,
        hasMemory: !!consentGranted,
      });
    };

    const onCallEnd = async () => {
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
        const notes = messagesRef.current
          .map((m) => `${m.sender}: ${m.text}`)
          .join("\n");

        // ✅ Compute duration from the ref, not sessionTime state (which is stale
        // inside this once-registered listener). This drives the stored time AND
        // the minutes deducted in /session-chat.
        const durationSec = callStartRef.current
          ? Math.max(0, Math.floor((Date.now() - callStartRef.current) / 1000))
          : sessionTime;

        console.log("[onCallEnd] saving session:", {
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
          console.error("[onCallEnd] Save failed:", response.status, response.data);
        } else {
          console.log("[onCallEnd] session saved OK");
          // Track Session Completed in PostHog
          posthog.capture("session_completed", {
            durationSec: sessionTime,
            plan: isPremium ? "premium" : "free",
            hadIntention: false,
          });
          await onSessionComplete();
          onNavigate("history");
        }

      } catch (e) {
        console.error("Save failed", e);
      } finally {
        setIsSaving(false);
        sessionIdRef.current = null;
        saveAttemptedRef.current = false;
      }
    };

    const onMessage = (msg: any) => {
      if (msg?.type !== "transcript") return;

      const sender: "user" | "ai" = msg.role === "assistant" ? "ai" : "user";
      const isFinal = msg.transcriptType === "final";

      setIsWaitingForAssistant(false);

      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last && last.sender === sender && last.isLive) {
          const copy = [...prev];
          copy[copy.length - 1] = {
            ...last,
            text: msg.transcript,
            isLive: !isFinal,
          };
          messagesRef.current = copy;
          return copy;
        }

        const newMessage: Message = {
          id: `${sender}-${Date.now()}`,
          text: msg.transcript,
          sender,
          timestamp: new Date(),
          isLive: !isFinal,
        };

        const updated = [...prev, newMessage];
        messagesRef.current = updated;
        return updated;
      });
    };

    const onError = (error: any) => {
      console.error("VAPI Error:", error);
      console.error("FULL ERROR", error);
      console.error("JSON", JSON.stringify(error, null, 2));
      console.error("message", error?.message);
      console.error("status", error?.status);
      console.error("response", error?.response);
      // Clear all loading states on error
      setIsInitializing(false);
      setIsSaving(false);
      // If we were recording, stop recording
      if (isRecording) {
        setIsRecording(false);
        setIsWaitingForAssistant(false);
      }

      // Extract error message safely - handle different possible error structures
      let errorMessage = "An unexpected error occurred";

      if (typeof error === 'object' && error !== null) {
        // Check different possible error object structures
        if (error.message && typeof error.message === 'string') {
          errorMessage = error.message;
        } else if (error.error && typeof error.error === 'object') {
          // Handle when error.error is an object
          if (error.error.message && typeof error.error.message === 'string') {
            errorMessage = error.error.message;
          } else if (error.error.error && typeof error.error.error === 'string') {
            errorMessage = error.error.error;
          } else if (typeof error.error === 'string') {
            errorMessage = error.error;
          } else if (error.error && typeof error.error === 'object' && error.error.message) {
            // If error.message is an object, try to convert it to string
            errorMessage = typeof error.error.message === 'object'
              ? JSON.stringify(error.error.message)
              : String(error.error.message);
          }
        } else if (typeof error === 'string') {
          errorMessage = error;
        } else {
          // If error object doesn't have expected properties, try to stringify it
          errorMessage = JSON.stringify(error);
        }
      }

      // Ensure errorMessage is a string before calling toLowerCase
      if (typeof errorMessage !== 'string') {
        errorMessage = String(errorMessage);
      }

      // Provide more user-friendly error messages based on the error content
      if (errorMessage.toLowerCase().includes("assistant not found")) {
        console.error("Assistant configuration error. Please verify your assistant ID is correct and properly configured in the VAPI dashboard.");
        alert("Assistant configuration error. Please contact support to resolve this issue.");
      } else if (errorMessage.toLowerCase().includes("400")) {
        console.error("Bad request error. This may be due to an invalid assistant configuration.", errorMessage);
        alert("Configuration error (Vapi 400): " + errorMessage.slice(0, 400) + "\n\nOpen the browser console and share the 'FULL ERROR' / 'JSON' Vapi logs for the exact rejected field.");
      } else if (errorMessage.toLowerCase().includes("401") || errorMessage.toLowerCase().includes("unauthorized")) {
        console.error("Authentication error. Please verify your API key is correct and has proper permissions.");
        alert("Authentication error. Please verify your API key is correct.");
      } else if (errorMessage.toLowerCase().includes("403")) {
        console.error("Access forbidden. Please check your VAPI account permissions.");
        alert("Access error. Please check your account permissions.");
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
    if (!isRecording) return;
    const t = setInterval(() => setSessionTime((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [isRecording]);

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
    setMessages([]);
    messagesRef.current = [];
    setSessionTime(0);
    saveAttemptedRef.current = false;
    callStartRef.current = null;

    const showNoMinutesNotice = (data?: any) => {
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
    } catch (err: any) {
      setIsInitializing(false);

      // No response at all = network/CORS failure, not a server error
      if (!err.response) {
        console.error("[startVoiceSession] Network/CORS error:", err.message);
        alert(
          "Couldn't reach the server. This usually means one of:\n" +
          "• The server is still starting up (free hosting spins down when idle — wait ~30s and retry)\n" +
          "• Your internet / local dev server is down\n\n" +
          "Open the browser Network tab: if the request URL is http://localhost:4000, the local server isn't running."
        );
        return;
      }

      const status = err.response.status;

      if (status === 402) {
        posthog.capture("minutes_exhausted", {
          plan: isPremium ? "premium" : "free",
          minutesUsed: err.response.data?.freeTrialUsed ?? freeTrialUsed,
        });
        showNoMinutesNotice(err.response.data);
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

      // Genuine server error — log full details for debugging, show generic message to user
      console.error("[startVoiceSession] Server error:", status, err.response.data);
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
    <div className="min-h-screen neural-bg pt-20 px-4 pb-40"> {/* Increased pb-40 to ensure space for the mic button */}
      {/* Header */}
      <div className="container mx-auto max-w-4xl mb-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => onNavigate("home")}
            className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
          >
            <ArrowLeft size={20} /> Back
          </button>
          <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-teal-300">
            Echo Session
          </h3>
        </div>
      </div>

      {/* Main Content - Centered for larger screens */}
      <div className="container mx-auto max-w-4xl">
        <div className="flex flex-col items-center">
          {/* Chat Area - Centered on all screens */}
          <div className="w-full max-w-2xl">
            {sessionNotice && (
              <div className="mb-4 rounded-2xl border border-amber-400/30 bg-amber-500/10 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-semibold text-amber-100">{sessionNotice.title}</p>
                    <p className="mt-1 text-sm text-amber-100/80">{sessionNotice.message}</p>
                  </div>
                  <button
                    onClick={() => onNavigate("sessions")}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-amber-400 px-4 py-2 text-sm font-semibold text-gray-950 transition-colors hover:bg-amber-300"
                  >
                    <CreditCard size={16} />
                    View plans
                  </button>
                </div>
              </div>
            )}
            <div className="backdrop-blur-xl border border-violet-500/20 rounded-2xl p-6 bg-gray-900/30">
              <div className="mb-4 grid gap-3 sm:grid-cols-2">
                <div className="flex items-center justify-between rounded-xl border border-violet-500/20 bg-gray-900/30 px-4 py-3">
                  <span className="text-gray-300 flex items-center gap-2">
                    <Clock className="text-violet-400" size={18} /> Session Time
                  </span>
                  <span className="text-2xl font-mono text-white">
                    {formatTime(sessionTime)}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-teal-500/20 bg-gray-900/30 px-4 py-3">
                  <span className="text-gray-300">Minutes Remaining</span>
                  <span className="text-2xl font-mono text-white">
                    {premiumCalls}
                  </span>
                </div>
              </div>



              {/* Messages Container */}
              <div className="backdrop-blur-xl border border-violet-500/20 rounded-2xl p-6 min-h-[400px] max-h-[60vh] overflow-y-auto bg-gray-900/20">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center space-y-6">
                    <EchoOrb size="lg" isPulsing={isRecording} />
                    {!isRecording && !isInitializing && (
                      <div className="flex justify-center gap-2 mb-4">
                        {LANGUAGES.map((l) => (
                          <button
                            key={l.code}
                            onClick={() => setLanguage(l.code as any)}
                            className={`px-4 py-2 rounded-full text-sm transition-all ${language === l.code
                              ? "bg-violet-600 text-white"
                              : "bg-gray-800/60 text-gray-400 hover:text-white"
                              }`}
                          >
                            {l.label}
                          </button>
                        ))}
                      </div>
                    )}
                    {!isRecording && premiumCalls <= 3 && premiumCalls > 0 && (
                      <p className="text-amber-400 text-sm text-center mb-2">
                        ⏱️ You have {premiumCalls} minute{premiumCalls !== 1 ? "s" : ""} left. This session will end
                        automatically when your time runs out.
                      </p>
                    )}
                    <p className="text-gray-400 animate-pulse text-lg">
                      {isRecording
                        ? "🎙️ Waiting for assistant to respond..."
                        : "Press the mic to start your session 🚀"}
                    </p>
                    <p className="text-gray-500 text-sm max-w-md">
                      Share your thoughts and feelings freely. I'm here to
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
                              ? "bg-gradient-to-r from-violet-600/30 to-violet-700/30 border-violet-500/40 text-white rounded-br-none"
                              : "bg-gray-800/60 border-gray-700/40 text-gray-200 rounded-bl-none"
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
                <div className="flex items-center justify-center gap-2 p-4 bg-gray-800/50 rounded-xl">
                  <Loader2 className="animate-spin text-violet-400" size={20} />
                  <span className="text-gray-300">Starting session...</span>
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
                <div className="flex items-center justify-center gap-2 p-4 bg-gray-800/50 rounded-xl">
                  <Loader2 className="animate-spin text-violet-400" size={20} />
                  <span className="text-gray-300">Saving session...</span>
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
        </div>
      </div>
    </div>
  );
}


export default ChatContent;
