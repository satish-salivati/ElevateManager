import React, { useState } from 'react';
import { PreviousMeeting } from '../types';
import Card from './common/Card';

interface HistoricalContextProps {
  previousMeeting: PreviousMeeting;
}

const HistoricalContext: React.FC<HistoricalContextProps> = ({ previousMeeting }) => {
  const [isOpen, setIsOpen] = useState(false);

  const completedItems = previousMeeting.actionItems.filter(item => item.status === 'Completed');

  return (
    <Card className="bg-slate-50">
      <div className="p-4">
        <button onClick={() => setIsOpen(!isOpen)} className="w-full flex justify-between items-center text-left">
          <h3 className="font-semibold text-slate-800">Review Previous Meeting</h3>
          <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
        {isOpen && (
          <div className="mt-4 pt-4 border-t border-slate-200 space-y-4">
            <div>
              <h4 className="text-sm font-semibold text-slate-700">Last Meeting's Notes</h4>
              <p className="mt-1 text-sm text-slate-600 p-3 bg-white rounded-md border border-slate-200 whitespace-pre-wrap">{previousMeeting.notes || 'No notes were taken.'}</p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-700">Completed Action Items from Last Session</h4>
              <ul className="mt-1 text-sm text-slate-600 list-disc list-inside">
                {completedItems.length > 0 ? (
                  completedItems.map(item => <li key={item.id}>{item.text}</li>)
                ) : (
                  <li>No action items were marked as completed in the last session.</li>
                )}
              </ul>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default HistoricalContext;
