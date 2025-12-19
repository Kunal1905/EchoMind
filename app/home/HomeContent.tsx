"use client";

import { motion } from 'motion/react';
import { EchoOrb } from '../components/EchoOrb'; 
import { Sparkles, Clock, Zap, Shield, TrendingUp, Users, Crown, Timer } from 'lucide-react';
import { useState, useEffect } from 'react';
import { DisclaimerModal } from '../components/DisclaimerModal'; 
import { useRouter } from 'next/navigation';

// Create a wrapper component that can be used both as a page and as a component
interface HomeContentProps {
  onNavigate?: (page: string) => void;
  isPremium?: boolean;
  premiumCalls?: number;
}

export default function HomeContent({ onNavigate, isPremium = false, premiumCalls = 0 }: HomeContentProps) {
  const router = useRouter();
  const [disclaimerOpen, setDisclaimerOpen] = useState(false);
  const [currentFeature, setCurrentFeature] = useState(0);

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
        case 'sessions':
          router.push('/premium');
          break;
        default:
          router.push(`/${page}`);
      }
    }
  };

  const features = [
    {
      icon: Sparkles,
      title: '3 Free Calls',
      description: '10 mins per session',
      color: 'from-violet-500 to-purple-600'
    },
    {
      icon: TrendingUp,
      title: 'AI Sentiment Analysis',
      description: 'Real-time emotion tracking',
      color: 'from-teal-500 to-cyan-600'
    },
    {
      icon: Shield,
      title: 'Secure & Private',
      description: 'Your conversations, protected',
      color: 'from-amber-500 to-yellow-600'
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % features.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen neural-bg pt-20 md:pt-24 pb-24 md:pb-12 px-4">
      {/* Hero Section */}
      <div className="container mx-auto max-w-4xl">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          {/* Premium Status Banner */}
          {isPremium && (
            <motion.div
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-600/30 to-yellow-600/30 border border-amber-500/50 rounded-full mb-4"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Crown className="text-yellow-400" size={16} />
              <span className="text-yellow-200 text-sm">
                Premium Active • {premiumCalls} calls remaining
              </span>
            </motion.div>
          )}

          {/* Main Echo Orb */}
          <div className="flex justify-center mb-8">
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            >
              <EchoOrb 
                sentiment="neutral" 
                size="xl" 
                isPulsing 
                onClick={() => handleNavigation('chat')}
              />
            </motion.div>
          </div>

          {/* Hero Title */}
          <h1 className="mb-4 bg-gradient-to-r from-violet-400 via-fuchsia-400 to-teal-400 bg-clip-text text-transparent">
            Echo Your Inner World
          </h1>

          <p className="text-lg md:text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Your AI-powered mental wellness companion. Speak freely, be heard, and discover insights about your emotional landscape.
          </p>

          {/* Trial Badge */}
          <motion.div
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-600/30 to-teal-500/30 border border-violet-500/50 rounded-full mb-8 glitch-hover"
            whileHover={{ scale: 1.05 }}
          >
            <Zap className="text-yellow-400" size={20} />
            <span className="text-white">Free Trial: 3 free voice sessions</span>
          </motion.div>

          {/* CTA Button */}
          <motion.button
            onClick={() => handleNavigation('chat')}
            className="px-12 py-4 bg-gradient-to-r from-violet-600 to-teal-500 rounded-full text-lg hover:from-violet-500 hover:to-teal-400 transition-all shadow-lg shadow-violet-500/50"
            whileHover={{ scale: 1.05, boxShadow: '0 20px 40px rgba(139, 92, 246, 0.4)' }}
            whileTap={{ scale: 0.95 }}
            aria-label="Start your first echo session"
          >
            Start Echo Session
          </motion.button>
        </motion.div>

        {/* Features Carousel */}
        <motion.div
          className="relative h-48 mb-12 overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={index}
                className="absolute inset-0 flex items-center justify-center"
                initial={{ opacity: 0, x: 100 }}
                animate={{
                  opacity: currentFeature === index ? 1 : 0,
                  x: currentFeature === index ? 0 : 100
                }}
                transition={{ duration: 0.5 }}
              >
                <div className={`text-center p-8 rounded-2xl bg-gradient-to-br ${feature.color} bg-opacity-10 border border-white/10 backdrop-blur-sm max-w-md`}>
                  <div className="flex justify-center mb-4">
                    <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${feature.color} flex items-center justify-center`}>
                      <Icon size={32} className="text-white" />
                    </div>
                  </div>
                  <h3 className="mb-2">{feature.title}</h3>
                  <p className="text-gray-300">{feature.description}</p>
                </div>
              </motion.div>
            );
          })}

          {/* Carousel indicators */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {features.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentFeature(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  currentFeature === index 
                    ? 'bg-violet-400 w-8' 
                    : 'bg-gray-600 hover:bg-gray-500'
                }`}
                aria-label={`View feature ${index + 1}`}
              />
            ))}
          </div>
        </motion.div>

        {/* Free vs Premium Comparison */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {/* Free Tier */}
          <motion.div
            className="p-6 rounded-2xl backdrop-blur-xl bg-[--bg-darker]/60 border border-violet-500/20 relative overflow-hidden"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/10 rounded-full blur-3xl" />
            <h3 className="mb-4">Free Tier</h3>
            <ul className="space-y-3 text-gray-300">
              <li className="flex items-start gap-2">
                <Clock className="text-violet-400 mt-1 shrink-0" size={18} />
                <span>3 voice sessions </span>
              </li>
              <li className="flex items-start gap-2">
                <TrendingUp className="text-violet-400 mt-1 shrink-0" size={18} />
                <span>Basic sentiment analysis</span>
              </li>
              <li className="flex items-start gap-2">
                <Users className="text-violet-400 mt-1 shrink-0" size={18} />
                <span>Lifetime Session history </span>
              </li>
            </ul>
          </motion.div>

          {/* Premium Tier */}
          <motion.div
            className="p-6 rounded-2xl backdrop-blur-xl bg-[--bg-darker]/60 border border-amber-500/30 relative overflow-hidden"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            whileHover={{ scale: 1.02 }}
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl" />
            {isPremium ? (
              <div className="absolute top-4 right-4 px-3 py-1 bg-green-600 rounded-full text-xs flex items-center gap-1">
                <Timer size={14} />
                {premiumCalls} calls
              </div>
            ) : (
              <div className="absolute top-4 right-4 px-3 py-1 bg-gradient-to-r from-yellow-500 to-amber-500 rounded-full text-xs">
                ₹990 for 10 calls
              </div>
            )}
            <h3 className="mb-4 bg-gradient-to-r from-yellow-400 to-amber-400 bg-clip-text text-transparent">
              Premium
            </h3>
            <ul className="space-y-3 text-gray-300 mb-4">
              <li className="flex items-start gap-2">
                <Sparkles className="text-amber-400 mt-1 shrink-0" size={18} />
                <span><strong className="text-white">10</strong> voice sessions</span>
              </li>
              <li className="flex items-start gap-2">
                <TrendingUp className="text-amber-400 mt-1 shrink-0" size={18} />
                <span>Advanced AI sentiment insights</span>
              </li>
              <li className="flex items-start gap-2">
                <Shield className="text-amber-400 mt-1 shrink-0" size={18} />
                <span>Lifetime session history</span>
              </li>
            </ul>
            <button
              onClick={() => handleNavigation('sessions')}
              className="w-full px-6 py-3 bg-gradient-to-r from-yellow-500 to-amber-500 rounded-full hover:from-yellow-400 hover:to-amber-400 transition-all"
            >
              {isPremium ? 'Add More Calls' : 'Upgrade Now'}
            </button>
          </motion.div>
        </div>

        {/* Disclaimer Footer */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <button
            onClick={() => setDisclaimerOpen(true)}
            className="text-sm text-gray-400 hover:text-gray-300 underline"
          >
            Important: Mental Health Resources & Disclaimer
          </button>
        </motion.div>
      </div>

      <DisclaimerModal 
        isOpen={disclaimerOpen}
        onClose={() => setDisclaimerOpen(false)}
      />
    </div>
  );
}