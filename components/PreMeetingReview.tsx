import React, { useState } from 'react';
import { TeamMember, ActionItem, ActionItemStatus } from '../types';
import Card from './common/Card';
import Button from './common/Button';

interface PreMeetingReviewProps {
    teamMember: TeamMember;
    actionItems: ActionItem[];
    onComplete: (updatedActionItems: ActionItem[]) => void;
}

const statusOptions: ActionItemStatus[] = ['Pending', 'In Progress', 'Completed', 'Blocked'];

const statusStyles: Record<ActionItemStatus, string> = {
  'Pending': 'bg-slate-100 text-slate-700 border-slate-300',
  'In Progress': 'bg-blue-100 text-blue-800 border-blue-300',
  'Completed': 'bg-green-100 text-green-800 border-green-300',
  'Blocked': 'bg-red-100 text-red-800 border-red-300',
};

const PreMeetingReview: React.FC<PreMeetingReviewProps> = ({ teamMember, actionItems, onComplete }) => {
    const [internalItems, setInternalItems] = useState<ActionItem[]>(actionItems);

    const updateItem = (id: string, updates: Partial<ActionItem>) => {
        setInternalItems(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
    };

    const handleSubmit = () => {
        onComplete(internalItems);
    };

    const openItems = internalItems.filter(item => item.status !== 'Completed');

    return (
        <div className="max-w-3xl mx-auto">
            <Card>
                <div className="p-8 text-center">
                    <h2 className="text-2xl font-bold text-slate-900">Review Previous Action Items</h2>
                    <p className="mt-2 text-slate-600">
                        Before planning your next 1-on-1 with <span className="font-semibold">{teamMember.name}</span>, please update the status of these outstanding items.
                    </p>
                </div>

                <div className="p-8 border-t border-slate-200">
                    {openItems.length > 0 ? (
                        <ul className="space-y-6">
                            {openItems.map(item => (
                                <li key={item.id} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                                    <p className="font-semibold text-slate-800">{item.text}</p>
                                    <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                                        <div>
                                            <label htmlFor={`status-${item.id}`} className="block text-xs font-medium text-slate-600 mb-1">Status</label>
                                            <select
                                                id={`status-${item.id}`}
                                                value={item.status}
                                                onChange={(e) => updateItem(item.id, { status: e.target.value as ActionItemStatus })}
                                                className={`text-sm w-full font-medium rounded-md border px-3 py-2 focus:ring-2 focus:ring-brand-primary focus:outline-none transition-colors ${statusStyles[item.status]}`}
                                            >
                                                {statusOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                            </select>
                                        </div>
                                        <div className="md:col-span-2">
                                            <label htmlFor={`comments-${item.id}`} className="block text-xs font-medium text-slate-600 mb-1">Comments / Justification</label>
                                            <textarea
                                                id={`comments-${item.id}`}
                                                value={item.comments || ''}
                                                onChange={(e) => updateItem(item.id, { comments: e.target.value })}
                                                placeholder="Add context for 'In Progress' or 'Blocked'..."
                                                rows={2}
                                                className="w-full p-2 text-sm border border-slate-300 rounded-md focus:ring-brand-primary focus:border-brand-primary"
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor={`dueDate-${item.id}`} className="block text-xs font-medium text-slate-600 mb-1">Due Date</label>
                                            <input
                                                id={`dueDate-${item.id}`}
                                                type="date"
                                                value={item.dueDate || ''}
                                                onChange={(e) => updateItem(item.id, { dueDate: e.target.value })}
                                                className="w-full p-2 text-sm border border-slate-300 rounded-md focus:ring-brand-primary focus:border-brand-primary"
                                            />
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                         <p className="text-center text-slate-500 py-4">No open action items from the previous meeting. Ready to plan!</p>
                    )}
                     <Button onClick={handleSubmit} fullWidth className="mt-8">
                        Continue to Plan Meeting
                    </Button>
                </div>
            </Card>
        </div>
    );
};

export default PreMeetingReview;