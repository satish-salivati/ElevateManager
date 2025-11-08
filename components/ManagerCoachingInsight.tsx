import React, { useState, useEffect } from 'react';
import { TeamMember } from '../types';
import Card from './common/Card';
import Spinner from './common/Spinner';
import { generateManagerInsights } from '../services/geminiService';

interface ManagerCoachingInsightProps {
  teamMembers: TeamMember[];
}

const ManagerCoachingInsight: React.FC<ManagerCoachingInsightProps> = ({ teamMembers }) => {
    const [insights, setInsights] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchInsights = async () => {
            setIsLoading(true);
            const result = await generateManagerInsights(teamMembers);
            setInsights(result);
            setIsLoading(false);
        };
        fetchInsights();
    }, [teamMembers]);


  return (
    <Card className="h-full">
      <div className="p-6">
        <h3 className="text-lg font-bold text-slate-900">Coaching for You</h3>
         <p className="text-sm text-slate-500 mt-1">AI-powered insights on your management patterns.</p>
      </div>
      <div className="p-6 border-t border-slate-200">
        {isLoading ? (
            <div className="flex justify-center items-center py-10">
                <Spinner />
            </div>
        ) : (
            <ul className="space-y-3">
                {insights.map((insight, index) => (
                    <li key={index} className="flex items-start gap-3 p-3 bg-indigo-50 rounded-md">
                        <div className="flex-shrink-0 pt-1">
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-brand-primary" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <p className="text-sm text-slate-700">{insight}</p>
                    </li>
                ))}
            </ul>
        )}
      </div>
    </Card>
  );
};

export default ManagerCoachingInsight;
