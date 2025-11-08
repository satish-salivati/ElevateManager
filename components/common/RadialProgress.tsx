import React from 'react';

interface RadialProgressProps {
  score: number;
}

const RadialProgress: React.FC<RadialProgressProps> = ({ score }) => {
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const getStrokeColor = () => {
    if (score >= 85) return 'stroke-green-500';
    if (score >= 60) return 'stroke-yellow-500';
    return 'stroke-red-500';
  };

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg className="w-32 h-32">
        <circle
          className="stroke-slate-200"
          strokeWidth="10"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx="64"
          cy="64"
        />
        <circle
          className={`transform -rotate-90 origin-center transition-all duration-500 ease-out ${getStrokeColor()}`}
          strokeWidth="10"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx="64"
          cy="64"
        />
      </svg>
      <span className="absolute text-3xl font-bold text-slate-800">{score}</span>
    </div>
  );
};

export default RadialProgress;
