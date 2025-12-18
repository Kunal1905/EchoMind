"use client";

import React, { useEffect, useRef, useState } from "react";
import { useParams, redirect, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, Download, Clock, Sparkles, Loader2 } from "lucide-react";
import Vapi from "@vapi-ai/web";
import { VapiHUD } from "../../components/VapiHUD";
import { SentimentVisualizer } from "../../components/SentimentVisualizer";
import { EchoOrb } from "../../components/EchoOrb";
import { v4 as uuidv4 } from "uuid";

interface Message {
  id: string;
  text: string;
  sender: "user" | "ai";
  sentiment: "positive" | "neutral" | "negative";
  timestamp: Date;
  isLive?: boolean;
}

interface ChatContentProps {
  onNavigate?: (page: string) => void;
  isPremium?: boolean;
  premiumCalls?: number;
  freeTrialUsed?: number;
  freeTrialLimit?: number;
  onSessionComplete?: () => void;
}

export function ChatContent({
  onNavigate,
  isPremium = false,
  premiumCalls = 0,
  freeTrialUsed = 0,
  freeTrialLimit = 3,
  onSessionComplete = () => {},
}: ChatContentProps) {
  const router = useRouter();
  const { isSignedIn } = useUser();
  if (!isSignedIn) return redirect("/sign-in");

  // Handle navigation either through props (when used as component) or router (when used as page)
  const handleNavigation = (page: string) => {
    if (onNavigate) {
      onNavigate(page);
    } else {
      // When used as a standalone page, navigate using Next.js router
      switch (page) {
        case 'home':
          router.push('/');
          break;
        case 'history':
          router.push('/history');
          break;
        default:
          router.push(`/${page}`);
      }
    }
  };

  const [messages, setMessages] = useState<Message[]>([]);
  const messagesRef = useRef<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const updateMessages = (fn: (prev: Message[]) => Message[]) => {
    setMessages((prev) => {
      const updated = fn(prev);
      messagesRef.current = updated;
      return updated;
    });
  };

  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [sessionTime, setSessionTime] = useState(0);
  const [summary, setSummary] = useState<string | null>(null);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const vapiRef = useRef<Vapi | null>(null);
  const saveAttemptedRef = useRef(false);
  const currentSessionIdRef = useRef<string | null>(null);

  const API_KEY = process.env.NEXT_PUBLIC_VAPI_API_KEY;
  const ASSISTANT_ID = process.env.NEXT_PUBLIC_VAPI_VOICE_ASSISTANT_ID;
  const maxSessionTime = isPremium ? Infinity : 600;

  // Calculate sentiment counts for the visualizer
  const sentimentCounts = messages.reduce(
    (acc, msg) => {
      acc[msg.sentiment]++;
      return acc;
    },
    { positive: 0, neutral: 0, negative: 0 }
  );

  // Function to generate session summary
  const generateSessionSummary = async (conversation: Message[]) => {
    if (conversation.length === 0) return "No conversation data available.";

    // Extract user messages for summary
    const userMessages = conversation
      .filter((msg) => msg.sender === "user")
      .map((msg) => msg.text)
      .join(" ");

    // Simple summary generation logic
    // In a real application, this would call an AI service
    const wordCount = userMessages.split(" ").length;

    if (wordCount < 10) {
      return "Brief session with minimal conversation.";
    }

    // Create a basic summary based on conversation length
    if (wordCount < 50) {
      return "Short conversation covering initial thoughts and feelings.";
    } else if (wordCount < 150) {
      return "Moderate conversation exploring key concerns and emotions.";
    } else {
      return "Detailed session discussing various aspects of emotional wellbeing and personal challenges.";
    }
  };

  useEffect(() => {
    if (!API_KEY) {
      console.error("Missing Vapi API key");
      return;
    }

    const vapi = vapiRef.current;
    if (!vapi) {
      console.error("VAPI client not initialized");
      return;
    }

    const onCallStart = () => {
      // generate a single sessionId when the call starts
      if (!currentSessionIdRef.current) currentSessionIdRef.current = uuidv4();
      setIsRecording(true);
    };

    const onCallEnd = async () => {
      setIsRecording(false);
      setIsSpeaking(false);
      onSessionComplete();

      // Generate summary before saving
      setIsGeneratingSummary(true);
      const generatedSummary = await generateSessionSummary(
        messagesRef.current
      );
      setSummary(generatedSummary);
      setIsGeneratingSummary(false);

      // ensure we only try to save once
      if (saveAttemptedRef.current) return;
      saveAttemptedRef.current = true;

      const notes = messagesRef.current
        .map((m) => `${m.sender === "user" ? "User" : "AI"}: ${m.text}`)
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

      try {
        const response = await fetch("/api/session-chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId: currentSessionIdRef.current,
            notes,
            summary: generatedSummary,
            duration: durationStr,
          }),
        });

        const json = await response.json();
        if (!response.ok) {
          console.error("Failed to save session:", json);
        } else {
          // redirect or update UI
          handleNavigation("history");
        }
      } catch (err) {
        console.error("Failed to save session:", err);
      } finally {
        // reset sessionId so next call gets a new id
        currentSessionIdRef.current = null;
        saveAttemptedRef.current = false; // keep it false for next session
        setIsSaving(false); // Reset saving state
      }
    };

    const onMessage = (msg: any) => {
      if (!msg || msg.type !== "transcript" || !msg.transcript) return;
      const sender = msg.role === "assistant" ? "ai" : "user";
      const isFinal = msg.transcriptType === "final";

      updateMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last && last.sender === sender && last.isLive) {
          const copy = [...prev];
          copy[copy.length - 1] = {
            ...last,
            text: msg.transcript,
            isLive: !isFinal,
          };
          return copy;
        }
        const newMsg: Message = {
          id: `${sender}-${Date.now()}`,
          text: msg.transcript,
          sender,
          sentiment: "neutral",
          timestamp: new Date(),
          isLive: !isFinal,
        };
        return [...prev, newMsg];
      });
    };

    const onError = (e: any) => {
      console.error("Vapi error:", e);
    };

    // Event listeners
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
  }, [sessionTime]);

  // Session timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setSessionTime((prev) => {
          // Auto-end session when time limit reached
          if (!isPremium && prev >= maxSessionTime) {
            if (vapiRef.current) {
              vapiRef.current.stop();
            }
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording, isPremium, maxSessionTime]);

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Initialize Vapi client
  useEffect(() => {
    if (!API_KEY) return;

    const vapi = new Vapi(API_KEY);
    vapiRef.current = vapi;

    return () => {
      vapiRef.current = null;
    };
  }, [API_KEY]);

  const startCall = async () => {
    if (!ASSISTANT_ID) {
      console.error("Missing assistant ID");
      return;
    }

    // Check if user can start a call
    const canStartCall = isPremium || freeTrialUsed < freeTrialLimit;
    if (!canStartCall) {
      alert("You've used all your free trial calls. Please upgrade to continue.");
      return;
    }

    setIsInitializing(true);
    try {
      await vapiRef.current?.start(ASSISTANT_ID);
    } catch (error) {
      console.error("Failed to start call:", error);
    } finally {
      setIsInitializing(false);
    }
  };

  const endCall = () => {
    vapiRef.current?.stop();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-950 pt-20 pb-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => handleNavigation("home")}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={20} />
            <span>Back to Home</span>
          </button>
          <div className="flex items-center gap-2 text-gray-400">
            <Clock size={18} />
            <span>{formatTime(sessionTime)}</span>
            {!isPremium && sessionTime >= maxSessionTime && (
              <span className="ml-2 text-amber-400">(Time Limit Reached)</span>
            )}
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Messages Panel */}
          <div className="lg:col-span-2">
            <div className="backdrop-blur-xl bg-gray-800/30 border border-violet-500/20 rounded-2xl p-6 h-[calc(100vh-200px)] flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">🎙️ Echo Session</h2>
                {isRecording && (
                  <div className="flex items-center gap-2 text-red-400">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                    <span className="text-sm">Recording</span>
                  </div>
                )}
              </div>

              {/* Messages Container */}
              <div className="flex-grow overflow-y-auto mb-6 space-y-4 pr-2 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-800/50">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-gray-500">
                    <div className="text-6xl mb-4">👋</div>
                    <p className="text-center">
                      Start a conversation with Echo to begin your session
                    </p>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${
                        msg.sender === "user" ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                          msg.sender === "user"
                            ? "bg-violet-600/30 border border-violet-500/30"
                            : "bg-gray-700/50 border border-gray-600/30"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium">
                            {msg.sender === "user" ? "You" : "Echo"}
                          </span>
                          {msg.isLive && (
                            <span className="text-xs text-amber-400">●</span>
                          )}
                        </div>
                        <p className="whitespace-pre-wrap">{msg.text}</p>
                      </div>
                    </motion.div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Controls */}
              <div className="flex flex-col sm:flex-row gap-3">
                {!isRecording ? (
                  <button
                    onClick={startCall}
                    disabled={isInitializing}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-violet-600 to-teal-500 rounded-full hover:from-violet-500 hover:to-teal-400 transition-all disabled:opacity-50"
                  >
                    {isInitializing ? (
                      <>
                        <Loader2 className="animate-spin" size={20} />
                        <span>Initializing...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={20} />
                        <span>Start Session</span>
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    onClick={endCall}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-red-600 to-orange-500 rounded-full hover:from-red-500 hover:to-orange-400 transition-all"
                  >
                    <span>⏹️ End Session</span>
                  </button>
                )}

                {messages.length > 0 && (
                  <button className="px-6 py-4 bg-gray-700/50 hover:bg-gray-700 rounded-full transition-colors flex items-center gap-2 border border-gray-600">
                    <Download size={20} />
                    <span>Save</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Vapi HUD */}
            <VapiHUD
              isRecording={isRecording}
              onToggleRecording={isRecording ? endCall : startCall}
              onEndCall={endCall}
            />

            {/* Sentiment Visualizer */}
            <SentimentVisualizer
              positive={sentimentCounts.positive}
              neutral={sentimentCounts.neutral}
              negative={sentimentCounts.negative}
            />

            {/* Echo Orb */}
            <div className="backdrop-blur-xl bg-gray-800/30 border border-violet-500/20 rounded-2xl p-6">
              <h3 className="font-bold mb-4">🧘‍♀️ Emotional State</h3>
              <div className="flex justify-center">
                <EchoOrb
                  sentiment="neutral"
                  size="lg"
                  isPulsing={isRecording}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Summary Section */}
        <AnimatePresence>
          {(summary || isGeneratingSummary) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-6 backdrop-blur-xl bg-gray-800/30 border border-violet-500/20 rounded-2xl p-6"
            >
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <Sparkles className="text-violet-400" size={20} />
                Session Summary
              </h3>
              {isGeneratingSummary ? (
                <div className="flex items-center gap-3 text-gray-400">
                  <Loader2 className="animate-spin" size={20} />
                  <span>Generating insights...</span>
                </div>
              ) : (
                <div className="text-gray-300 whitespace-pre-line">
                  {summary}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}