'use client';

import { Sparkles } from 'lucide-react';
import { useState } from 'react';

interface IntentionInputProps {
  onSubmit: (intention: string) => void;
  disabled?: boolean;
}

export function IntentionInput({ onSubmit, disabled }: IntentionInputProps) {
  const [intention, setIntention] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (intention.trim()) {
      onSubmit(intention.trim());
    }
  };

  return (
    <div className="w-full">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="text-violet-400" size={20} />
        <h3 className="text-lg font-semibold text-gray-200">
          What would you like to focus on today?
        </h3>
      </div>
      <form onSubmit={handleSubmit} className="mt-3">
        <input
          type="text"
          value={intention}
          onChange={(e) => setIntention(e.target.value)}
          placeholder="e.g., Feeling anxious about work, Want to process my day, etc."
          disabled={disabled}
          className="w-full px-4 py-3 rounded-xl bg-gray-800/50 border border-violet-500/30 text-gray-200 placeholder-gray-500 focus:outline-none focus:border-violet-400/50 focus:ring-2 focus:ring-violet-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <button
          type="submit"
          disabled={!intention.trim() || disabled}
          className="mt-3 px-6 py-2 rounded-lg bg-gradient-to-r from-violet-600 to-teal-500 text-white font-medium hover:from-violet-500 hover:to-teal-400 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Set Intention
        </button>
      </form>
    </div>
  );
}
