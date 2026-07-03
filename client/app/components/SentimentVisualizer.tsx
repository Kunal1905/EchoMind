import { motion } from 'motion/react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface SentimentVisualizerProps {
  positive: number;
  neutral: number;
  negative: number;
  type?: 'pie' | 'gauge';
}

export function SentimentVisualizer({ 
  positive, 
  neutral, 
  negative,
  type = 'pie'
}: SentimentVisualizerProps) {
  const total = positive + neutral + negative;
  const data = [
    { name: 'Positive', value: positive, color: '#14b8a6' },
    { name: 'Neutral', value: neutral, color: '#8b5cf6' },
    { name: 'Negative', value: negative, color: '#ef4444' }
  ];

  const dominantSentiment = 
    positive > neutral && positive > negative ? 'positive' :
    negative > neutral && negative > positive ? 'negative' : 'neutral';

  const gaugeRotation = dominantSentiment === 'negative' ? -45 : 
                        dominantSentiment === 'positive' ? 45 : 0;

  if (type === 'gauge') {
    return (
      <div className="relative w-full h-32 flex items-center justify-center">
        {/* Gauge arc background */}
        <svg className="w-full h-full" viewBox="0 0 200 120">
          {/* Background arc */}
          <path
            d="M 30 100 A 70 70 0 0 1 170 100"
            fill="none"
            stroke="rgba(139, 92, 246, 0.2)"
            strokeWidth="12"
            strokeLinecap="round"
          />
          
          {/* Negative zone */}
          <path
            d="M 30 100 A 70 70 0 0 1 70 45"
            fill="none"
            stroke="#ef4444"
            strokeWidth="12"
            strokeLinecap="round"
            opacity="0.6"
          />
          
          {/* Neutral zone */}
          <path
            d="M 70 45 A 70 70 0 0 1 130 45"
            fill="none"
            stroke="#8b5cf6"
            strokeWidth="12"
            strokeLinecap="round"
            opacity="0.6"
          />
          
          {/* Positive zone */}
          <path
            d="M 130 45 A 70 70 0 0 1 170 100"
            fill="none"
            stroke="#14b8a6"
            strokeWidth="12"
            strokeLinecap="round"
            opacity="0.6"
          />
          
          {/* Needle */}
          <motion.g
            initial={{ rotate: 0 }}
            animate={{ rotate: gaugeRotation }}
            transition={{ type: 'spring', stiffness: 60, damping: 15 }}
            style={{ transformOrigin: '100px 100px' }}
          >
            <line
              x1="100"
              y1="100"
              x2="100"
              y2="45"
              stroke="white"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <circle cx="100" cy="100" r="6" fill="white" />
          </motion.g>
        </svg>

        {/* Labels */}
        <div className="absolute bottom-0 left-0 text-xs text-red-400">Negative</div>
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-xs text-violet-400">Neutral</div>
        <div className="absolute bottom-0 right-0 text-xs text-teal-400">Positive</div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-40">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={40}
            outerRadius={60}
            paddingAngle={5}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      
      {/* Center label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.div
          className="text-2xl capitalize"
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          {dominantSentiment}
        </motion.div>
        <div className="text-xs text-gray-400">{total} analyzed</div>
      </div>

      {/* Legend */}
      <div className="absolute -bottom-8 left-0 right-0 flex justify-center gap-4 text-xs">
        {data.map((item, index) => (
          <div key={index} className="flex items-center gap-1">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: item.color }}
            />
            <span className="text-gray-400">{item.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
