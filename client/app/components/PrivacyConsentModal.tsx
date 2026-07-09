import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, Info } from 'lucide-react';
import { usePostHog } from 'posthog-js/react';

interface PrivacyConsentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConsentGiven: (granted: boolean) => void;
}

export function PrivacyConsentModal({ isOpen, onClose, onConsentGiven }: PrivacyConsentModalProps) {
  const posthog = usePostHog();

  const handleConsent = (granted: boolean) => {
    // Save preference to localStorage
    localStorage.setItem("memory_consent_preference", granted ? "granted" : "declined");
    // Capture event in PostHog
    posthog.capture("memory_consent", { granted });
    
    onConsentGiven(granted);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => handleConsent(false)}
          />

          {/* Modal */}
          <motion.div
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-md bg-gradient-to-br from-gray-900 to-violet-950/50 border border-violet-500/30 rounded-2xl p-6 z-50 shadow-2xl text-white"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            role="dialog"
            aria-labelledby="consent-title"
            aria-describedby="consent-description"
          >
            {/* Icon */}
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-500/20 to-teal-500/20 border border-violet-500/30 flex items-center justify-center">
                <ShieldCheck className="text-teal-400" size={32} />
              </div>
            </div>

            {/* Title */}
            <h3 id="consent-title" className="text-center text-xl font-bold mb-4 bg-gradient-to-r from-violet-400 to-teal-400 bg-clip-text text-transparent">
              Personalized AI Memory
            </h3>

            {/* Content */}
            <div id="consent-description" className="space-y-4 text-sm text-gray-300">
              <p>
                To provide deeper reflection and track emotional progress over time, EchoMind can securely analyze and remember context from your previous conversations.
              </p>

              <div className="bg-violet-950/30 border border-violet-500/10 rounded-lg p-4 flex gap-3 items-start">
                <Info className="text-violet-400 shrink-0 mt-0.5" size={18} />
                <p className="text-xs text-gray-400">
                  Your voice sessions are encrypted and confidential. You can change your preference or reset your session history at any time.
                </p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col gap-3 mt-6">
              <motion.button
                onClick={() => handleConsent(true)}
                className="w-full px-6 py-3 bg-gradient-to-r from-violet-600 to-teal-500 rounded-full hover:from-violet-500 hover:to-teal-400 transition-all font-semibold text-center"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Enable AI Memory
              </motion.button>
              <button
                onClick={() => handleConsent(false)}
                className="w-full px-6 py-2 text-sm text-gray-400 hover:text-gray-200 transition-colors text-center"
              >
                Continue Without Memory
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
