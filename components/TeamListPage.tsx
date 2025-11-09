import React, { useState } from 'react';
import { TeamMember, AppError } from '../types';
import Card from './common/Card';
import Button from './common/Button';
import SentimentSparkline from './SentimentSparkline';
import CalendarIntegration from './CalendarIntegration';
import AddEditMemberModal from './AddEditMemberModal';
import Spinner from './common/Spinner';
import FirestoreRulesError from './common/FirestoreRulesError';

interface TeamListPageProps {
  teamMembers: TeamMember[];
  isLoading: boolean;
  error: AppError | null;
  onSelectMember: (memberId: string) => void;
  onStartSimulation: (memberId: string) => void;
  onAddMember: (member: Omit<TeamMember, 'id' | 'userId' | 'previousMeeting' | 'meetingHistory' | 'organizationId'>) => Promise<void>;
  onUpdateMember: (member: TeamMember) => Promise<void>;
  onDeleteMember: (memberId: string) => void;
  onRetry: () => void;
}

const isOverdue = (dueDate?: string): boolean => {
  if (!dueDate) return false;
  const today = new Date();
  const due = new Date(dueDate);
  today.setHours(0, 0, 0, 0);
  return due < today;
};

const needsAttention = (member: TeamMember): boolean => {
    const openActionItems = member.previousMeeting?.actionItems.filter(item => item.status !== 'Completed') || [];
    const hasOverdue = openActionItems.some(item => isOverdue(item.dueDate));
    if(hasOverdue) return true;

    const lastMeetingDate = member.meetingHistory.length > 0 ? new Date(member.meetingHistory[0].date) : null; // History is sorted desc
    if (lastMeetingDate) {
        const today = new Date();
        const daysSinceLastMeeting = (today.getTime() - lastMeetingDate.getTime()) / (1000 * 3600 * 24);
        if (daysSinceLastMeeting > 14) return true; // Needs attention if it's been over 2 weeks
    } else {
        return true; // New members need attention
    }
    
    return false;
}

const TeamListPage: React.FC<TeamListPageProps> = (props) => {
  const { teamMembers, isLoading, error, onSelectMember, onStartSimulation, onAddMember, onUpdateMember, onDeleteMember, onRetry } = props;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [memberToEdit, setMemberToEdit] = useState<TeamMember | null>(null);

  const handleOpenAddModal = () => {
      setMemberToEdit(null);
      setIsModalOpen(true);
  };
  
  const handleOpenEditModal = (member: TeamMember) => {
      setMemberToEdit(member);
      setIsModalOpen(true);
  };

  const handleSaveMember = async (memberData: Omit<TeamMember, 'id' | 'userId' | 'previousMeeting' | 'meetingHistory' | 'organizationId'> | TeamMember) => {
    if ('id' in memberData) {
        await onUpdateMember(memberData as TeamMember);
    } else {
        await onAddMember(memberData as Omit<TeamMember, 'id' | 'userId' | 'previousMeeting' | 'meetingHistory' | 'organizationId'>);
    }
  };
  
  const renderContent = () => {
    if (isLoading) {
        return (
            <div className="text-center py-16 border-2 border-dashed border-slate-300 rounded-lg">
                <div className="flex justify-center">
                    <Spinner />
                </div>
                <h3 className="mt-4 text-lg font-medium text-slate-900">Loading Your Team</h3>
                <p className="mt-1 text-sm text-slate-500">Just a moment...</p>
            </div>
        );
    }

    if (error) {
        if (error.type === 'PROFILE_CREATION_FAILED') {
            return <FirestoreRulesError error={error} />;
        }

        // Fallback for other errors
        return (
            <div className="text-center py-16 border-2 border-dashed border-red-300 rounded-lg bg-red-50">
                <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="mt-2 text-lg font-medium text-red-900">Failed to Load Team Data</h3>
                <p className="mt-1 text-sm text-red-700">{error.message}</p>
                 <div className="mt-6">
                    <Button onClick={onRetry}>Retry</Button>
                </div>
            </div>
        );
    }

    if (teamMembers.length > 0) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {teamMembers.map(member => {
                    const openActionItems = member.previousMeeting?.actionItems.filter(item => item.status !== 'Completed') || [];
                    const overdueItemsCount = openActionItems.filter(item => isOverdue(item.dueDate)).length;
                    
                    return (
                    <Card key={member.id} className="flex flex-col hover:shadow-lg transition-shadow duration-200 group">
                        <div className="p-5 flex-grow">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h4 className="text-lg font-bold text-slate-800">{member.name}</h4>
                                    <p className="text-sm text-slate-500">{member.role}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    {needsAttention(member) && (
                                        <span className="text-xs font-semibold bg-amber-100 text-amber-800 px-2 py-1 rounded-full">Needs Attention</span>
                                    )}
                                     <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => handleOpenEditModal(member)} className="p-1 text-slate-500 hover:text-brand-primary">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L15.232 5.232z" /></svg>
                                        </button>
                                         <button onClick={() => onDeleteMember(member.id)} className="p-1 text-slate-500 hover:text-red-600">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-4 flex justify-between items-center text-sm">
                                <span className="text-slate-600">Overdue: <span className={`font-bold ${overdueItemsCount > 0 ? 'text-red-600' : 'text-slate-800'}`}>{overdueItemsCount}</span></span>
                                <span className="text-slate-600">Open: <span className="font-bold text-slate-800">{openActionItems.length}</span></span>
                                <div className="w-20 h-8 -mr-2">
                                <SentimentSparkline history={member.meetingHistory} />
                                </div>
                            </div>
                        </div>
                        <div className="p-3 bg-slate-50 border-t border-slate-200 flex gap-2">
                            <Button onClick={() => onStartSimulation(member.id)} fullWidth size="sm" variant="secondary">
                                Practice Convo
                            </Button>
                            <Button onClick={() => onSelectMember(member.id)} fullWidth size="sm">
                                Plan 1-on-1
                            </Button>
                        </div>
                    </Card>
                    )
                })}
            </div>
        );
    }

    return (
        <div className="text-center py-16 border-2 border-dashed border-slate-300 rounded-lg">
            <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21a6 6 0 00-9-5.197m0 0A5.995 5.995 0 0012 12a5.995 5.995 0 00-3-5.197M15 21a9 9 0 00-3-1.975 9 9 0 00-6 0" />
            </svg>
            <h3 className="mt-2 text-lg font-medium text-slate-900">Welcome to ElevateManager!</h3>
            <p className="mt-1 text-sm text-slate-500">You haven't added any team members yet.</p>
            <div className="mt-6">
                <Button onClick={handleOpenAddModal}>
                    Add Your First Team Member
                </Button>
            </div>
        </div>
    );
  }

  return (
    <>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
      <div className="lg:col-span-2 space-y-8">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-3xl font-bold text-slate-900">Start a 1-on-1</h2>
            <p className="mt-2 text-slate-600">Select a team member to review past items and plan your next meeting.</p>
          </div>
          <Button onClick={handleOpenAddModal}>+ Add Member</Button>
        </div>
        {renderContent()}
      </div>
      <div className="lg:col-span-1">
          <CalendarIntegration teamMembers={teamMembers} onSelectMember={onSelectMember} />
      </div>
    </div>

    <AddEditMemberModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveMember}
        memberToEdit={memberToEdit}
    />
    </>
  );
};

export default TeamListPage;
