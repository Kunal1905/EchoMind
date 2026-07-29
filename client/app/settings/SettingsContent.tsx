"use client";

import React, { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Shield,
  Lock,
  AlertTriangle,
  Trash2,
  Check,
  Loader2,
  ArrowLeft,
  RefreshCw,
  Database,
  CheckCircle2,
  EyeOff,
  UserCheck
} from "lucide-react";
import Link from "next/link";
import { useUser, useAuth } from "@clerk/nextjs";
import api from "../lib/api";
import { usePostHog } from "posthog-js/react";
import ConstellationField from "../components/ConstellationField";
import { EchoOrb } from "../components/EchoOrb";
import { Switch } from "../components/ui/switch";

interface AccountInfo {
  plan: string;
  minutesRemaining: number;
  memoryConsent: boolean;
}

interface StoredSession {
  sessionId: string;
  createdAt: string;
  hasSummary: boolean;
}

interface MyDataResponse {
  account: AccountInfo;
  sessions: StoredSession[];
  moodEntries: number;
  dataStored: string[];
  dataNotStored: string[];
}

interface SettingsContentProps {
  onNavigate?: (page: string) => void;
}

// Module-level cache to persist data across page mounts/navigations
let cachedMyData: MyDataResponse | null = null;
let cachedUserId: string | null = null;
let hasLoadedOnce = false;

export function SettingsContent({ onNavigate }: SettingsContentProps) {
  const { isLoaded, isSignedIn, user } = useUser();
  const { getToken } = useAuth();
  const posthog = usePostHog();

  const [data, setData] = useState<MyDataResponse | null>(() => {
    if (user?.id && cachedUserId === user.id && cachedMyData) {
      return cachedMyData;
    }
    return null;
  });
  const [loading, setLoading] = useState(() => {
    if (user?.id && cachedUserId === user.id && hasLoadedOnce) {
      return false;
    }
    return true;
  });
  const [error, setError] = useState<string | null>(null);
  
  // Action states
  const [savingConsent, setSavingConsent] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deletingAll, setDeletingAll] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!isLoaded || !isSignedIn || !user?.id) return;

    // Clear cache if user changed
    if (cachedUserId !== user.id) {
      cachedMyData = null;
      cachedUserId = user.id;
      hasLoadedOnce = false;
    }

    try {
      if (hasLoadedOnce) {
        setData(cachedMyData);
        setLoading(false);
      } else {
        setLoading(true);
      }

      setError(null);
      const token = await getToken();
      const response = await api.get("/my-data", token ? {
        headers: { Authorization: `Bearer ${token}` }
      } : undefined);
      
      if (response.status >= 200 && response.status < 300) {
        setData(response.data);
        cachedMyData = response.data;
        hasLoadedOnce = true;
      } else {
        if (!hasLoadedOnce) {
          setError("Failed to load your privacy settings.");
        }
      }
    } catch (err: unknown) {
      console.error("Error fetching my-data:", err);
      const axiosError = err as { response?: { data?: { error?: string } } };
      if (!hasLoadedOnce) {
        setError(axiosError.response?.data?.error || "Error connecting to the privacy server.");
      }
    } finally {
      setLoading(false);
    }
  }, [getToken, isLoaded, isSignedIn, user?.id]);

  useEffect(() => {
    if (isLoaded && isSignedIn && user?.id) {
      fetchData();
    }
  }, [isLoaded, isSignedIn, user?.id, fetchData]);

  const handleToggleConsent = async (granted?: boolean) => {
    if (!data || savingConsent) return;
    setSavingConsent(true);
    setSuccessMessage(null);
    const newConsentVal = granted ?? !data.account.memoryConsent;

    try {
      const token = await getToken();
      const response = await api.post("/my-data/consent", {
        granted: newConsentVal
      }, token ? {
        headers: { Authorization: `Bearer ${token}` }
      } : undefined);

      if (response.status >= 200 && response.status < 300) {
        const updated = {
          ...data,
          account: {
            ...data.account,
            memoryConsent: newConsentVal
          }
        };
        setData(updated);
        cachedMyData = updated; // Keep cache in sync
        
        // Save local preference state to keep in sync with local storage
        localStorage.setItem("memory_consent_preference", newConsentVal ? "granted" : "declined");
        
        // Track event
        posthog.capture("memory_consent_toggled", { granted: newConsentVal });
        setSuccessMessage(`Personalized AI Memory ${newConsentVal ? "enabled" : "disabled"} successfully.`);
        setTimeout(() => setSuccessMessage(null), 4000);
      } else {
        alert("Failed to update memory consent settings.");
      }
    } catch (err) {
      console.error("Consent update error:", err);
      alert("Error updating your settings. Please try again.");
    } finally {
      setSavingConsent(false);
    }
  };

  const handleDeleteAllData = async () => {
    if (confirmText !== "DELETE ALL" || deletingAll || !data) return;
    setDeletingAll(true);
    setSuccessMessage(null);

    try {
      const token = await getToken();
      const response = await api.delete("/my-data/all", token ? {
        headers: { Authorization: `Bearer ${token}` }
      } : undefined);

      if (response.status >= 200 && response.status < 300) {
        posthog.capture("all_data_erased");
        
        // Reset local preferences
        localStorage.setItem("memory_consent_preference", "declined");
        
        // Reset local UI states and sync cache
        const updated = {
          ...data,
          sessions: [],
          moodEntries: 0,
          account: {
            ...data.account,
            memoryConsent: false
          }
        };
        setData(updated);
        cachedMyData = updated; // Keep cache in sync

        setShowDeleteModal(false);
        setConfirmText("");
        setSuccessMessage("All of your session summaries and mood history have been permanently deleted.");
      } else {
        alert("Failed to delete data. Please try again.");
      }
    } catch (err) {
      console.error("Error running erasure:", err);
      alert("Failed to clear data records. Please try again.");
    } finally {
      setDeletingAll(false);
    }
  };

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white gap-4">
        <EchoOrb size="md" isPulsing={true} />
        <p className="text-[--color-silver-mist] text-sm animate-pulse font-medium">
          Echo is loading your privacy & data settings...
        </p>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="void-page flex min-h-screen items-center justify-center px-4">
        <ConstellationField density="ambient" className="opacity-50" />
        <div className="relative z-10 max-w-md text-center">
          <Lock className="mx-auto mb-4 text-[--color-electric-iris]" size={48} />
          <h2 className="void-subheading mb-3">Sign in required.</h2>
          <p className="void-copy mb-6">
            Please sign in to manage your privacy consent options and view or erase your personalized session data.
          </p>
          <Link
            href="/sign-in"
            className="void-pill"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <main className="void-page pt-24 pb-24 text-white">
      <ConstellationField density="ambient" className="fixed opacity-35" />
      <div className="void-section max-w-5xl">
        {/* Back navigation */}
        <div className="mb-6">
          {onNavigate ? (
            <button
              onClick={() => onNavigate("home")}
              className="void-ghost inline-flex items-center gap-2"
            >
              <ArrowLeft size={16} />
              Back to Dashboard
            </button>
          ) : (
            <Link
              href="/"
              className="void-ghost inline-flex items-center gap-2"
            >
              <ArrowLeft size={16} />
              Back to Dashboard
            </Link>
          )}
        </div>

        {/* Title */}
        <header className="mb-16 grid gap-8 md:grid-cols-[1.1fr_0.9fr] md:items-end">
          <div>
            <p className="void-kicker mb-5 flex items-center gap-2">
              <Shield size={16} className="text-[--color-electric-iris] shrink-0" />
              Privacy
            </p>
            <h1 className="void-display">
              Your memory is yours.
          </h1>
          </div>
          <p className="void-copy">
            Manage your personal data choices, review metrics, and control how EchoMind processes your conversations under the DPDP Act 2023.
          </p>
        </header>

        {/* Success Alert Banner */}
        <AnimatePresence>
          {successMessage && (
            <motion.div
              className="mb-8 border-t border-b border-green-500/30 py-4 text-sm text-green-200 flex items-center gap-3"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <Check className="text-green-400 shrink-0" size={18} />
              <span>{successMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {loading ? (
          <div className="flex justify-center items-center py-16">
            <Loader2 className="animate-spin text-[--color-electric-iris]" size={40} />
          </div>
        ) : error ? (
          <div className="border-t border-red-500/30 py-8 text-center">
            <AlertTriangle className="mx-auto text-yellow-400 mb-2" size={32} />
            <p className="text-red-300 text-sm">{error}</p>
            <button
              onClick={fetchData}
              className="void-pill mt-4 inline-flex"
            >
              <RefreshCw size={12} /> Retry
            </button>
          </div>
        ) : data ? (
          <div className="space-y-8">
            {/* 1. Account & Consent Status */}
            <motion.div
              className="border-t void-hairline pt-8"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h2 className="void-subheading mb-6 flex items-center gap-2">
                <UserCheck size={20} className="text-[--color-electric-iris]" />
                Personalized AI Memory
              </h2>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="max-w-xl space-y-1.5">
                  <p className="void-copy text-white">
                    Allow EchoMind to reference your past session summaries to carry on conversations naturally.
                  </p>
                  <p className="text-sm text-[--color-ash-gray] leading-relaxed">
                    With your consent, summaries of previous wellness check-ins and mood trends are analyzed dynamically to give the companion context. If you withdraw consent, the companion will treat every call as a blank slate.
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-3">
                  <span
                    className={`inline-flex min-w-[5.5rem] items-center justify-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition-colors ${
                      data.account.memoryConsent
                        ? "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/40"
                        : "bg-zinc-800/80 text-zinc-400 ring-1 ring-zinc-600/60"
                    }`}
                    aria-live="polite"
                  >
                    {savingConsent ? (
                      <Loader2 className="animate-spin" size={14} />
                    ) : data.account.memoryConsent ? (
                      <>
                        <CheckCircle2 size={14} />
                        On
                      </>
                    ) : (
                      <>
                        <EyeOff size={14} />
                        Off
                      </>
                    )}
                  </span>

                  <Switch
                    checked={data.account.memoryConsent}
                    onCheckedChange={(checked) => void handleToggleConsent(checked)}
                    disabled={savingConsent}
                    aria-label="Toggle personalized AI memory consent"
                    className="h-8 w-14 border border-white/10 data-[state=checked]:bg-violet-600 data-[state=unchecked]:bg-zinc-700 [&_[data-slot=switch-thumb]]:size-6 [&_[data-slot=switch-thumb]]:data-[state=checked]:translate-x-[calc(100%-4px)]"
                  />
                </div>
              </div>

              {/* Mini Consent Badge */}
              <div className="mt-6 pt-5 border-t void-hairline flex flex-wrap gap-4 text-xs">
                <span className="text-[--color-ash-gray] flex items-center gap-1.5">
                  Plan Tier: <strong className="text-white uppercase">{data.account.plan}</strong>
                </span>
                <span className="text-[--color-ash-gray] flex items-center gap-1.5">
                  Remaining Minutes: <strong className="text-white">{data.account.minutesRemaining} mins</strong>
                </span>
                <span className="text-[--color-ash-gray] flex items-center gap-1.5">
                  Consent Status:{" "}
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      data.account.memoryConsent
                        ? "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30"
                        : "bg-zinc-800/80 text-zinc-400 ring-1 ring-zinc-600/50"
                    }`}
                  >
                    {data.account.memoryConsent ? (
                      <>
                        <CheckCircle2 size={12} /> Enabled
                      </>
                    ) : (
                      <>
                        <EyeOff size={12} /> Disabled
                      </>
                    )}
                  </span>
                </span>
              </div>
            </motion.div>

            {/* 2. My Data Directory */}
            <motion.div
              className="border-t void-hairline pt-8"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <h2 className="void-subheading mb-5 flex items-center gap-2">
                <Database size={20} className="text-[--color-electric-iris]" />
                Data Storage Summary
              </h2>
              <p className="void-copy mb-8">
                Below is a transparent report of the data files and summaries linked to your account.
              </p>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="border-t void-hairline pt-4">
                  <div className="void-kicker">Session Summaries Stored</div>
                  <div className="text-5xl font-normal tracking-[-0.04em] text-white mt-2">
                    {data.sessions.filter(s => s.hasSummary).length}
                  </div>
                  <div className="text-xs text-[--color-ash-gray] mt-2">AI-generated descriptions</div>
                </div>

                <div className="border-t void-hairline pt-4">
                  <div className="void-kicker">Mood Check-ins Tracked</div>
                  <div className="text-5xl font-normal tracking-[-0.04em] text-white mt-2">{data.moodEntries}</div>
                  <div className="text-xs text-[--color-ash-gray] mt-2">Submitted after calls</div>
                </div>
              </div>

              {/* Data Category lists */}
              <div className="grid md:grid-cols-2 gap-10 pt-6 border-t void-hairline text-sm">
                <div>
                  <h3 className="void-kicker flex items-center gap-1.5 mb-3">
                    <CheckCircle2 size={16} /> What We Keep
                  </h3>
                  <ul className="space-y-2">
                    {data.dataStored.map((item, idx) => (
                      <li key={idx} className="text-sm text-[--color-silver-mist] flex items-start gap-2">
                        <span className="text-[--color-saffron-spark] shrink-0 mt-0.5">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="void-kicker flex items-center gap-1.5 mb-3 text-[--color-ash-gray]">
                    <EyeOff size={16} /> What We Do NOT Retain
                  </h3>
                  <ul className="space-y-2">
                    {data.dataNotStored.map((item, idx) => (
                      <li key={idx} className="text-sm text-[--color-ash-gray] flex items-start gap-2">
                        <span className="text-red-400 shrink-0 mt-0.5">×</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>

            {/* 3. Deletion Panel */}
            <motion.div
              className="border-t border-red-500/30 pt-8"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1.5 max-w-xl">
                  <h2 className="void-subheading text-red-300 flex items-center gap-2">
                    <Trash2 size={20} className="text-red-400" />
                    Right to Erasure (DPDP Act)
                  </h2>
                  <p className="text-sm text-white">
                    Permanently delete all your session summaries and mood check-in entries.
                  </p>
                  <p className="text-xs text-[--color-ash-gray] leading-relaxed">
                    This action deletes all conversation summaries and mood ratings. Your minute balance and plan level will be preserved, but all past companion memory is wiped. <strong>This action cannot be undone.</strong>
                  </p>
                </div>

                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="px-6 py-3 bg-red-500/10 hover:bg-red-500 text-red-200 hover:text-white border border-red-500/30 hover:border-transparent rounded-full font-medium transition-all duration-200 shrink-0 text-center text-sm"
                >
                  Delete All Data
                </button>
              </div>
            </motion.div>
          </div>
        ) : null}
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setShowDeleteModal(false);
                setConfirmText("");
              }}
            />

            {/* Modal Box */}
            <motion.div
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[92%] max-w-md bg-black border border-red-500/30 rounded-2xl p-6 z-50 text-white"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <div className="flex justify-center mb-4">
                <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center">
                  <AlertTriangle className="text-red-400" size={24} />
                </div>
              </div>

              <h3 className="text-center text-xl font-bold mb-3 text-red-400">
                Are you absolutely sure?
              </h3>

              <div className="space-y-3 text-sm text-gray-300 leading-relaxed mb-6">
                <p>
                  This will permanently delete all stored summaries and mood score entries associated with your account from PostgreSQL database tables, and purge cached data.
                </p>
                <p className="text-xs text-red-300/90 font-medium">
                  Note: Your active account minutes balance will not be lost, but all session content is scrubbed. This cannot be undone.
                </p>

                <div className="pt-2">
                  <label htmlFor="confirm-field" className="block text-xs font-semibold text-gray-400 mb-1">
                    To confirm, please type <span className="text-red-400">DELETE ALL</span> below:
                  </label>
                  <input
                    id="confirm-field"
                    type="text"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    className="w-full px-3 py-2 bg-black/40 border border-red-500/20 rounded-lg text-white text-sm focus:outline-none focus:border-red-500"
                    placeholder="DELETE ALL"
                  />
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex flex-col gap-2">
                <button
                  onClick={handleDeleteAllData}
                  disabled={confirmText !== "DELETE ALL" || deletingAll}
                  className="w-full px-6 py-3 bg-red-600 hover:bg-red-500 disabled:bg-red-950/20 text-white disabled:text-gray-600 rounded-full font-semibold transition-all text-sm flex justify-center items-center gap-2"
                >
                  {deletingAll ? (
                    <>
                      <Loader2 className="animate-spin" size={16} /> Erasing Data...
                    </>
                  ) : (
                    "Confirm Permanent Deletion"
                  )}
                </button>
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setConfirmText("");
                  }}
                  className="w-full py-2 text-xs text-gray-400 hover:text-gray-200 transition-colors text-center"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </main>
  );
}
