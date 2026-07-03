'use client';

import { Clock } from 'lucide-react';

interface MinutesDisplayProps {
  minutesRemaining: number;
  isPremium: boolean;
}

export function MinutesDisplay({ minutesRemaining, isPremium }: MinutesDisplayProps) {
  return (
    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-violet-600/20 to-teal-600/20 border border-violet-500/30">
      <Clock className="text-violet-400" size={18} />
      <span className="text-sm font-medium text-gray-200">
        {minutesRemaining} min remaining
      </span>
      {isPremium && (
        <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">
          Premium
        </span>
      )}
    </div>
  );
}
