import React, { useState } from 'react';
import { TeamMember, AppError, Organization, AppUser } from '../types';
import TeamListPage from './TeamListPage';
import Dashboard from './Dashboard';
import DataExplorer from './DataExplorer';

interface MainPageProps {
  teamMembers: TeamMember[];
  dashboardTeamMembers: TeamMember[];
  isAdmin: boolean;
  isLoading: boolean;
  error: AppError | null;
  onSelectMember: (memberId: string) => void;
  onStartSimulation: (memberId: string) => void;
  onAddMember: (member: Omit<TeamMember, 'id' | 'userId' | 'previousMeeting' | 'meetingHistory' | 'organizationId'>) => Promise<void>;
  onUpdateMember: (member: TeamMember) => Promise<void>;
  onDeleteMember: (memberId: string) => void;
  onRetry: () => void;
  // Admin props
  organizations: Organization[];
  selectedOrgId: string | null;
  onSelectOrg: (id: string) => void;
  managers: AppUser[];
  selectedManagerId: string | null;
  onSelectManager: (id: string) => void;
}

type ActiveTab = 'team' | 'dashboard' | 'explorer';

const MainPage: React.FC<MainPageProps> = (props) => {
  const { 
      teamMembers, 
      dashboardTeamMembers, 
      isAdmin, 
      isLoading,
      error,
      onSelectMember, 
      onStartSimulation, 
      onAddMember, 
      onUpdateMember, 
      onDeleteMember,
      onRetry,
      organizations,
      selectedOrgId,
      onSelectOrg,
      managers,
      selectedManagerId,
      onSelectManager,
    } = props;
  const [activeTab, setActiveTab] = useState<ActiveTab>(isAdmin ? 'dashboard' : 'team');

  const getTabClass = (tabName: ActiveTab) => {
    return activeTab === tabName
      ? 'border-brand-primary text-brand-primary'
      : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300';
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {!isAdmin && (
            <button
                onClick={() => setActiveTab('team')}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-lg ${getTabClass('team')}`}
            >
                My Team
            </button>
          )}
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-lg ${getTabClass('dashboard')}`}
          >
            {isAdmin ? 'Organization Dashboard' : 'My Dashboard'}
          </button>
           {isAdmin && (
            <button
              onClick={() => setActiveTab('explorer')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-lg ${getTabClass('explorer')}`}
            >
              Data Explorer
            </button>
           )}
        </nav>
      </div>

      <div>
        {activeTab === 'team' && !isAdmin && (
          <TeamListPage 
            teamMembers={teamMembers} 
            isLoading={isLoading}
            error={error}
            onSelectMember={onSelectMember} 
            onStartSimulation={onStartSimulation}
            onAddMember={onAddMember}
            onUpdateMember={onUpdateMember}
            onDeleteMember={onDeleteMember}
            onRetry={onRetry}
          />
        )}
        {activeTab === 'dashboard' && <Dashboard 
            teamMembers={dashboardTeamMembers}
            error={error}
            isLoading={isLoading}
            onRetry={onRetry}
            isAdmin={isAdmin}
            organizations={organizations}
            selectedOrgId={selectedOrgId}
            onSelectOrg={onSelectOrg}
            managers={managers}
            selectedManagerId={selectedManagerId}
            onSelectManager={onSelectManager}
            />}
        {activeTab === 'explorer' && isAdmin && <DataExplorer teamMembers={dashboardTeamMembers} />}
      </div>
    </div>
  );
};

export default MainPage;
