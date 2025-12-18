// app/history/page.tsx (client)
"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Calendar, BarChart3, ChevronDown, Loader2, MessageCircle, Brain, Sparkles } from 'lucide-react';
import Link from "next/link";
import { useUser } from "@clerk/nextjs";

interface Session {
  sessionId: string;
  createdBy: string;
  notes: string;
  summary: string;
  sentimentAnalysis: string;
  duration: string;
  createdAt: string; // ISO string
}

export function History({ onNavigate = (p:string)=>{}, isPremium = false }: { onNavigate?: (p:string)=>void; isPremium?: boolean; }) {
  const { isLoaded, isSignedIn } = useUser();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedSession, setExpandedSession] = useState<string | null>(null);

  useEffect(() => {
    const fetchSessions = async () => {
      if (!isLoaded || !isSignedIn) return;
      setLoading(true);
      try {
        const res = await fetch("/api/history");
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || "Failed to fetch");
        // dedupe by sessionId and sort desc by createdAt
        const map = new Map<string, Session>();
        for (const s of json as Session[]) {
          map.set(s.sessionId, s); // last wins if duplicates; we'll sort next
        }
        const array = Array.from(map.values()).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setSessions(array);
      } catch (err: any) {
        console.error(err);
        setError(err?.message || "Failed");
      } finally {
        setLoading(false);
      }
    };
    fetchSessions();
  }, [isLoaded, isSignedIn]);

  if (!isLoaded) return <div className="h-screen flex items-center justify-center bg-gray-900">Loading...</div>;
  if (!isSignedIn) return (
    <div className="h-screen flex items-center justify-center bg-gray-900">
      <div className="p-8 bg-gray-800 rounded-xl shadow-xl text-center">
        <h2 className="text-2xl font-bold text-white mb-4">🔒 Please Sign In</h2>
        <p className="text-gray-300 mb-6">Session history is only available for logged-in users.</p>
        <Link href="/sign-in" className="px-6 py-3 bg-gradient-to-r from-violet-600 to-teal-500 rounded-full text-white font-medium hover:from-violet-500 hover:to-teal-400 transition-all">
          Sign In
        </Link>
      </div>
    </div>
  );
  if (loading) return <div className="h-screen flex items-center justify-center bg-gray-900"><Loader2 className="animate-spin text-violet-400" size={48} /></div>;
  if (error) return <div className="p-8 text-red-400 bg-gray-900 min-h-screen flex items-center justify-center">⚠️ {error}</div>;

  // Format date for display
  const formatDisplayDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-950 pt-20 pb-16 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-violet-400 to-teal-300 bg-clip-text text-transparent mb-4">
            📚 Session History
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Review your journey of self-discovery and emotional growth
          </p>
        </div>

        {sessions.length > 0 && (
          <motion.div className="backdrop-blur-xl bg-gray-800/30 border border-violet-500/20 rounded-2xl p-6 mb-8 shadow-xl">
            <h3 className="flex items-center gap-3 text-xl font-bold text-violet-300 mb-4">
              <Sparkles className="text-yellow-400" /> Latest Session Insights
            </h3>
            <div className="flex flex-col md:flex-row gap-6">
              <div className="md:w-2/3">
                <div className="text-gray-200 whitespace-pre-line leading-relaxed">
                  {sessions[0].summary || "No summary available."}
                </div>
              </div>
              <div className="md:w-1/3 flex flex-col gap-3">
                <div className="flex items-center gap-2 text-gray-300">
                  <Calendar className="text-violet-400" size={18} />
                  <span>{formatDisplayDate(sessions[0].createdAt)}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-300">
                  <MessageCircle className="text-violet-400" size={18} />
                  <span>Recent Session</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {sessions.length === 0 && (
          <div className="text-center py-16">
            <div className="mx-auto w-24 h-24 rounded-full bg-violet-900/20 flex items-center justify-center mb-6">
              <Brain className="text-violet-400" size={48} />
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">No Sessions Yet</h3>
            <p className="text-gray-400 mb-6 max-w-md mx-auto">
              Your therapeutic journey begins with your first conversation. Start a session to see your history here.
            </p>
            <button 
              onClick={() => onNavigate("home")}
              className="px-6 py-3 bg-gradient-to-r from-violet-600 to-teal-500 rounded-full text-white font-medium hover:from-violet-500 hover:to-teal-400 transition-all shadow-lg"
            >
              Start Your First Session
            </button>
          </div>
        )}

        <div className="space-y-4">
          {sessions.map((s, index) => (
            <motion.div 
              key={s.sessionId} 
              className="backdrop-blur-xl bg-gray-800/30 border border-violet-500/20 rounded-2xl overflow-hidden shadow-lg"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <button
                className="w-full p-5 flex justify-between items-center hover:bg-gray-700/30 transition-colors"
                onClick={() => setExpandedSession(prev => prev === s.sessionId ? null : s.sessionId)}
              >
                <div className="flex items-center gap-4">
                  <div className="text-2xl">🧠</div>
                  <div className="text-left">
                    <div className="flex items-center gap-2 text-white">
                      <Calendar className="text-violet-400" size={16} />
                      <span>{new Date(s.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="text-sm text-gray-400 mt-1">
                      {new Date(s.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <ChevronDown className={`transform transition-transform ${expandedSession === s.sessionId ? "rotate-180" : ""} text-violet-400`} />
                </div>
              </button>

              <AnimatePresence>
                {expandedSession === s.sessionId && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-violet-500/20"
                  >
                    <div className="p-5 bg-gray-800/50">
                      <div>
                        <h4 className="flex items-center gap-2 text-violet-300 font-bold mb-3">
                          <Brain className="text-violet-400" size={18} /> Session Summary
                        </h4>
                        <div className="text-gray-300 whitespace-pre-line leading-relaxed">
                          {s.summary || "No summary available."}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default History;