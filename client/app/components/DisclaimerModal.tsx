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
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-md bg-gradient-to-br from-[--bg-darker] to-violet-950/50 border border-violet-500/30 rounded-2xl p-6 z-50 shadow-2xl"
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
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-600/20 border border-amber-500/30 flex items-center justify-center">
                <AlertTriangle className="text-amber-400" size={32} />
              </div>
            </div>

            {/* Title */}
            <h3 id="disclaimer-title" className="text-center mb-4 bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
              Important Notice
            </h3>

            {/* Content */}
            <div id="disclaimer-description" className="space-y-4 text-sm text-gray-300">
              <p>
                EchoMind AI provides <strong className="text-white">supportive conversations</strong> but is <strong className="text-amber-400">not a substitute for professional medical or mental health care</strong>.
              </p>

              <p>
                If you're experiencing a mental health crisis, please contact:
              </p>

              <div className="bg-violet-950/50 border border-violet-500/20 rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-3">
                  <Phone className="text-teal-400" size={18} />
                  <div>
                    <div className="text-white">India Mental Health Helpline</div>
                    <a 
                      href="tel:08046110007" 
                      className="text-teal-400 hover:text-teal-300 transition-colors"
                    >
                      080-46110007
                    </a>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="text-teal-400" size={18} />
                  <div>
                    <div className="text-white">Vandrevala Foundation (24/7)</div>
                    <a 
                      href="tel:18602662345" 
                      className="text-teal-400 hover:text-teal-300 transition-colors"
                    >
                      1860-2662-345
                    </a>
                  </div>
                </div>
              </div>

              <p className="text-xs text-gray-400">
                EchoMind AI is not intended for collecting personally identifiable information (PII) or securing sensitive data. Use discretion when sharing personal details.
              </p>
            </div>

            {/* Accept button */}
            <motion.button
              onClick={onClose}
              className="w-full mt-6 px-6 py-3 bg-gradient-to-r from-violet-600 to-teal-500 rounded-full hover:from-violet-500 hover:to-teal-400 transition-all"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              I Understand
            </motion.button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
