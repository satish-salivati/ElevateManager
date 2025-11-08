import React from 'react';
import { TeamMember, AppError } from '../types';
import TeamPulse from './TeamPulse';
import FocusAreasInsight from './FocusAreasInsight';
import ProjectHealthInsight from './ProjectHealthInsight';
import TeamSkillsInsight from './TeamSkillsInsight';
import ActionItemInsight from './ActionItemInsight';
import ManagerCoachingInsight from './ManagerCoachingInsight';
import Spinner from './common/Spinner';
import Button from './common/Button';

interface DashboardProps {
  teamMembers: TeamMember[];
  error: AppError | null;
  onRetry: () => void;
  isLoading: boolean;
}

const Dashboard: React.FC<DashboardProps> = ({ teamMembers, error, onRetry, isLoading }) => {
    if (isLoading) {
    return (
        <div className="text-center py-16">
            <div className="flex justify-center">
                <Spinner />
            </div>
            <h3 className="mt-4 text-lg font-medium text-slate-900">Loading Dashboard Data</h3>
            <p className="mt-1 text-sm text-slate-500">Just a moment...</p>
        </div>
    );
  }

  if (error) {
     return (
        <div className="text-center py-16 border-2 border-dashed border-red-300 rounded-lg bg-red-50">
            <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="mt-2 text-lg font-medium text-red-900">Failed to Load Dashboard</h3>
            <p className="mt-1 text-sm text-red-700 max-w-xl mx-auto">{error.message}</p>
            <div className="mt-6">
                <Button onClick={onRetry}>
                    Retry
                </Button>
            </div>
        </div>
    );
  }

  if (teamMembers.length === 0) {
      return (
         <div className="text-center py-16 border-2 border-dashed border-slate-300 rounded-lg">
            <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V7a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            <h3 className="mt-2 text-lg font-medium text-slate-900">No Data for Dashboard</h3>
            <p className="mt-1 text-sm text-slate-500">Once team members are added and meetings are completed, insights will appear here.</p>
        </div>
      )
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-slate-900">Dashboard Insights</h2>
        <p className="mt-2 text-slate-600">Your team's pulse at a glance. Review trends and identify patterns.</p>
      </div>

      <TeamPulse teamMembers={teamMembers} />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          <ManagerCoachingInsight teamMembers={teamMembers} />
          <ActionItemInsight teamMembers={teamMembers} />
          <FocusAreasInsight teamMembers={teamMembers} />
          <ProjectHealthInsight teamMembers={teamMembers} />
          <TeamSkillsInsight teamMembers={teamMembers} />
      </div>
    </div>
  );
};

export default Dashboard;
