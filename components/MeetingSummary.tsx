import React from 'react';
import { MeetingSummaryData, ActionItemStatus } from '../types';
import Card from './common/Card';
import Button from './common/Button';
import RadialProgress from './common/RadialProgress';

interface MeetingSummaryProps {
  summaryData: MeetingSummaryData;
  onStartNew: () => void;
}

const statusStyles: Record<ActionItemStatus, string> = {
  'Pending': 'bg-slate-100 text-slate-700',
  'In Progress': 'bg-blue-100 text-blue-800',
  'Completed': 'bg-green-100 text-green-800',
  'Blocked': 'bg-red-100 text-red-800',
};

const MeetingSummary: React.FC<MeetingSummaryProps> = ({ summaryData, onStartNew }) => {
  const { summary, actionItems } = summaryData;

  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    const userTimezoneOffset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() + userTimezoneOffset).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleCopy = () => {
    let textToCopy = "Meeting Summary:\n\n";
    textToCopy += `Impact Score: ${summary.impactScore}/100\n`;
    textToCopy += `Reasoning: ${summary.reasoning}\n\n`;
    textToCopy += "Key Discussion Points:\n";
    textToCopy += summary.keyPoints.map(p => `- ${p}`).join('\n') + '\n\n';
    textToCopy += "Decisions Made:\n";
    textToCopy += (summary.decisions.length > 0 ? summary.decisions.map(d => `- ${d}`).join('\n') : 'None') + '\n\n';
    textToCopy += `Overall Sentiment: ${summary.sentiment}\n\n`;
    textToCopy += "Action Items:\n";
    textToCopy += actionItems.map(item => `- [${item.status}] ${item.text}${item.dueDate ? ` (Due: ${formatDate(item.dueDate)})` : ''}${item.comments ? `\n  - Comment: ${item.comments}` : ''}`).join('\n');
    navigator.clipboard.writeText(textToCopy);
    // Add a visual indicator for copy success if desired
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-slate-900">Meeting Summary</h2>
        <p className="mt-2 text-slate-600">Here's a recap of your conversation and the next steps.</p>
      </div>
      
      <Card>
        <div className="p-8 flex flex-col md:flex-row items-center justify-center md:justify-start gap-6 md:gap-8 bg-slate-50">
            <RadialProgress score={summary.impactScore} />
            <div className="text-center md:text-left">
                <h3 className="text-xl font-bold text-slate-900">Meeting Impact Score</h3>
                <p className="mt-1 text-sm text-slate-600 max-w-sm">{summary.reasoning}</p>
            </div>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <h4 className="font-semibold text-slate-800">Key Discussion Points</h4>
            <ul className="mt-2 list-disc list-inside space-y-1 text-sm text-slate-700">
              {summary.keyPoints.map((point, index) => <li key={index}>{point}</li>)}
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-slate-800">Decisions Made</h4>
            {summary.decisions.length > 0 ? (
                <ul className="mt-2 list-disc list-inside space-y-1 text-sm text-slate-700">
                {summary.decisions.map((decision, index) => <li key={index}>{decision}</li>)}
                </ul>
            ) : (
                <p className="mt-2 text-sm text-slate-500">No specific decisions were logged.</p>
            )}
          </div>
           <div>
            <h4 className="font-semibold text-slate-800">Overall Sentiment</h4>
            <p className="mt-2 text-sm text-slate-700">{summary.sentiment}</p>
          </div>
        </div>
      </Card>

      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-slate-900">Final Action Items</h3>
        </div>
        <div className="p-6 border-t border-slate-200">
          <ul className="space-y-4">
            {actionItems.map((item) => (
              <li key={item.id} className="flex flex-col">
                 <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-3">
                        <span className={`text-xs font-medium rounded-full px-2.5 py-1 ${statusStyles[item.status]}`}>
                        {item.status}
                        </span>
                        <span className={`text-sm ${item.status === 'Completed' ? 'text-slate-500 line-through' : 'text-slate-700'}`}>{item.text}</span>
                    </div>
                    {item.dueDate && (
                    <span className="text-xs font-medium bg-slate-100 text-slate-600 px-2 py-1 rounded-full inline-flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Due: {formatDate(item.dueDate)}
                    </span>
                    )}
                 </div>
                 {item.comments && (
                     <div className="mt-2 pl-6">
                        <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded-md border border-slate-200">
                            <span className="font-semibold">Comment:</span> {item.comments}
                        </p>
                     </div>
                 )}
              </li>
            ))}
            {actionItems.length === 0 && <p className="text-sm text-slate-500">No action items were created.</p>}
          </ul>
        </div>
      </Card>
      
      <div className="flex justify-center space-x-4 pt-4">
        <Button onClick={handleCopy} variant="secondary">Copy Summary</Button>
        <Button onClick={onStartNew}>Back to Dashboard</Button>
      </div>
    </div>
  );
};

export default MeetingSummary;