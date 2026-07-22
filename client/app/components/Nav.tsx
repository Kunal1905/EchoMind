"use client";

import {
  Home,
  MessageCircle,
  History,
  CreditCard,
  Settings,
} from "lucide-react";
import { motion } from "motion/react";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";

interface NavProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export function Nav({ currentPage, onNavigate }: NavProps) {
  const navItems = [
    { id: "home", label: "Home", icon: Home },
    { id: "chat", label: "Echo", icon: MessageCircle },
    { id: "history", label: "History", icon: History },
    { id: "sessions", label: "Plans", icon: CreditCard },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <>
      <nav className="hidden md:block fixed top-0 left-0 right-0 z-50 backdrop-blur-lg bg-[--bg-darker]/85 border-b border-violet-500/15">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <motion.div
              className="flex items-center gap-3"
              whileHover={{ scale: 1.03 }}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-teal-500">
                <MessageCircle size={20} className="text-white" />
              </div>
              <h2 className="text-lg font-semibold tracking-[-0.02em] text-white">
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
                    className={`relative flex items-center gap-2 rounded-full px-5 py-2 text-sm font-medium transition-all ${
                      isActive
                        ? "bg-gradient-to-r from-violet-600 to-teal-500 text-white"
                        : "text-gray-300 hover:bg-white/10 hover:text-white"
                    }`}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    aria-current={isActive ? "page" : undefined}
                  >
                    <Icon size={17} />
                    <span>{item.label}</span>
                    {isActive && (
                      <motion.div
                        className="absolute -bottom-1 left-1/2 h-1 w-1 rounded-full bg-white"
                        layoutId="nav-indicator"
                      />
                    )}
                  </motion.button>
                );
              })}
              <SignedIn>
                <UserButton
                  afterSignOutUrl="/sign-in"
                  showName={false}
                />
              </SignedIn>

              <SignedOut>
                <SignInButton mode="modal">
                  <button className="rounded-full bg-gradient-to-r from-violet-600 to-teal-500 px-6 py-2 text-sm font-medium text-white">
                    Sign in
                  </button>
                </SignInButton>
              </SignedOut>
            </div>
          </div>
        </div>
      </nav>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-violet-500/15 bg-black/95 backdrop-blur-lg">
        <div className="flex items-center justify-around px-4 py-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <motion.button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`relative flex min-w-0 flex-col items-center gap-1 rounded-lg px-2 py-2 transition-all ${
                  isActive ? "text-violet-300" : "text-gray-400"
                }`}
                whileTap={{ scale: 0.9 }}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon size={21} />
                <span className="text-[10px]">{item.label}</span>
                {isActive && (
                  <motion.div
                    className="absolute -top-0.5 h-1 w-10 rounded-full bg-gradient-to-r from-violet-500 to-teal-400"
                    layoutId="mobile-nav-indicator"
                  />
                )}
              </motion.button>
            );
          })}
        </div>
      </nav>

      {/* Mobile top header */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-50 border-b border-violet-500/15 bg-black/95 backdrop-blur-lg">
        <div className="flex items-center px-4 py-3">
          {/* Logo — left aligned */}
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-teal-500">
              <MessageCircle size={16} className="text-white" />
            </div>
            <h3 className="text-base font-semibold tracking-[-0.02em] text-white">
              EchoMind
            </h3>
          </div>

          {/* Spacer pushes UserButton to the far right */}
          <div className="flex-1" />

          <SignedIn>
            <UserButton
              afterSignOutUrl="/sign-in"
              showName={false}
            />
          </SignedIn>

          <SignedOut>
            <SignInButton mode="modal">
              <button className="rounded-full bg-gradient-to-r from-violet-600 to-teal-500 px-5 py-2 text-sm font-medium text-white">
                Sign in
              </button>
            </SignInButton>
          </SignedOut>
        </div>
      </header>
    </>
  );
}
