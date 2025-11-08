import React, { useState } from 'react';
import { ActionItem, ActionItemStatus } from '../types';
import Card from './common/Card';
import Button from './common/Button';

interface ActionItemsSectionProps {
  actionItems: ActionItem[];
  setActionItems: React.Dispatch<React.SetStateAction<ActionItem[]>>;
  carriedOverCount: number;
}

const statusOptions: ActionItemStatus[] = ['Pending', 'In Progress', 'Completed', 'Blocked'];

const statusStyles: Record<ActionItemStatus, { select: string, label: string }> = {
  'Pending': {
    select: 'bg-slate-100 text-slate-700 border-slate-300',
    label: 'text-slate-700'
  },
  'In Progress': {
    select: 'bg-blue-100 text-blue-800 border-blue-300',
    label: 'text-slate-700'
  },
  'Completed': {
    select: 'bg-green-100 text-green-800 border-green-300',
    label: 'text-slate-500 line-through'
  },
  'Blocked': {
    select: 'bg-red-100 text-red-800 border-red-300',
    label: 'text-red-700'
  },
};


const ActionItemsSection: React.FC<ActionItemsSectionProps> = ({ actionItems, setActionItems, carriedOverCount }) => {
  const [newItemText, setNewItemText] = useState('');
  const [newDueDate, setNewDueDate] = useState('');

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (newItemText.trim()) {
      const newItem: ActionItem = {
        id: crypto.randomUUID(),
        text: newItemText.trim(),
        status: 'Pending',
        dueDate: newDueDate || undefined,
        comments: '',
      };
      setActionItems([...actionItems, newItem]);
      setNewItemText('');
      setNewDueDate('');
    }
  };

  const updateItem = (id: string, updates: Partial<ActionItem>) => {
     setActionItems(prev => prev.map(item => item.id === id ? {...item, ...updates} : item));
  };
  
  const deleteItem = (id: string) => {
    setActionItems(actionItems.filter(item => item.id !== id));
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    const userTimezoneOffset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() + userTimezoneOffset).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <Card>
      <div className="p-6">
        <h3 className="text-lg font-semibold text-slate-900">Action Items</h3>
        {carriedOverCount > 0 && (
          <p className="text-xs text-slate-500 mt-1">{carriedOverCount} item(s) carried over from last meeting.</p>
        )}
      </div>
      <div className="px-6 pb-6 space-y-4">
        <ul className="space-y-4">
          {actionItems.map((item, index) => (
            <li key={item.id} className="p-3 bg-slate-50 rounded-md border border-slate-200 group">
              <div className="flex items-start justify-between">
                <div className="flex-1 flex items-start gap-3">
                   <select
                      value={item.status}
                      onChange={(e) => updateItem(item.id, { status: e.target.value as ActionItemStatus })}
                      className={`text-xs font-medium rounded-full border px-2 py-0.5 focus:ring-2 focus:ring-brand-primary focus:outline-none transition-colors ${statusStyles[item.status].select}`}
                    >
                      {statusOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  <div>
                    <span className={`text-sm ${statusStyles[item.status].label}`}>
                      {item.text}
                    </span>
                    <div className="mt-1 space-x-2">
                      {item.dueDate && item.status !== 'Completed' && (
                        <span className="text-xs font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full inline-flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {formatDate(item.dueDate)}
                        </span>
                      )}
                      {index < carriedOverCount && item.status !== 'Completed' && (
                        <span className="text-xs font-medium bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                          Carried Over
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <button onClick={() => deleteItem(item.id)} className="ml-2 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                   </svg>
                </button>
              </div>
              <div className="mt-2">
                <textarea
                    value={item.comments || ''}
                    onChange={(e) => updateItem(item.id, { comments: e.target.value })}
                    placeholder="Add a comment..."
                    rows={1}
                    className="w-full p-1.5 text-xs border border-slate-200 rounded-md focus:ring-brand-primary focus:border-brand-primary resize-none"
                />
              </div>
            </li>
          ))}
          {actionItems.length === 0 && <p className="text-sm text-slate-500 text-center py-4">No action items yet.</p>}
        </ul>
        <form onSubmit={handleAddItem} className="flex flex-wrap gap-2 border-t border-slate-200 pt-4">
          <input
            type="text"
            value={newItemText}
            onChange={(e) => setNewItemText(e.target.value)}
            placeholder="Add new action item"
            className="flex-grow p-2 text-sm border border-slate-300 rounded-md focus:ring-brand-primary focus:border-brand-primary"
            style={{minWidth: '150px'}}
          />
          <input
            type="date"
            value={newDueDate}
            onChange={(e) => setNewDueDate(e.target.value)}
            className="p-2 text-sm border border-slate-300 rounded-md focus:ring-brand-primary focus:border-brand-primary"
          />
          <Button type="submit" size="sm" variant="secondary">+</Button>
        </form>
      </div>
    </Card>
  );
};

export default ActionItemsSection;