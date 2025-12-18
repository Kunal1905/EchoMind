import React from 'react';
import { Home, MessageCircle, History, Star } from 'lucide-react';

interface NavigationProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export function Navigation({ currentPage, onNavigate }: NavigationProps) {
  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'chat', label: 'Echo', icon: MessageCircle },
    { id: 'history', label: 'History', icon: History },
    { id: 'sessions', label: 'Premium', icon: Star },
  ];

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden md:flex fixed top-0 left-0 right-0 z-50 px-6 py-4 bg-gradient-to-r from-violet-950/80 to-teal-950/80 backdrop-blur-lg border-b border-violet-500/30">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-600 to-teal-400 pulse-orb"></div>
            <h3 className="bg-gradient-to-r from-violet-400 to-teal-300 bg-clip-text text-transparent">
              EchoMind AI
            </h3>
          </div>
          <div className="flex gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`px-6 py-2 rounded-full transition-all glitch-hover ${
                    isActive
                      ? 'bg-gradient-to-r from-violet-600 to-teal-400 text-white shadow-lg shadow-violet-500/50'
                      : 'bg-violet-950/30 text-violet-200 hover:bg-violet-900/50'
                  }`}
                  aria-label={item.label}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <span className="flex items-center gap-2">
                    <Icon size={18} />
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-t from-violet-950/95 to-violet-900/95 backdrop-blur-lg border-t border-violet-500/30">
        <div className="grid grid-cols-4 gap-1 px-2 py-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`flex flex-col items-center gap-1 py-2 rounded-lg transition-all ${
                  isActive
                    ? 'text-teal-300'
                    : 'text-violet-300 hover:text-violet-100'
                }`}
                aria-label={item.label}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon size={22} className={isActive ? 'pulse-orb' : ''} />
                <span className="text-xs">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
