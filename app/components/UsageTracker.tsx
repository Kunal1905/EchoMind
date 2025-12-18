import { motion } from 'motion/react';

interface UsageTrackerProps {
  used: number;
  total: number;
  isPremium: boolean;
  label: string;
}

export function UsageTracker({ used, total, isPremium, label }: UsageTrackerProps) {
  const percentage = (used / total) * 100;
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  // Color based on usage
  const getColor = () => {
    if (isPremium) return 'from-yellow-400 to-amber-500';
    if (percentage > 80) return 'from-red-500 to-crimson-600';
    if (percentage > 50) return 'from-orange-400 to-orange-600';
    return 'from-violet-500 to-purple-600';
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-28 h-28">
        {/* Background ring */}
        <svg className="w-full h-full -rotate-90">
          <circle
            cx="56"
            cy="56"
            r="45"
            fill="none"
            stroke="rgba(139, 92, 246, 0.2)"
            strokeWidth="8"
          />
          
          {/* Progress ring */}
          <motion.circle
            cx="56"
            cy="56"
            r="45"
            fill="none"
            stroke="url(#usage-gradient)"
            strokeWidth="8"
            strokeLinecap="round"
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1, ease: 'easeInOut' }}
            style={{
              strokeDasharray: circumference
            }}
          />
          
          <defs>
            <linearGradient id="usage-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" className={`${getColor().split(' ')[0].replace('from-', '')}`} stopColor={isPremium ? '#fbbf24' : percentage > 80 ? '#ef4444' : '#8b5cf6'} />
              <stop offset="100%" className={`${getColor().split(' ')[1].replace('to-', '')}`} stopColor={isPremium ? '#f59e0b' : percentage > 80 ? '#dc2626' : '#a855f7'} />
            </linearGradient>
          </defs>
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.div
            className="text-2xl"
            animate={percentage > 80 && !isPremium ? { 
              scale: [1, 1.2, 1],
              color: ['#fff', '#ef4444', '#fff']
            } : {}}
            transition={{ duration: 1, repeat: Infinity }}
          >
            {used}/{total}
          </motion.div>
          <div className="text-xs text-gray-400 text-center px-2">{label}</div>
        </div>

        {/* Chain/Mercury effect when full */}
        {percentage >= 100 && !isPremium && (
          <motion.div
            className="absolute inset-0 rounded-full border-4 border-red-500"
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.5, 1, 0.5]
            }}
            transition={{ duration: 1, repeat: Infinity }}
          />
        )}

        {/* Premium mercury effect */}
        {isPremium && (
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{
              background: 'radial-gradient(circle, rgba(251, 191, 36, 0.3) 0%, transparent 70%)'
            }}
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.6, 0.3]
            }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        )}
      </div>

      {/* Status badge */}
      <div className={`px-3 py-1 rounded-full text-xs ${
        isPremium 
          ? 'bg-gradient-to-r from-yellow-500/20 to-amber-500/20 text-yellow-300 border border-yellow-500/30'
          : percentage >= 100
          ? 'bg-gradient-to-r from-red-500/20 to-crimson-600/20 text-red-300 border border-red-500/30'
          : 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
      }`}>
        {isPremium ? '∞ Premium' : percentage >= 100 ? 'Limit Reached' : `${(100 - percentage).toFixed(0)}% left`}
      </div>
    </div>
  );
}
