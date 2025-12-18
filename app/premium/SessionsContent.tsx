"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, X, Sparkles, Zap, Crown, Star, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface SessionsContentProps {
  onNavigate?: (page: string) => void;
  onUpgrade?: () => void;
  isPremium?: boolean;
}

export function SessionsContent({ onNavigate, onUpgrade, isPremium = false }: SessionsContentProps) {
  const router = useRouter();
  const [selectedTier, setSelectedTier] = useState<'free' | 'premium'>('premium');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Handle navigation either through props (when used as component) or router (when used as page)
  const handleNavigation = (page: string) => {
    if (onNavigate) {
      onNavigate(page);
    } else {
      // When used as a standalone page, navigate using Next.js router
      switch (page) {
        case 'chat':
          router.push('/echo/new');
          break;
        case 'home':
          router.push('/');
          break;
        default:
          router.push(`/${page}`);
      }
    }
  };

  const handleUpgradeAction = () => {
    if (onUpgrade) {
      onUpgrade();
    }
    // In a real app, this would trigger the payment flow
  };

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
        handleUpgradeAction();
        setShowPaymentModal(false);
        setPaymentSuccess(false);
        // Navigate to chat with confetti effect
        handleNavigation('chat');
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
              onClick={() => handleNavigation('chat')}
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
            </div>

            <ul className="space-y-3 mb-8 flex-grow">
              {features.premium.map((feature, index) => (
                <li key={index} className="flex items-start gap-3">
                  <Check className="text-amber-400 shrink-0 mt-0.5" size={20} />
                  <span className="text-gray-300">{feature.text}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={handlePayment}
              className="w-full px-6 py-3 bg-gradient-to-r from-yellow-500 to-amber-500 rounded-full hover:from-yellow-400 hover:to-amber-400 transition-all mt-auto"
            >
              Get Premium
            </button>
          </motion.div>
        </div>

        {/* Testimonials */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12">What Our Users Say</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                className="backdrop-blur-xl bg-[--bg-darker]/60 border border-violet-500/20 rounded-2xl p-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
              >
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="text-yellow-400 fill-current" size={20} />
                  ))}
                </div>
                <p className="text-gray-300 mb-4">"{testimonial.text}"</p>
                <div>
                  <p className="font-medium">{testimonial.name}</p>
                  <p className="text-sm text-gray-400">{testimonial.location}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div>
          <h2 className="text-3xl font-bold text-center mb-8">Frequently Asked Questions</h2>
          <div className="max-w-3xl mx-auto space-y-4">
            <motion.div
              className="backdrop-blur-xl bg-[--bg-darker]/60 border border-violet-500/20 rounded-2xl p-6"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h3 className="font-bold text-lg mb-2">How does the pay-as-you-go model work?</h3>
              <p className="text-gray-400">
                You purchase credits (10 calls for ₹990) and use them as needed. Each call deducts one credit from your balance.
              </p>
            </motion.div>
            <motion.div
              className="backdrop-blur-xl bg-[--bg-darker]/60 border border-violet-500/20 rounded-2xl p-6"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <h3 className="font-bold text-lg mb-2">Can I upgrade anytime?</h3>
              <p className="text-gray-400">
                Yes! You can upgrade from the free tier to premium at any time. Your free trial calls remain available until used.
              </p>
            </motion.div>
            <motion.div
              className="backdrop-blur-xl bg-[--bg-darker]/60 border border-violet-500/20 rounded-2xl p-6"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h3 className="font-bold text-lg mb-2">What happens if I don't use all my calls?</h3>
              <p className="text-gray-400">
                Unused calls expire after 30 days. We recommend using your calls within the month for the best experience.
              </p>
            </motion.div>
          </div>
        </div>

        {/* Payment Modal */}
        <AnimatePresence>
          {showPaymentModal && (
            <motion.div
              className="fixed inset-0 bg-black/80 backdrop-blur-lg flex items-center justify-center z-50 p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="bg-[--bg-darker] border border-violet-500/30 rounded-2xl p-8 max-w-md w-full text-center"
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
              >
                {paymentSuccess ? (
                  <>
                    <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Check className="text-green-400" size={40} />
                    </div>
                    <h3 className="text-2xl font-bold mb-2">Payment Successful!</h3>
                    <p className="text-gray-400 mb-6">
                      You've been upgraded to Premium. Enjoy unlimited sessions!
                    </p>
                  </>
                ) : (
                  <>
                    <div className="w-20 h-20 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Sparkles className="text-amber-400" size={40} />
                    </div>
                    <h3 className="text-2xl font-bold mb-2">Processing Payment</h3>
                    <p className="text-gray-400 mb-6">
                      Please wait while we process your payment...
                    </p>
                    <div className="flex justify-center">
                      <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  </>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}