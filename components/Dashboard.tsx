import React from 'react';
import { TeamMember, AppError, Organization, AppUser } from '../types';
import TeamPulse from './TeamPulse';
import FocusAreasInsight from './FocusAreasInsight';
import ProjectHealthInsight from './ProjectHealthInsight';
import TeamSkillsInsight from './TeamSkillsInsight';
import ActionItemInsight from './ActionItemInsight';
import ManagerCoachingInsight from './ManagerCoachingInsight';
import Spinner from './common/Spinner';
import Button from './common/Button';
import FirestoreRulesError from './common/FirestoreRulesError';

interface AdminDashboardControlsProps {
    organizations: Organization[];
    selectedOrgId: string | null;
    onSelectOrg: (id: string) => void;
    managers: AppUser[];
    selectedManagerId: string | null;
    onSelectManager: (id: string) => void;
}

const AdminDashboardControls: React.FC<AdminDashboardControlsProps> = ({
    organizations,
    selectedOrgId,
    onSelectOrg,
    managers,
    selectedManagerId,
    onSelectManager,
}) => {
    return (
        <div className="p-4 bg-slate-100 rounded-lg border border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label htmlFor="org-select" className="block text-sm font-medium text-slate-700">Organization</label>
                <select 
                    id="org-select"
                    value={selectedOrgId || ''}
                    onChange={(e) => onSelectOrg(e.target.value)}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm rounded-md"
                >
                    <option value="" disabled>Select an organization</option>
                    {organizations.map(org => <option key={org.id} value={org.id}>{org.name}</option>)}
                </select>
            </div>
            <div>
                 <label htmlFor="manager-select" className="block text-sm font-medium text-slate-700">Manager</label>
                <select 
                    id="manager-select"
                    value={selectedManagerId || ''}
                    onChange={(e) => onSelectManager(e.target.value)}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm rounded-md"
                    disabled={!selectedOrgId || managers.length === 0}
                >
                    <option value="">All Managers</option>
                    {managers.map(manager => <option key={manager.uid} value={manager.uid}>{manager.email}</option>)}
                </select>
            </div>
        </div>
    )
}


interface DashboardProps {
  teamMembers: TeamMember[];
  error: AppError | null;
  onRetry: () => void;
  isLoading: boolean;
  isAdmin: boolean;
  // Admin props
  organizations?: Organization[];
  selectedOrgId?: string | null;
  onSelectOrg?: (id: string) => void;
  managers?: AppUser[];
  selectedManagerId?: string | null;
  onSelectManager?: (id: string) => void;
}

const Dashboard: React.FC<DashboardProps> = (props) => {
    const { 
        teamMembers, error, onRetry, isLoading, isAdmin,
        organizations = [], selectedOrgId = null, onSelectOrg = () => {},
        managers = [], selectedManagerId = null, onSelectManager = () => {}
    } = props;
    
    if (isLoading && teamMembers.length === 0) { // Only show full-page loader on initial load
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
        if (error.type === 'ADMIN_PERMISSIONS_REQUIRED' || error.type === 'ADMIN_INDEX_REQUIRED' || error.type === 'ADMIN_ORG_INDEX_REQUIRED') {
            return <FirestoreRulesError error={error} onRetry={onRetry} />;
        }
        return (
            <div className="text-center py-16 border-2 border-dashed border-red-300 rounded-lg bg-red-50">
                <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="mt-2 text-lg font-medium text-red-900">Failed to Load Dashboard</h3>
                <p className="mt-1 text-sm text-red-700 max-w-xl mx-auto">{error.message}</p>
                <div className="mt-6">
                    <Button onClick={onRetry}>Retry</Button>
                </div>
            </div>
        );
    }
    
    const getDashboardTitle = () => {
        if (!isAdmin) return "My Dashboard";
        if (selectedOrgId) {
            const orgName = organizations.find(o => o.id === selectedOrgId)?.name;
            if (selectedManagerId) {
                const managerName = managers.find(m => m.uid === selectedManagerId)?.email;
                return `${managerName}'s Dashboard (${orgName})`;
            }
            return `${orgName} Dashboard`;
        }
        return "Organization Dashboard";
    }

    const renderInsights = () => {
        if (isAdmin && !selectedOrgId) {
            return (
                <div className="text-center py-16 border-2 border-dashed border-slate-300 rounded-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                    <h3 className="mt-2 text-lg font-medium text-slate-900">Select an Organization</h3>
                    <p className="mt-1 text-sm text-slate-500">Choose an organization from the dropdown above to view its analytics.</p>
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
            <>
                <TeamPulse teamMembers={teamMembers} />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                    <ManagerCoachingInsight teamMembers={teamMembers} />
                    <ActionItemInsight teamMembers={teamMembers} />
                    <FocusAreasInsight teamMembers={teamMembers} />
                    <ProjectHealthInsight teamMembers={teamMembers} />
                    <TeamSkillsInsight teamMembers={teamMembers} />
                </div>
            </>
        )
    }

    return (
        <div className="space-y-8">
            {isAdmin && (
                <AdminDashboardControls 
                    organizations={organizations}
                    selectedOrgId={selectedOrgId}
                    onSelectOrg={onSelectOrg}
                    managers={managers}
                    selectedManagerId={selectedManagerId}
                    onSelectManager={onSelectManager}
                />
            )}
            <div>
                <h2 className="text-3xl font-bold text-slate-900">{getDashboardTitle()}</h2>
                <p className="mt-2 text-slate-600">Your team's pulse at a glance. Review trends and identify patterns.</p>
            </div>
            
            {renderInsights()}
        </div>
    );
};

export default Dashboard;
