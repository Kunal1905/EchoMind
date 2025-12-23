"use client";

import React, { useEffect, useRef, useState } from "react";
import { redirect } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, Clock, Sparkles, Loader2 } from "lucide-react";
import Vapi from "@vapi-ai/web";
import { vapiClient } from "../../lib/vapiClient";
import { VapiHUD } from "../../components/VapiHUD";
import { EchoOrb } from "../../components/EchoOrb";
import { v4 as uuidv4 } from "uuid";

interface Message {
  id: string;
  text: string;
  sender: "user" | "ai";
  timestamp: Date;
  isLive?: boolean;
}

export function ChatContent({
  onNavigate = () => {},
  isPremium = false,
  premiumCalls = 0,
  freeTrialUsed = 0,
  freeTrialLimit = 3,
  onSessionComplete = () => {},
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

  const [messages, setMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef<Message[]>([]);

  const [isRecording, setIsRecording] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isWaitingForAssistant, setIsWaitingForAssistant] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [sessionTime, setSessionTime] = useState(0);
  const [summary, setSummary] = useState<string | null>(null);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);

  const vapiRef = useRef<Vapi | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const saveAttemptedRef = useRef(false);

  const API_KEY = process.env.NEXT_PUBLIC_VAPI_API_KEY!;
  const ASSISTANT_ID = process.env.NEXT_PUBLIC_VAPI_VOICE_ASSISTANT_ID!;

  // Function to generate session summary
  const generateSessionSummary = async (conversation: Message[]) => {
    if (conversation.length === 0) return "No conversation data available.";

    // Extract user messages for summary
    const userMessages = conversation
      .filter((msg) => msg.sender === "user")
      .map((msg) => msg.text)
      .join(" ");

    // Simple summary generation logic
    const wordCount = userMessages.split(" ").length;

    if (wordCount < 10) {
      return "Brief session with minimal conversation.";
    }

    if (wordCount < 50) {
      return "Short conversation covering initial thoughts and feelings.";
    } else if (wordCount < 150) {
      return "Moderate conversation exploring key concerns and emotions.";
    } else {
      return "Detailed session discussing various aspects of emotional wellbeing and personal challenges.";
    }
  };

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
      sessionIdRef.current = uuidv4();
      setIsRecording(true);
      setIsInitializing(false);
      setIsWaitingForAssistant(true);
    };

    const onCallEnd = async () => {
      setIsRecording(false);
      setIsWaitingForAssistant(false);
      setIsSaving(true);
      onSessionComplete();

      // Generate summary before saving
      setIsGeneratingSummary(true);
      const generatedSummary = await generateSessionSummary(messagesRef.current);
      setSummary(generatedSummary);
      setIsGeneratingSummary(false);

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

        // Format duration as HH:MM:SS
        const formatDuration = (seconds: number): string => {
          const hrs = Math.floor(seconds / 3600);
          const mins = Math.floor((seconds % 3600) / 60);
          const secs = seconds % 60;
          return `${hrs.toString().padStart(2, "0")}:${mins
            .toString()
            .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
        };

        const durationStr = formatDuration(sessionTime);

        const response = await fetch("/api/session-chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId: sessionIdRef.current,
            notes,
            summary: generatedSummary,
            duration: durationStr,
          }),
        });

        if (!response.ok) {
          console.error("Save failed", await response.json());
        } else {
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
      // Clear all loading states on error
      setIsInitializing(false);
      setIsSaving(false);
      // If we were recording, stop recording
      if (isRecording) {
        setIsRecording(false);
        setIsWaitingForAssistant(false);
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

  // Check if user can start a session
  const canStartSession = () => {
    // For premium users, check if they have calls remaining
    if (isPremium) {
      return premiumCalls > 0;
    }
    // For free users, check session limit
    return freeTrialUsed < freeTrialLimit;
  };

  /* ---------------- MIC HANDLER ---------------- */
  const toggleRecording = () => {
    const vapi = vapiRef.current;
    if (!vapi) return;

    // ✅ ALWAYS allow stop
    if (isRecording) {
      setIsSaving(true);
      vapi.stop();
      return;
    }

    // Check if user can start a session
    if (!canStartSession()) {
      if (isPremium) {
        alert(
          "You've used all your premium calls. Please add more calls to continue."
        );
        onNavigate("sessions");
      } else {
        alert(
          `You've used all ${freeTrialLimit} free trial sessions. Upgrade to premium to continue.`
        );
        onNavigate("sessions");
      }
      return;
    }

    setIsInitializing(true);
    try {
      vapi.start(ASSISTANT_ID);
    } catch (err) {
      console.error("Failed to start call:", err);
      setIsInitializing(false);
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
    <div className="min-h-screen neural-bg pt-20 pb-32 px-4">
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
            <div className="backdrop-blur-xl border border-violet-500/20 rounded-2xl p-6 bg-gray-900/30">
              <div className="flex justify-between items-center mb-4">
                <span className="text-gray-300 flex items-center gap-2">
                  <Clock className="text-violet-400" size={18} /> Session Time
                </span>
                <span className="text-2xl font-mono text-white">
                  {formatTime(sessionTime)}
                </span>
              </div>

              {/* Summary section - shown when session ends */}
              {summary && (
                <div className="mb-6 p-4 bg-gradient-to-r from-violet-900/40 to-teal-900/40 rounded-xl border border-violet-500/30">
                  <h4 className="font-bold text-violet-300 mb-2 flex items-center gap-2">
                    <Sparkles className="text-yellow-400" /> Session Summary
                  </h4>
                  <p className="text-gray-200">{summary}</p>
                  {isGeneratingSummary && (
                    <p className="text-gray-400 italic mt-2 flex items-center gap-2">
                      <Loader2 className="animate-spin" size={16} /> Generating
                      detailed summary...
                    </p>
                  )}
                </div>
              )}

              {/* Messages Container */}
              <div className="backdrop-blur-xl border border-violet-500/20 rounded-2xl p-6 min-h-[400px] bg-gray-900/20">
                {!canStartSession() && isPremium ? (
                  <div className="flex flex-col items-center justify-center h-full text-center space-y-6">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-amber-600/20 to-red-600/20 flex items-center justify-center border border-amber-500/30">
                      <span className="text-4xl">⚠️</span>
                    </div>
                    <h3 className="text-xl font-bold text-amber-300">
                      Premium Calls Exhausted
                    </h3>
                    <p className="text-gray-400 max-w-md">
                      You've used all your premium calls. Please add more calls to
                      continue your therapy sessions.
                    </p>
                    <button
                      onClick={() => onNavigate("sessions")}
                      className="px-6 py-3 bg-gradient-to-r from-amber-500 to-red-500 rounded-full hover:from-amber-400 hover:to-red-400 transition-all"
                    >
                      Add More Calls
                    </button>
                  </div>
                ) : !canStartSession() && !isPremium ? (
                  <div className="flex flex-col items-center justify-center h-full text-center space-y-6">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-violet-600/20 to-purple-600/20 flex items-center justify-center border border-violet-500/30">
                      <span className="text-4xl">⭐</span>
                    </div>
                    <h3 className="text-xl font-bold text-violet-300">
                      Free Trial Completed
                    </h3>
                    <p className="text-gray-400 max-w-md">
                      {`You've used all ${freeTrialLimit} free trial sessions. Upgrade to premium to continue your therapy journey.`}
                    </p>
                    <button
                      onClick={() => onNavigate("sessions")}
                      className="px-6 py-3 bg-gradient-to-r from-violet-600 to-purple-600 rounded-full hover:from-violet-500 hover:to-purple-500 transition-all"
                    >
                      Upgrade to Premium
                    </button>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center space-y-6">
                    <EchoOrb size="lg" isPulsing={isRecording} />
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
                          className={`flex ${
                            msg.sender === "user"
                              ? "justify-end"
                              : "justify-start"
                          }`}
                        >
                          <div
                            className={`max-w-[85%] px-4 py-3 rounded-2xl border ${
                              msg.sender === "user"
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

          {/* HUD */}
          <div className="mt-6 w-full max-w-2xl">
            <div className="flex justify-center">
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
      </div>
    </div>
  );
}

export default ChatContent;
