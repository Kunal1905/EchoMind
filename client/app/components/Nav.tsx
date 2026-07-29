"use client";

import {
  Home,
  MessageCircle,
  History,
  CreditCard,
  Settings,
  LogOut,
  UserCog,
} from "lucide-react";
import { motion } from "motion/react";
import { SignedIn, SignedOut, useClerk, useUser } from "@clerk/nextjs";
import Link from "next/link";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/app/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";

interface NavProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

function AccountMenu() {
  const { signOut, openUserProfile } = useClerk();
  const { user } = useUser();

  const name = user?.fullName || user?.firstName || "Account";
  const email = user?.primaryEmailAddress?.emailAddress || "";
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 outline-none transition hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-violet-400"
          aria-label="Open account menu"
        >
          <Avatar className="h-[34px] w-[34px]">
            <AvatarImage src={user?.imageUrl} alt={name} />
            <AvatarFallback className="bg-gradient-to-br from-violet-600 to-teal-500 text-xs font-semibold text-white">
              {initials || "EM"}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={10}
        className="z-[100] w-[min(280px,calc(100vw-24px))] rounded-[var(--radius-auth-panel)] border border-[var(--surface-auth-border-strong)] bg-[var(--surface-auth-popover)] p-0 text-white shadow-2xl shadow-black/50"
      >
        <DropdownMenuLabel className="px-4 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={user?.imageUrl} alt={name} />
              <AvatarFallback className="bg-gradient-to-br from-violet-600 to-teal-500 text-xs font-semibold text-white">
                {initials || "EM"}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold leading-snug text-white">
                {name}
              </p>
              {email && (
                <p className="truncate text-xs font-normal leading-relaxed text-[#a0a0b0]">
                  {email}
                </p>
              )}
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="mx-0 bg-white/10" />
        <div className="p-2">
          <DropdownMenuItem
            className="cursor-pointer rounded-[10px] px-3 py-2.5 text-sm text-zinc-200 outline-none focus:bg-white/10 focus:text-white"
            onSelect={() => openUserProfile()}
          >
            <UserCog size={16} />
            Manage account
          </DropdownMenuItem>
          <DropdownMenuItem
            className="cursor-pointer rounded-[10px] px-3 py-2.5 text-sm text-zinc-300 outline-none focus:bg-red-500/10 focus:text-red-200"
            onSelect={() => {
              void signOut({ redirectUrl: "/sign-in" });
            }}
          >
            <LogOut size={16} />
            Sign out
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
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
          <div className="flex items-center gap-4 md:gap-6 lg:gap-8">
            <motion.div
              className="flex shrink-0 items-center gap-3"
              whileHover={{ scale: 1.03 }}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-teal-500">
                <MessageCircle size={20} className="text-white" />
              </div>
              <h2 className="text-lg font-semibold tracking-[-0.02em] text-white">
                EchoMind
              </h2>
            </motion.div>

          <div className="ml-auto flex min-w-0 items-center gap-1.5 md:gap-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentPage === item.id;
                return (
                  <motion.button
                    key={item.id}
                    onClick={() => onNavigate(item.id)}
                    className={`relative flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium transition-all md:px-4 lg:px-5 ${
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
                <div className="ml-auto flex items-center">
                  <AccountMenu />
                </div>
              </SignedIn>

              <SignedOut>
                <Link
                  href="/sign-in"
                  className="rounded-full bg-gradient-to-r from-violet-600 to-teal-500 px-6 py-2 text-sm font-medium text-white"
                >
                  Sign in
                </Link>
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
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-teal-500">
              <MessageCircle size={16} className="text-white" />
            </div>
            <h3 className="text-base font-semibold tracking-[-0.02em] text-white">
              EchoMind
            </h3>
          </div>

          <SignedIn>
            <div className="ml-auto flex items-center">
              <AccountMenu />
            </div>
          </SignedIn>

          <SignedOut>
            <Link
              href="/sign-in"
              className="ml-auto rounded-full bg-gradient-to-r from-violet-600 to-teal-500 px-5 py-2 text-sm font-medium text-white"
            >
              Sign in
            </Link>
          </SignedOut>
        </div>
      </header>
    </>
  );
}
