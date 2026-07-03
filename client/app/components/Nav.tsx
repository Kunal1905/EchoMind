"use client";

import {
  Home,
  MessageCircle,
  History,
  CreditCard,
  Menu,
  X,
  UserIcon,
} from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";

interface NavProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export function Nav({ currentPage, onNavigate }: NavProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: "home", label: "Home", icon: Home },
    { id: "chat", label: "Echo", icon: MessageCircle },
    { id: "history", label: "History", icon: History },
    { id: "sessions", label: "Premium", icon: CreditCard },
  ];

  return (
    <>
      {/* Desktop Navigation - Wavy Stars */}
      <nav className="hidden md:block fixed top-0 left-0 right-0 z-50 backdrop-blur-lg bg-[--bg-darker]/80 border-b border-violet-500/20">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <motion.div
              className="flex items-center gap-3"
              whileHover={{ scale: 1.05 }}
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-teal-400 flex items-center justify-center">
                <span className="text-xl">🌀</span>
              </div>
              <h2 className="bg-gradient-to-r from-violet-400 to-teal-300 bg-clip-text text-transparent">
                EchoMind AI
              </h2>
            </motion.div>

            <div className="flex items-center gap-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentPage === item.id;
                return (
                  <motion.button
                    key={item.id}
                    onClick={() => onNavigate(item.id)}
                    className={`px-6 py-2 rounded-full flex items-center gap-2 transition-all ${
                      isActive
                        ? "bg-gradient-to-r from-violet-600 to-teal-500 text-white"
                        : "text-gray-300 hover:text-white hover:bg-white/10"
                    }`}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    aria-current={isActive ? "page" : undefined}
                  >
                    <Icon size={18} />
                    <span>{item.label}</span>
                    {isActive && (
                      <motion.div
                        className="absolute -bottom-1 left-1/2 w-1 h-1 rounded-full bg-white"
                        layoutId="nav-indicator"
                      />
                    )}
                  </motion.button>
                );
              })}
              <SignedIn>
                <UserButton />
              </SignedIn>

              <SignedOut>
                <SignInButton mode="modal">
                  <button className="px-6 py-2 rounded-full bg-gradient-to-r from-violet-600 to-teal-500 text-white">
                    Login
                  </button>
                </SignInButton>
              </SignedOut>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation - Bottom Tabs */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 backdrop-blur-lg bg-[--bg-darker]/95 border-t border-violet-500/20">
        <div className="flex items-center justify-around px-4 py-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <motion.button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-all ${
                  isActive ? "text-violet-400" : "text-gray-400"
                }`}
                whileTap={{ scale: 0.9 }}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon size={22} className={isActive ? "text-violet-400" : ""} />
                <span className="text-xs">{item.label}</span>
                {isActive && (
                  <motion.div
                    className="absolute -top-0.5 w-12 h-1 rounded-full bg-gradient-to-r from-violet-500 to-teal-400"
                    layoutId="mobile-nav-indicator"
                  />
                )}
              </motion.button>
            );
          })}
        </div>
      </nav>

      {/* Mobile Header */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-50 backdrop-blur-lg bg-[--bg-darker]/95 border-b border-violet-500/20">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-teal-400 flex items-center justify-center">
              <span>🌀</span>
            </div>
            <h3 className="bg-gradient-to-r from-violet-400 to-teal-300 bg-clip-text text-transparent">
              EchoMind
            </h3>
          </div>
          <SignedIn>
            <UserButton />
          </SignedIn>

          <SignedOut>
            <SignInButton mode="modal">
              <button className="px-6 py-2 rounded-full bg-gradient-to-r from-violet-600 to-teal-500 text-white">
                Login
              </button>
            </SignInButton>
          </SignedOut>
        </div>
      </header>
    </>
  );
}
