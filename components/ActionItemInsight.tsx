import React from 'react';
import { TeamMember } from '../types';
import Card from './common/Card';

interface ActionItemInsightProps {
  teamMembers: TeamMember[];
}

const isOverdue = (dueDate?: string): boolean => {
  if (!dueDate) return false;
  const today = new Date();
  const due = new Date(dueDate);
  today.setHours(0, 0, 0, 0);
  return due < today;
};

const ActionItemInsight: React.FC<ActionItemInsightProps> = ({ teamMembers }) => {
    const memberStats = teamMembers.map(member => {
        const openItems = member.previousMeeting?.actionItems.filter(item => item.status !== 'Completed') || [];
        const overdueCount = openItems.filter(item => isOverdue(item.dueDate)).length;
        return {
            id: member.id,
            name: member.name,
            role: member.role,
            openCount: openItems.length,
            overdueCount: overdueCount,
        };
    }).sort((a, b) => b.overdueCount - a.overdueCount || b.openCount - a.openCount);

  return (
    <Card className="h-full">
      <div className="p-6">
        <h3 className="text-lg font-bold text-slate-900">Action Item Health</h3>
         <p className="text-sm text-slate-500 mt-1">Team accountability at a glance.</p>
      </div>
      <div className="p-6 border-t border-slate-200">
        {memberStats.length > 0 ? (
            <ul className="space-y-4">
                {memberStats.map(member => (
                    <li key={member.id} className="flex items-center justify-between">
                        <div>
                            <p className="font-semibold text-sm text-slate-800">{member.name}</p>
                            <p className="text-xs text-slate-500">{member.role}</p>
                        </div>
                        <div className="text-right">
                             <p className="text-xs text-slate-500">
                                Overdue: <span className={`font-bold ${member.overdueCount > 0 ? 'text-red-600' : 'text-slate-800'}`}>{member.overdueCount}</span>
                             </p>
                             <p className="text-xs text-slate-500">
                                Open: <span className="font-bold text-slate-800">{member.openCount}</span>
                             </p>
                        </div>
                    </li>
                ))}
            </ul>
        ) : (
            <div className="text-center py-10">
                <p className="text-sm text-slate-500">No team members with action items.</p>
            </div>
        )}
      </div>
    </Card>
  );
};

export default ActionItemInsight;
