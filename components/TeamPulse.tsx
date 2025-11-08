import React from 'react';
import { TeamMember, MeetingRecord } from '../types';
import Card from './common/Card';

interface TeamPulseProps {
  teamMembers: TeamMember[];
}

const isOverdue = (dueDate?: string): boolean => {
  if (!dueDate) return false;
  const today = new Date();
  const due = new Date(dueDate);
  today.setHours(0, 0, 0, 0);
  return due < today;
};

const sentimentToValue = (sentiment: MeetingRecord['sentiment']): number => {
    switch (sentiment) {
        case 'Positive': return 1;
        case 'Neutral': return 0;
        case 'Needs Improvement': return -1;
        default: return 0;
    }
};

const TeamPulse: React.FC<TeamPulseProps> = ({ teamMembers }) => {
    const allActionItems = teamMembers.flatMap(m => m.previousMeeting?.actionItems || []);
    const totalOverdue = allActionItems.filter(item => item.status !== 'Completed' && isOverdue(item.dueDate)).length;

    const allHistory = teamMembers.flatMap(m => m.meetingHistory);
    const thisMonthMeetings = allHistory.filter(record => {
        const recordDate = new Date(record.date);
        const today = new Date();
        return recordDate.getMonth() === today.getMonth() && recordDate.getFullYear() === today.getFullYear();
    }).length;

    const recentSentimentScores = allHistory.slice(-10).map(h => sentimentToValue(h.sentiment));
    const sentimentTrend = recentSentimentScores.length > 0 ? recentSentimentScores.reduce((a, b) => a + b, 0) : 0;
    
    const SentimentIndicator = () => {
        if (sentimentTrend > 2) { // Strongly positive
            return <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>;
        }
        if (sentimentTrend < -2) { // Strongly negative
            return <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" /></svg>;
        }
        return <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>;
    };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
            <div className="p-5">
                <p className="text-sm font-medium text-slate-500">Meetings This Month</p>
                <p className="mt-1 text-3xl font-semibold text-slate-800">{thisMonthMeetings}</p>
            </div>
        </Card>
        <Card>
            <div className="p-5">
                <p className="text-sm font-medium text-slate-500">Team Sentiment Trend</p>
                <div className="mt-1 flex items-center gap-2">
                    <p className="text-3xl font-semibold text-slate-800">
                       {sentimentTrend > 0 ? 'Positive' : sentimentTrend < 0 ? 'Negative' : 'Neutral'}
                    </p>
                    <SentimentIndicator />
                </div>
            </div>
        </Card>
        <Card>
            <div className="p-5">
                <p className="text-sm font-medium text-slate-500">Total Overdue Tasks</p>
                <p className={`mt-1 text-3xl font-semibold ${totalOverdue > 0 ? 'text-red-600' : 'text-slate-800'}`}>
                    {totalOverdue}
                </p>
            </div>
        </Card>
    </div>
  );
};

export default TeamPulse;
