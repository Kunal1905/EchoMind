import { motion, AnimatePresence } from 'motion/react';
import { X, AlertTriangle, Phone } from 'lucide-react';

interface DisclaimerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DisclaimerModal({ isOpen, onClose }: DisclaimerModalProps) {
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
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-md bg-black border border-white/15 rounded-2xl p-6 z-50"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            role="dialog"
            aria-labelledby="disclaimer-title"
            aria-describedby="disclaimer-description"
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
              aria-label="Close disclaimer"
            >
              <X size={24} />
            </button>

            {/* Icon */}
            <div className="flex justify-center mb-4">
              <div className="flex h-16 w-16 items-center justify-center">
                <AlertTriangle className="text-[--color-saffron-spark]" size={32} />
              </div>
            </div>

            {/* Title */}
            <h3 id="disclaimer-title" className="void-subheading mb-3 text-center">
              Important Safety Notice
            </h3>

            {/* Content */}
            <div id="disclaimer-description" className="space-y-4 text-sm text-gray-300">
              <div className="rounded-xl border border-amber-400/30 bg-amber-500/10 p-3.5 text-xs text-amber-100 leading-relaxed">
                <strong className="text-amber-200 block mb-1">EchoMind is not a therapy or medical service.</strong>
                EchoMind is an AI wellness companion for supportive reflection. It is <strong className="text-white">not a licensed therapist, psychiatrist, or medical professional</strong> and cannot diagnose or treat any health condition.
              </div>

              <p className="text-xs text-gray-300">
                If you are experiencing severe distress, crisis, or thoughts of self-harm, please reach out immediately to professional crisis support:
              </p>

              <div className="border-t border-b void-hairline py-3 space-y-2.5">
                <div className="flex items-center gap-3">
                  <Phone className="text-[--color-saffron-spark] shrink-0" size={18} />
                  <div>
                    <div className="text-white text-xs font-semibold">KIRAN (Govt 24/7 Toll-Free)</div>
                    <a 
                      href="tel:18005990019" 
                      className="text-[--color-saffron-spark] text-xs font-mono font-bold hover:text-white transition-colors"
                    >
                      1800-599-0019
                    </a>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="text-[--color-electric-iris] shrink-0" size={18} />
                  <div>
                    <div className="text-white text-xs font-semibold">iCall Mental Health Helpline</div>
                    <a 
                      href="tel:9152987821" 
                      className="text-[--color-electric-iris] text-xs font-mono font-bold hover:text-white transition-colors"
                    >
                      9152987821
                    </a>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="text-[--color-electric-iris] shrink-0" size={18} />
                  <div>
                    <div className="text-white text-xs font-semibold">Vandrevala Foundation (24/7)</div>
                    <a 
                      href="tel:18602662345" 
                      className="text-gray-300 text-xs font-mono hover:text-white transition-colors"
                    >
                      1860-2662-345
                    </a>
                  </div>
                </div>
              </div>

              <p className="text-[11px] text-gray-400 leading-normal">
                By continuing, you acknowledge that EchoMind is an AI companion for personal wellness reflection and not a substitute for clinical care.
              </p>
            </div>

            {/* Accept button */}
            <motion.button
              onClick={() => {
                if (typeof window !== "undefined") {
                  localStorage.setItem("echomind_disclaimer_accepted", "true");
                }
                onClose();
              }}
              className="void-pill mt-5 w-full font-semibold"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              I Understand & Agree
            </motion.button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
