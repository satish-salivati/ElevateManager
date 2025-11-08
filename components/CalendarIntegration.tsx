import React from 'react';
import { TeamMember } from '../types';
import Card from './common/Card';
import Button from './common/Button';

interface CalendarIntegrationProps {
    teamMembers: TeamMember[];
    onSelectMember: (memberId: string) => void;
}

// Mock data for upcoming calendar events
const mockCalendarEvents = [
    { teamMemberId: '1', time: 'Today at 2:00 PM' },
    { teamMemberId: '3', time: 'Tomorrow at 10:30 AM' },
];

const CalendarIntegration: React.FC<CalendarIntegrationProps> = ({ teamMembers, onSelectMember }) => {

    const upcomingMeetings = mockCalendarEvents.map(event => {
        const member = teamMembers.find(m => m.id === event.teamMemberId);
        if (!member) return null;
        return {
            ...event,
            name: member.name,
            role: member.role,
        };
    }).filter(Boolean);

    return (
        <Card>
            <div className="p-5">
                <h3 className="text-lg font-semibold text-slate-900 flex items-center">
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    From Your Calendar
                </h3>
                <p className="text-sm text-slate-500 mt-1">Your next scheduled 1-on-1s.</p>
            </div>
            <div className="px-5 pb-5 border-t border-slate-200 pt-4">
                {upcomingMeetings.length > 0 ? (
                    <ul className="space-y-4">
                        {upcomingMeetings.map(meeting => (
                            <li key={meeting!.teamMemberId} className="p-3 bg-slate-50 rounded-md border border-slate-200">
                                <p className="font-semibold text-sm text-slate-800">{meeting!.name}</p>
                                <p className="text-xs text-slate-500">{meeting!.role}</p>
                                <div className="mt-3 flex justify-between items-center">
                                    <span className="text-xs font-semibold text-brand-primary bg-brand-light px-2 py-1 rounded-md">{meeting!.time}</span>
                                    <Button onClick={() => onSelectMember(meeting!.teamMemberId)} size="sm" variant="secondary">
                                        Plan
                                    </Button>
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-sm text-slate-500 text-center py-4">No upcoming 1-on-1s found.</p>
                )}
            </div>
        </Card>
    );
};

export default CalendarIntegration;
