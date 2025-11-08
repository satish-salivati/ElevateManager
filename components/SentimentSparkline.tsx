import React from 'react';
import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts';
import { MeetingRecord } from '../types';

interface SparklineProps {
  history: MeetingRecord[];
}

const sentimentToValue = (sentiment: MeetingRecord['sentiment']): number => {
    switch (sentiment) {
        case 'Positive': return 3;
        case 'Neutral': return 2;
        case 'Needs Improvement': return 1;
        default: return 0;
    }
};

const getStrokeColor = (data: { value: number }[]): string => {
    if (data.length < 2) return '#94a3b8'; // slate-400 for no trend
    const last = data[data.length - 1].value;
    const secondLast = data[data.length - 2].value;

    if (last > secondLast) return '#10b981'; // emerald-500 (trending up)
    if (last < secondLast) return '#ef4444'; // red-500 (trending down)
    return '#64748b'; // slate-500 (neutral)
};


const SentimentSparkline: React.FC<SparklineProps> = ({ history }) => {
  const chartData = history.slice(-5).map(record => ({ // Only use last 5 meetings for clarity
    name: record.date,
    value: sentimentToValue(record.sentiment),
  }));
  
  if (chartData.length < 2) {
      return <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">No trend</div>;
  }

  const strokeColor = getStrokeColor(chartData);

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={chartData}>
        <YAxis domain={[0.5, 3.5]} hide={true} />
        <Line 
            type="monotone" 
            dataKey="value" 
            stroke={strokeColor}
            strokeWidth={2} 
            dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default SentimentSparkline;
