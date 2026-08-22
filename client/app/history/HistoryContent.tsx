"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Calendar, ChevronDown, MessageCircle, Brain, Sparkles, AlertTriangle, Trash2 } from 'lucide-react';
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import api from "../lib/api";
import { MoodChart } from "../components/MoodChart";
import { usePostHog } from "posthog-js/react";
import ConstellationField from "../components/ConstellationField";
import { HistoryScreenSkeleton } from "../components/ScreenSkeletons";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";


interface Session {
  sessionId: string;
  createdBy: string;
  notes: string;
  summary: string;
  durationSec: number;
  createdAt: string; // ISO string
}

interface MoodEntry {
  id: string;
  userId: string;
  sessionId?: string;
  moodScore: number;
  createdAt: string;
}

// Module-level cache to persist data across page mounts/navigations
let cachedSessions: Session[] | null = null;
let cachedMoodEntries: MoodEntry[] | null = null;
let cachedUserId: string | null = null;
let hasLoadedOnce = false;

export function HistoryContent({ onNavigate = () => { } }: { onNavigate?: (p: string) => void; isPremium?: boolean; }) {
  const { isLoaded, isSignedIn, user } = useUser();
  const posthog = usePostHog();
  const [sessions, setSessions] = useState<Session[]>(() => {
    if (user?.id && cachedUserId === user.id && cachedSessions) {
      return cachedSessions;
    }
    return [];
  });
  const [moodEntries, setMoodEntries] = useState<MoodEntry[]>(() => {
    if (user?.id && cachedUserId === user.id && cachedMoodEntries) {
      return cachedMoodEntries;
    }
    return [];
  });
  const [loading, setLoading] = useState(() => {
    if (user?.id && cachedUserId === user.id && hasLoadedOnce) {
      return false;
    }
    return true;
  });
  const [error, setError] = useState<string | null>(null);
  const [expandedSession, setExpandedSession] = useState<string | null>(null);
  const [sessionToDelete, setSessionToDelete] = useState<Session | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const confirmDeleteSession = async () => {
    if (!sessionToDelete) return;
    setDeleteError(null);
    setIsDeleting(true);
    try {
      const sessionId = sessionToDelete.sessionId;
      const response = await api.delete(`/session-chat/${sessionId}`);
      if (response.status >= 200 && response.status < 300) {
        // Remove from local states
        const updatedSessions = sessions.filter(s => s.sessionId !== sessionId);
        const updatedMood = moodEntries.filter(m => m.sessionId !== sessionId);
        setSessions(updatedSessions);
        setMoodEntries(updatedMood);

        // Keep cache in sync
        cachedSessions = updatedSessions;
        cachedMoodEntries = updatedMood;

        // Track session deleted event
        posthog.capture("session_deleted");
        setSessionToDelete(null);
      } else {
        setDeleteError("We could not delete this session. Please try again.");
      }
    } catch (err) {
      console.error("Error deleting session:", err);
      setDeleteError("Something went wrong while deleting this session. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };


  useEffect(() => {
    const fetchData = async () => {
      if (!isLoaded || !isSignedIn || !user?.id) return;

      // If user has changed, clear the cache
      if (cachedUserId !== user.id) {
        cachedSessions = null;
        cachedMoodEntries = null;
        cachedUserId = user.id;
        hasLoadedOnce = false;
      }

      // If we have cached data, update states immediately so the page is instant
      if (cachedSessions && cachedMoodEntries && !hasLoadedOnce) {
        setSessions(cachedSessions);
        setMoodEntries(cachedMoodEntries);
        setLoading(false);
      }

      try {
        const [resSessions, resMood] = await Promise.all([
          api.get("/session-chat"),
          api.get("/mood"),
        ]);
        if (resSessions.status === 200) {
          setSessions(resSessions.data);
          cachedSessions = resSessions.data;
        }
        if (resMood.status === 200) {
          setMoodEntries(resMood.data);
          cachedMoodEntries = resMood.data;
        }
      } catch (err) {
        console.error("Error fetching history or mood entries:", err);
        setError("Failed to fetch session history. Please try again.");
        if (!hasLoadedOnce) {
          setMoodEntries([]);
          cachedMoodEntries = [];
        }
      }

      hasLoadedOnce = true;
      setLoading(false);
    };
    fetchData();
  }, [isLoaded, isSignedIn, user?.id]);

  if (!isLoaded) return <HistoryScreenSkeleton />;
  if (!isSignedIn) return (
    <div className="void-page flex h-screen items-center justify-center px-4">
      <ConstellationField density="ambient" className="opacity-50" />
      <div className="relative z-10 max-w-md text-center">
        <h2 className="void-subheading mb-4">Please sign in.</h2>
        <p className="void-copy mb-6">Session history is only available for logged-in users.</p>
        <Link href="/sign-in" className="void-pill">
          Sign In
        </Link>
      </div>
    </div>
  );
  if (loading) return <HistoryScreenSkeleton />;
  if (error) return (
    <div className="p-8 text-red-400 bg-black min-h-screen flex items-center justify-center">
      <div className="max-w-2xl text-center">
        <AlertTriangle className="mx-auto mb-4 text-[--color-saffron-spark]" size={48} />
        <h2 className="void-subheading mb-2">Error loading history</h2>
        <p className="void-copy mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="void-pill"
        >
          Retry
        </button>
      </div>
    </div>
  );

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
    <div className="void-page pt-24 pb-24">
      <ConstellationField density="ambient" className="fixed opacity-40" />
      <div className="void-section">
        <div className="mb-16 grid gap-8 md:grid-cols-[1.05fr_0.95fr] md:items-end">
          <div>
            <p className="void-kicker mb-5">History</p>
            <h1 className="void-display">Patterns from previous echoes.</h1>
          </div>
          <p className="void-copy">
            Review summaries, mood movement, and moments worth returning to without turning your private reflection into clutter.
          </p>
        </div>

        {moodEntries.length > 0 && (
          <motion.div
            className="mb-16 border-t void-hairline pt-8"
            initial={{ opacity: 0, y: 36 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h3 className="void-subheading mb-6 flex items-center gap-3">
              <Sparkles className="text-[--color-saffron-spark]" /> Mood Timeline
            </h3>
            <MoodChart entries={moodEntries.map(entry => ({
              id: entry.id,
              userId: entry.userId,
              sessionId: entry.sessionId,
              moodScore: entry.moodScore,
              createdAt: entry.createdAt,
              date: new Date(entry.createdAt).toLocaleString([], {
                day: "2-digit",
                month: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
              }),
              score: entry.moodScore
            }))} />
          </motion.div>
        )}

        {sessions.length > 0 && (
          <motion.div
            className="mb-16 grid gap-8 border-t void-hairline pt-8 md:grid-cols-[1.1fr_0.9fr]"
            initial={{ opacity: 0, y: 36 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div>
              <p className="void-kicker mb-5">Latest insight</p>
              <h3 className="void-subheading mb-5">
                The most recent thread in your reflection.
            </h3>
              <div className="void-copy whitespace-pre-line">
                  {sessions[0].summary || "No summary available."}
              </div>
            </div>
            <div className="flex flex-col gap-4 text-[--color-silver-mist]">
                <div className="flex items-center gap-2">
                  <Calendar className="text-[--color-electric-iris]" size={18} />
                  <span>{formatDisplayDate(sessions[0].createdAt)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MessageCircle className="text-[--color-electric-iris]" size={18} />
                  <span>Recent Session</span>
                </div>
            </div>
          </motion.div>
        )}

        {sessions.length === 0 && (
          <div className="text-center py-16">
            <Brain className="mx-auto mb-6 text-[--color-electric-iris]" size={48} />
            <h3 className="void-subheading mb-3">No sessions yet.</h3>
            <p className="void-copy mx-auto mb-6 max-w-md">
              Your therapeutic journey begins with your first conversation. Start a session to see your history here.
            </p>
            <button
              onClick={() => onNavigate("home")}
              className="void-pill"
            >
              Start Your First Session
            </button>
          </div>
        )}

        <div className="space-y-0 border-t void-hairline">
          {sessions.map((s, index) => (
            <motion.div
              key={s.sessionId}
              className="border-b void-hairline"
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="flex items-center transition-colors w-full pr-4">
                <button
                  className="flex-1 py-6 flex justify-between items-center text-left"
                  onClick={() => setExpandedSession(prev => prev === s.sessionId ? null : s.sessionId)}
                >
                  <div className="flex items-center gap-4">
                    <div className="text-left">
                      <div className="flex items-center gap-2 text-white">
                        <Calendar className="text-[--color-electric-iris]" size={16} />
                        <span>{new Date(s.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="text-sm text-[--color-ash-gray] mt-1">
                        {new Date(s.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                  <ChevronDown className={`transform transition-transform ${expandedSession === s.sessionId ? "rotate-180" : ""} text-[--color-electric-iris]`} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteError(null);
                    setSessionToDelete(s);
                  }}
                  className="p-3 text-[--color-ash-gray] hover:text-red-400 transition-colors"
                  title="Delete session"
                >
                  <Trash2 size={18} />
                </button>
              </div>


              <AnimatePresence>
                {expandedSession === s.sessionId && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t void-hairline"
                  >
                    <div className="py-6">
                      <div>
                        <h4 className="void-kicker mb-3 flex items-center gap-2">
                          <Brain className="text-[--color-electric-iris]" size={18} /> Session Summary
                        </h4>
                        <div className="void-copy whitespace-pre-line">
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
      <Dialog
        open={!!sessionToDelete}
        onOpenChange={(open) => {
          if (!open && !isDeleting) {
            setSessionToDelete(null);
            setDeleteError(null);
          }
        }}
      >
        <DialogContent className="border border-white/10 bg-[#090910]/95 text-white shadow-2xl backdrop-blur-xl sm:max-w-md">
          <DialogHeader className="text-left">
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full border border-red-400/25 bg-red-500/10">
              <Trash2 className="text-red-300" size={18} />
            </div>
            <DialogTitle className="text-xl font-semibold tracking-tight text-white">
              Delete this session?
            </DialogTitle>
            <DialogDescription className="text-sm leading-relaxed text-[--color-silver-mist]">
              This will permanently remove this reflection and its mood entry from your history.
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          {sessionToDelete && (
            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3 text-sm text-[--color-silver-mist]">
              <div className="flex items-center gap-2 text-white">
                <Calendar className="text-[--color-electric-iris]" size={15} />
                <span>{formatDisplayDate(sessionToDelete.createdAt)}</span>
              </div>
            </div>
          )}

          {deleteError && (
            <div className="rounded-lg border border-red-400/25 bg-red-500/10 px-3 py-2 text-sm text-red-200">
              {deleteError}
            </div>
          )}

          <DialogFooter className="gap-3 sm:justify-end">
            <button
              type="button"
              onClick={() => {
                setSessionToDelete(null);
                setDeleteError(null);
              }}
              disabled={isDeleting}
              className="rounded-lg border border-white/15 px-4 py-2 text-sm font-medium text-[--color-silver-mist] transition-colors hover:border-white/25 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              Keep session
            </button>
            <button
              type="button"
              onClick={confirmDeleteSession}
              disabled={isDeleting}
              className="inline-flex items-center justify-center rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isDeleting ? "Deleting..." : "Delete session"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default HistoryContent;
