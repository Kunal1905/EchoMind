"use client";

import { motion } from 'motion/react';
import { EchoOrb } from '../components/EchoOrb';
import { Sparkles, Clock, Zap, Shield, TrendingUp, Users, Crown, Timer } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { DisclaimerModal } from '../components/DisclaimerModal';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { EASES, DURATIONS, usePrefersReducedMotion } from '../lib/motion';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

const HeroThreeBg = dynamic(() => import('../components/HeroThreeBg'), { ssr: false });

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
  const containerRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = usePrefersReducedMotion();

  // Scroll animations via GSAP
  useGSAP(() => {
    if (prefersReducedMotion) return;

    const customEase = "cubic-bezier(0.25, 0.46, 0.45, 0.94)";

    // 1. Features Carousel Reveal
    gsap.fromTo(
      ".features-carousel",
      { opacity: 0, y: 30 },
      {
        opacity: 1,
        y: 0,
        duration: 0.6,
        ease: customEase,
        scrollTrigger: {
          trigger: ".features-carousel",
          start: "top 85%",
          toggleActions: "play none none none",
        },
      }
    );

    // 2. Comparison Cards Reveal (Staggered)
    gsap.fromTo(
      [".free-card", ".premium-card"],
      { opacity: 0, y: 40 },
      {
        opacity: 1,
        y: 0,
        duration: 0.7,
        stagger: 0.15,
        ease: "power2.out",
        scrollTrigger: {
          trigger: ".comparison-grid",
          start: "top 80%",
          toggleActions: "play none none none",
        },
      }
    );

    // 3. Footer Reveal
    gsap.fromTo(
      ".footer-section",
      { opacity: 0, y: 20 },
      {
        opacity: 1,
        y: 0,
        duration: 0.5,
        ease: customEase,
        scrollTrigger: {
          trigger: ".footer-section",
          start: "top 95%",
          toggleActions: "play none none none",
        },
      }
    );
  }, { scope: containerRef, dependencies: [prefersReducedMotion] });

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
      title: '5 Free Minutes',
      description: 'Try Echo, no card required',
      color: 'from-violet-500 to-purple-600'
    },
    {
      icon: TrendingUp,
      title: 'Echo Remembers You',
      description: 'References your past sessions',
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
    <div ref={containerRef} className="min-h-screen relative overflow-hidden neural-bg pt-20 md:pt-24 pb-24 md:pb-12 px-4">
      {/* Ambient Three.js Background */}
      <HeroThreeBg />

      {/* Hero Section */}
      <div className="container mx-auto max-w-4xl relative z-10">
        <motion.div
          className="text-center mb-12"
          initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ 
            duration: prefersReducedMotion ? DURATIONS.fast : DURATIONS.cinematic,
            ease: EASES.smooth
          }}
        >
          {/* Minutes Status Banner */}
          <motion.div className={`inline-flex items-center gap-2 px-4 py-2 border rounded-full mb-4 ${
            isPremium
              ? "bg-gradient-to-r from-amber-600/30 to-yellow-600/30 border-amber-500/50"
              : "bg-gradient-to-r from-violet-600/30 to-teal-500/30 border-violet-500/50"
          }`}>
            {isPremium ? (
              <Crown className="text-yellow-400" size={16} />
            ) : (
              <Timer className="text-teal-300" size={16} />
            )}
            <span className={`text-sm ${isPremium ? "text-yellow-200" : "text-teal-100"}`}>
              {isPremium ? "Plan active" : "Free plan"} • {premiumCalls} minute{premiumCalls !== 1 ? "s" : ""} remaining
            </span>
          </motion.div>

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
          <motion.div className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-600/30 to-teal-500/30 border border-violet-500/50 rounded-full mb-8 glitch-hover">
            <Zap className="text-yellow-400" size={20} />
            <span className="text-white">
              {isPremium
                ? `${premiumCalls} minute${premiumCalls !== 1 ? "s" : ""} available`
                : `Free Trial: ${premiumCalls} of 5 minute${premiumCalls === 1 ? "" : "s"} remaining`}
            </span>
          </motion.div>

          {/* CTA Button */}
          <motion.button
            onClick={() => handleNavigation('chat')}
            className="px-12 py-4 bg-gradient-to-r from-violet-600 to-teal-500 rounded-full text-lg hover:from-violet-500 hover:to-teal-400 transition-all shadow-lg shadow-violet-500/50"
            whileHover={{ scale: 1.05, boxShadow: '0 20px 40px rgba(139, 92, 246, 0.4)' }}
            whileTap={{ scale: 0.95 }}
          >
            Start Echo Session
          </motion.button>
        </motion.div>

        {/* Features Carousel */}
        <div className="features-carousel relative h-48 mb-12 overflow-hidden">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={index}
                className="absolute inset-0 flex items-center justify-center"
                initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, x: 50 }}
                animate={{
                  opacity: currentFeature === index ? 1 : 0,
                  x: currentFeature === index ? 0 : (prefersReducedMotion ? 0 : 50)
                }}
                transition={{ 
                  duration: prefersReducedMotion ? DURATIONS.fast : DURATIONS.slow,
                  ease: EASES.smooth
                }}
              >
                <div className={`text-center p-8 rounded-2xl bg-gradient-to-br ${feature.color} bg-opacity-10 border border-white/10 backdrop-blur-sm max-w-md`}>
                  <div className="flex justify-center mb-4">
                    <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${feature.color} flex items-center justify-center`}>
                      <Icon size={32} className="text-white" />
                    </div>
                  </div>
                  <h2 className="text-2xl font-bold mb-2">{feature.title}</h2>
                  <p className="text-gray-300">{feature.description}</p>
                </div>
              </motion.div>
            );
          })}

          {/* Carousel indicators */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 items-center">
            {features.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentFeature(index)}
                className="w-8 h-8 flex items-center justify-center rounded-full transition-all hover:bg-white/5"
                aria-label={`View feature ${index + 1}`}
              >
                <span className={`h-2 rounded-full transition-all ${currentFeature === index
                    ? 'bg-violet-400 w-8'
                    : 'bg-gray-600 w-2'
                  }`} />
              </button>
            ))}
          </div>
        </div>

        {/* Free vs Premium Comparison */}
        <div className="comparison-grid grid md:grid-cols-2 gap-6 mb-12">
          {/* Free Tier */}
          <motion.div
            className="free-card p-6 rounded-2xl backdrop-blur-xl bg-[--bg-darker]/60 border border-violet-500/20 relative overflow-hidden"
            whileHover={prefersReducedMotion ? {} : { scale: 1.02 }}
            transition={{ ease: EASES.smooth, duration: DURATIONS.base }}
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/10 rounded-full blur-3xl" />
            <h2 className="text-2xl font-bold mb-4">Free Tier</h2>
            <ul className="space-y-3 text-gray-300">
              <li className="flex items-start gap-2">
                <Clock className="text-violet-400 mt-1 shrink-0" size={18} />
                <span>5 minutes of voice sessions</span>
              </li>
              <li className="flex items-start gap-2">
                <TrendingUp className="text-violet-400 mt-1 shrink-0" size={18} />
                <span>Basic sentiment analysis</span>
              </li>
              <li className="flex items-start gap-2">
                <Users className="text-violet-400 mt-1 shrink-0" size={18} />
                <span>Lifetime session history</span>
              </li>
            </ul>
          </motion.div>

          {/* Premium Tier */}
          <motion.div
            className="premium-card p-6 rounded-2xl backdrop-blur-xl bg-[--bg-darker]/60 border border-amber-500/30 relative overflow-hidden"
            whileHover={prefersReducedMotion ? {} : { scale: 1.02 }}
            transition={{ ease: EASES.smooth, duration: DURATIONS.base }}
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl" />
            {isPremium ? (
              <div className="absolute top-4 right-4 px-3 py-1 bg-green-600 rounded-full text-xs flex items-center gap-1">
                <Timer size={14} />
                {premiumCalls} min
              </div>
            ) : (
              <div className="absolute top-4 right-4 px-3 py-1 bg-gradient-to-r from-yellow-500 to-amber-500 rounded-full text-xs">
                From ₹249
              </div>
            )}
            <h2 className="text-2xl font-bold mb-4 bg-gradient-to-r from-yellow-400 to-amber-400 bg-clip-text text-transparent">
              Premium
            </h2>
            <ul className="space-y-3 text-gray-300 mb-4">
              <li className="flex items-start gap-2">
                <Sparkles className="text-amber-400 mt-1 shrink-0" size={18} />
                <span><strong className="text-white">30–120</strong> minutes per plan</span>
              </li>
              <li className="flex items-start gap-2">
                <TrendingUp className="text-amber-400 mt-1 shrink-0" size={18} />
                <span>Echo remembers past sessions</span>
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
              {isPremium ? 'Add More Minutes' : 'Upgrade Now'}
            </button>
          </motion.div>
        </div>

        {/* Disclaimer Footer */}
        <div className="footer-section text-center space-y-4">
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 sm:gap-6">
            <button
              onClick={() => setDisclaimerOpen(true)}
              className="text-xs text-gray-400 hover:text-gray-300 underline"
            >
              Mental Health Disclaimer
            </button>
            <Link
              href="/privacy"
              className="text-xs text-gray-400 hover:text-gray-300 underline"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              className="text-xs text-gray-400 hover:text-gray-300 underline"
            >
              Terms of Use
            </Link>
            <Link
              href="/copyright"
              className="text-xs text-gray-400 hover:text-gray-300 underline"
            >
              IP & Copyright
            </Link>
          </div>
        </div>
      </div>

      <DisclaimerModal
        isOpen={disclaimerOpen}
        onClose={() => setDisclaimerOpen(false)}
      />
    </div>
  );
}
