import React from 'react';
import { TeamMember } from '../types';
import Card from './common/Card';

interface TeamSkillsInsightProps {
  teamMembers: TeamMember[];
}

const getTopItems = (teamMembers: TeamMember[], key: 'strengths' | 'challenges', count: number): string[] => {
    const allItems = teamMembers.flatMap(m => m.meetingHistory.flatMap(h => h[key]));
    
    if (allItems.length === 0) return [];

    const itemCounts = allItems.reduce((acc, item) => {
        acc[item] = (acc[item] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    return Object.entries(itemCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, count)
        .map(([item]) => item);
};


const TeamSkillsInsight: React.FC<TeamSkillsInsightProps> = ({ teamMembers }) => {
    const topStrengths = getTopItems(teamMembers, 'strengths', 5);
    const topChallenges = getTopItems(teamMembers, 'challenges', 5);
    
  return (
    <Card>
      <div className="p-6">
        <h3 className="text-lg font-bold text-slate-900">Team Skills & Challenges</h3>
        <p className="text-sm text-slate-500 mt-1">Frequently discussed topics from your 1-on-1s.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 border-t border-slate-200">
        <div>
            <h4 className="font-semibold text-slate-800 flex items-center">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Top Strengths
            </h4>
            {topStrengths.length > 0 ? (
                <ul className="mt-3 space-y-2">
                    {topStrengths.map(strength => (
                        <li key={strength} className="text-sm text-slate-600 bg-slate-50 px-3 py-2 rounded-md">{strength}</li>
                    ))}
                </ul>
            ) : (
                <p className="mt-3 text-sm text-slate-500">No strengths data yet.</p>
            )}
        </div>
         <div>
            <h4 className="font-semibold text-slate-800 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
                Common Challenges
            </h4>
            {topChallenges.length > 0 ? (
                <ul className="mt-3 space-y-2">
                    {topChallenges.map(challenge => (
                        <li key={challenge} className="text-sm text-slate-600 bg-slate-50 px-3 py-2 rounded-md">{challenge}</li>
                    ))}
                </ul>
            ) : (
                <p className="mt-3 text-sm text-slate-500">No challenges data yet.</p>
            )}
        </div>
      </div>
    </Card>
  );
};

export default TeamSkillsInsight;
