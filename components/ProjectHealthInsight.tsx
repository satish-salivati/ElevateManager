import React from 'react';
import { TeamMember } from '../types';
import Card from './common/Card';

interface ProjectHealthInsightProps {
  teamMembers: TeamMember[];
}

const statusStyles: Record<string, string> = {
    'At Risk': 'bg-yellow-100 text-yellow-800',
    'Blocked': 'bg-red-100 text-red-800',
}

const ProjectHealthInsight: React.FC<ProjectHealthInsightProps> = ({ teamMembers }) => {
    const unhealthyProjects = teamMembers.map(member => ({
        ...member,
        latestStatus: member.meetingHistory[member.meetingHistory.length -1]?.projectStatus
    })).filter(member => member.latestStatus === 'At Risk' || member.latestStatus === 'Blocked');
    
  return (
    <Card className="h-full">
      <div className="p-6">
        <h3 className="text-lg font-bold text-slate-900">Project Health</h3>
         <p className="text-sm text-slate-500 mt-1">Projects needing attention.</p>
      </div>
      <div className="p-6 border-t border-slate-200">
        {unhealthyProjects.length > 0 ? (
            <ul className="space-y-3">
                {unhealthyProjects.map(member => (
                    <li key={member.id} className="flex items-center justify-between">
                        <div>
                            <p className="font-semibold text-sm text-slate-800">{member.name}</p>
                            <p className="text-xs text-slate-500">{member.role}</p>
                        </div>
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusStyles[member.latestStatus!]}`}>
                            {member.latestStatus}
                        </span>
                    </li>
                ))}
            </ul>
        ) : (
            <div className="text-center py-10">
                <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="mt-3 text-sm text-slate-500">All projects are on track.</p>
            </div>
        )}
      </div>
    </Card>
  );
};

export default ProjectHealthInsight;
