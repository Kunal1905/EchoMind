"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, X, Sparkles, Zap, Crown, Star, ArrowRight } from 'lucide-react';

interface SessionsProps {
  onNavigate: (page: string) => void;
  onUpgrade: () => void;
  isPremium: boolean;
}

export function Sessions({ onNavigate, onUpgrade, isPremium }: SessionsProps) {
  const [selectedTier, setSelectedTier] = useState<'free' | 'premium'>('premium');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const features = {
    free: [
      { text: '3 voice sessions per month', included: true },
      { text: '10 minutes per session', included: true },
      { text: 'Basic sentiment analysis', included: true },
      { text: 'Session history (7 days)', included: true },
      { text: 'Unlimited sessions', included: false },
      { text: 'Advanced AI insights', included: false },
      { text: 'Lifetime history', included: false },
      { text: 'Priority support', included: false }
    ],
    premium: [
      { text: '10 voice sessions', included: true },
      { text: 'Unlimited session duration', included: true },
      { text: 'Advanced sentiment analysis', included: true },
      { text: 'Lifetime session history', included: true },
      { text: 'Detailed emotion tracking', included: true },
      { text: 'Export all data', included: true },
      { text: 'Weekly insights report', included: true },
      { text: 'Priority support 24/7', included: true }
    ]
  };

  const testimonials = [
    {
      name: 'Priya S.',
      location: 'Mumbai',
      text: "EchoMind has been a game-changer for my mental wellness journey. The AI feels genuinely empathetic.",
      rating: 5
    },
    {
      name: 'Arjun K.',
      location: 'Bangalore',
      text: "The sentiment analysis helps me understand my emotions better. Worth every rupee!",
      rating: 5
    },
    {
      name: 'Meera R.',
      location: 'Delhi',
      text: "As someone dealing with anxiety, having unlimited sessions gives me peace of mind.",
      rating: 5
    }
  ];

  const handlePayment = () => {
    // Mock Razorpay integration
    setShowPaymentModal(true);
    
    // Simulate payment processing
    setTimeout(() => {
      setPaymentSuccess(true);
      setTimeout(() => {
        onUpgrade();
        setShowPaymentModal(false);
        setPaymentSuccess(false);
        // Navigate to chat with confetti effect
        onNavigate('chat');
      }, 2000);
    }, 2000);
  };

  return (
    <div className="min-h-screen neural-bg pt-20 md:pt-24 pb-24 md:pb-12 px-4">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="mb-4 bg-gradient-to-r from-violet-400 via-fuchsia-400 to-amber-400 bg-clip-text text-transparent">
            Pay-As-You-Go Wellness
          </h1>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto">
            Start your mental wellness journey with flexible hourly pricing. Only pay for the time you use.
          </p>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          {/* Free Tier */}
          <motion.div
            className={`relative rounded-3xl p-8 border-2 transition-all cursor-pointer flex flex-col ${
              selectedTier === 'free'
                ? 'border-violet-500 backdrop-blur-xl bg-[--bg-darker]/60'
                : 'border-violet-500/30 backdrop-blur-xl bg-[--bg-darker]/40 hover:border-violet-500/50'
            }`}
            onClick={() => setSelectedTier('free')}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            whileHover={{ scale: 1.02 }}
          >
            {isPremium && (
              <div className="absolute top-4 right-4 px-3 py-1 bg-gray-700 rounded-full text-xs text-gray-400">
                Current Plan
              </div>
            )}

            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center">
                <Zap className="text-white" size={24} />
              </div>
              <div>
                <h3>Free Tier</h3>
                <p className="text-gray-400 text-sm">Get started</p>
              </div>
            </div>

            <div className="mb-6">
              <div className="flex items-baseline gap-2">
                <span className="text-5xl">₹0</span>
                <span className="text-gray-400">/month</span>
              </div>
            </div>

            <ul className="space-y-3 mb-8 flex-grow">
              {features.free.map((feature, index) => (
                <li key={index} className="flex items-start gap-3">
                  {feature.included ? (
                    <Check className="text-violet-400 shrink-0 mt-0.5" size={20} />
                  ) : (
                    <X className="text-gray-600 shrink-0 mt-0.5" size={20} />
                  )}
                  <span className={feature.included ? 'text-gray-300' : 'text-gray-600'}>
                    {feature.text}
                  </span>
                </li>
              ))}
            </ul>

            <button
              onClick={() => onNavigate('chat')}
              className="w-full px-6 py-3 bg-violet-600/20 hover:bg-violet-600/30 rounded-full transition-all border border-violet-500/30 mt-auto"
            >
              Start Free
            </button>
          </motion.div>

          {/* Premium Tier */}
          <motion.div
            className={`relative rounded-3xl p-8 border-2 transition-all cursor-pointer flex flex-col ${
              selectedTier === 'premium'
                ? 'border-amber-500 backdrop-blur-xl bg-[--bg-darker]/60'
                : 'border-amber-500/30 backdrop-blur-xl bg-[--bg-darker]/40 hover:border-amber-500/50'
            }`}
            onClick={() => setSelectedTier('premium')}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            whileHover={{ scale: 1.02 }}
          >
            {/* Popular badge */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-6 py-2 bg-gradient-to-r from-yellow-500 to-amber-500 rounded-full text-sm flex items-center gap-2">
              <Crown size={16} />
              Most Popular
            </div>

            {isPremium && (
              <div className="absolute top-4 right-4 px-3 py-1 bg-green-600 rounded-full text-xs flex items-center gap-1">
                <Check size={14} />
                Active
              </div>
            )}

            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-500 to-amber-600 flex items-center justify-center">
                <Sparkles className="text-white" size={24} />
              </div>
              <div>
                <h3 className="bg-gradient-to-r from-yellow-400 to-amber-400 bg-clip-text text-transparent">
                  Premium
                </h3>
                <p className="text-gray-400 text-sm">Unlimited wellness</p>
              </div>
            </div>

            <div className="mb-6">
              <div className="flex items-baseline gap-2">
                <span className="text-5xl bg-gradient-to-r from-yellow-400 to-amber-400 bg-clip-text text-transparent">
                  ₹990
                </span>
                <span className="text-gray-400">for 10 calls</span>
              </div>
              <p className="text-sm text-amber-400 mt-1">One-time payment</p>
            </div>

            <ul className="space-y-3 mb-8 flex-grow">
              {features.premium.map((feature, index) => (
                <li key={index} className="flex items-start gap-3">
                  <Check className="text-amber-400 shrink-0 mt-0.5" size={20} />
                  <span className="text-gray-300">{feature.text}</span>
                </li>
              ))}
            </ul>

            {isPremium ? (
              <button
                className="w-full px-6 py-3 bg-gradient-to-r from-yellow-600/20 to-amber-600/20 rounded-full border border-amber-500/30 cursor-not-allowed mt-auto"
                disabled
              >
                Current Plan
              </button>
            ) : (
              <button
                onClick={handlePayment}
                className="w-full px-6 py-3 bg-gradient-to-r from-yellow-500 to-amber-500 rounded-full hover:from-yellow-400 hover:to-amber-400 transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/30 mt-auto"
              >
                Upgrade to Premium
                <ArrowRight size={18} />
              </button>
            )}
          </motion.div>
        </div>

        {/* Testimonials */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h2 className="text-center mb-8 bg-gradient-to-r from-violet-400 to-teal-300 bg-clip-text text-transparent">
            Loved by Thousands
          </h2>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                className="backdrop-blur-xl bg-[--bg-darker]/60 border border-violet-500/20 rounded-2xl p-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
              >
                <div className="flex gap-1 mb-3">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="text-yellow-400 fill-yellow-400" size={16} />
                  ))}
                </div>
                <p className="text-gray-300 mb-4 italic">"{testimonial.text}"</p>
                <div>
                  <div className="text-white">{testimonial.name}</div>
                  <div className="text-sm text-gray-400">{testimonial.location}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Payment Modal */}
      <AnimatePresence>
        {showPaymentModal && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />

            <motion.div
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-md bg-gradient-to-br from-[--bg-darker] to-violet-950/50 border border-violet-500/30 rounded-2xl p-8 z-50 text-center"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              {!paymentSuccess ? (
                <>
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-yellow-500 to-amber-500 mx-auto mb-6 flex items-center justify-center">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    >
                      <Sparkles className="text-white" size={40} />
                    </motion.div>
                  </div>
                  <h3 className="mb-4">Processing Payment...</h3>
                  <p className="text-gray-400">Connecting to Razorpay secure gateway</p>
                </>
              ) : (
                <>
                  <motion.div
                    className="w-20 h-20 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 mx-auto mb-6 flex items-center justify-center"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200 }}
                  >
                    <Check className="text-white" size={40} />
                  </motion.div>
                  <h3 className="mb-4 bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                    Payment Successful!
                  </h3>
                  <p className="text-gray-400">Welcome to EchoMind Premium ✨</p>
                  
                  {/* Confetti effect */}
                  <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    {[...Array(20)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="absolute w-2 h-2 rounded-full"
                        style={{
                          background: ['#8b5cf6', '#14b8a6', '#fbbf24', '#ef4444'][i % 4],
                          left: `${Math.random() * 100}%`,
                          top: '50%'
                        }}
                        initial={{ y: 0, opacity: 1 }}
                        animate={{ 
                          y: [0, -200, -400],
                          x: [(Math.random() - 0.5) * 100, (Math.random() - 0.5) * 200],
                          opacity: [1, 1, 0],
                          rotate: [0, 360]
                        }}
                        transition={{ duration: 2, delay: i * 0.05 }}
                      />
                    ))}
                  </div>
                </>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
