import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, Info } from 'lucide-react';
import { usePostHog } from 'posthog-js/react';
import { EASES, DURATIONS, usePrefersReducedMotion } from '../lib/motion';

interface PrivacyConsentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConsentGiven: (granted: boolean) => void;
}

export function PrivacyConsentModal({ isOpen, onClose, onConsentGiven }: PrivacyConsentModalProps) {
  const posthog = usePostHog();
  const prefersReduced = usePrefersReducedMotion();

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
            transition={{
              duration: prefersReduced ? DURATIONS.instant : DURATIONS.base,
              ease: EASES.smooth
            }}
            onClick={() => handleConsent(false)}
          />

          {/* Modal */}
          <motion.div
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-md bg-black border border-white/15 rounded-2xl p-6 z-50 text-white"
            initial={prefersReduced ? { opacity: 0 } : { scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={prefersReduced ? { opacity: 0 } : { scale: 0.95, opacity: 0 }}
            transition={{
              duration: prefersReduced ? DURATIONS.instant : DURATIONS.slow,
              ease: EASES.smooth
            }}
            role="dialog"
            aria-labelledby="consent-title"
            aria-describedby="consent-description"
          >
            {/* Icon */}
            <div className="flex justify-center mb-4">
              <div className="flex h-16 w-16 items-center justify-center">
                <ShieldCheck className="text-[--color-electric-iris]" size={32} />
              </div>
            </div>

            {/* Title */}
            <h3 id="consent-title" className="void-subheading mb-4 text-center">
              Personalized AI Memory
            </h3>

            {/* Content */}
            <div id="consent-description" className="space-y-4 text-sm text-gray-300">
              <p>
                To provide deeper reflection and track emotional progress over time, EchoMind can securely analyze and remember context from your previous conversations.
              </p>

              <div className="border-t void-hairline pt-4 flex gap-3 items-start">
                <Info className="text-[--color-electric-iris] shrink-0 mt-0.5" size={18} />
                <p className="text-xs text-gray-400">
                  Your voice sessions are encrypted and confidential. You can change your preference or reset your session history at any time.
                </p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col gap-3 mt-6">
              <motion.button
                onClick={() => handleConsent(true)}
                className="void-pill w-full cursor-pointer"
                whileHover={prefersReduced ? {} : { scale: 1.02 }}
                whileTap={prefersReduced ? {} : { scale: 0.98 }}
                transition={{ ease: EASES.smooth, duration: DURATIONS.base }}
              >
                Enable AI Memory
              </motion.button>
              <button
                onClick={() => handleConsent(false)}
                className="w-full px-6 py-2 text-sm text-gray-400 hover:text-gray-200 transition-colors text-center cursor-pointer"
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
