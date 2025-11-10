import React, { useState, useEffect, useRef } from 'react';
import { MeetingDetails, AgendaItem, ActionItem, PreviousMeeting, MeetingRecord, Conversation } from '../types';
import ActionItemsSection from './ActionItemsSection';
import HistoricalContext from './HistoricalContext';
import Button from './common/Button';
import InsightsDashboard from './InsightsDashboard';
import AgendaWithNotes from './AgendaWithNotes';
import CoachingPhase from './CoachingPhase';
import FeedbackPhase from './FeedbackPhase';

interface MeetingWorkspaceProps {
  meetingDetails: MeetingDetails;
  initialAgenda: AgendaItem[];
  actionItems: ActionItem[];
  setActionItems: React.Dispatch<React.SetStateAction<ActionItem[]>>;
  onEndMeeting: (agenda: AgendaItem[], actionItems: ActionItem[], coachingData: Conversation[], feedbackData: Conversation[]) => Promise<void>;
  previousMeeting: PreviousMeeting | null;
  meetingHistory: MeetingRecord[];
}

type MeetingPhase = 'agenda' | 'coaching' | 'feedback';

const statusColors: Record<MeetingDetails['projectStatus'], string> = {
  '': 'bg-slate-100 text-slate-800',
  'On Track': 'bg-green-100 text-green-800',
  'At Risk': 'bg-yellow-100 text-yellow-800',
  'Off Track': 'bg-red-100 text-red-800',
  'Blocked': 'bg-red-200 text-red-900 font-bold',
  'On Hold': 'bg-gray-100 text-gray-800',
};

const MeetingWorkspace: React.FC<MeetingWorkspaceProps> = (props) => {
  const { 
    meetingDetails, 
    initialAgenda,
    actionItems, 
    setActionItems, 
    onEndMeeting,
    previousMeeting,
    meetingHistory,
  } = props;

  const [agenda, setAgenda] = useState<AgendaItem[]>(initialAgenda);
  const [phase, setPhase] = useState<MeetingPhase>('agenda');
  const [coachingConvos, setCoachingConvos] = useState<Conversation[]>([]);
  const [isSummarizing, setIsSummarizing] = useState(false);
  
  const coachingConvosRef = useRef<Conversation[]>([]);

  useEffect(() => {
    setAgenda(initialAgenda);
  }, [initialAgenda]);

  const carriedOverItems = previousMeeting?.actionItems.filter(item => item.status !== 'Completed') || [];

  const handleCoachingComplete = (conversations: Conversation[]) => {
    setCoachingConvos(conversations);
    coachingConvosRef.current = conversations;
    setPhase('feedback');
  };

  const handleFeedbackComplete = async (conversations: Conversation[]) => {
    setIsSummarizing(true);
    try {
      await onEndMeeting(agenda, actionItems, coachingConvosRef.current, conversations);
    } catch (error) {
      console.error("Summarization failed in workspace component:", error);
      // Error is handled globally in App.tsx, but we need to stop the local loading indicator
      setIsSummarizing(false);
    }
    // On success, no need to set isSummarizing to false because the component will unmount.
  }

  const renderAgendaPhase = () => (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <AgendaWithNotes agenda={agenda} setAgenda={setAgenda} employeeName={meetingDetails.employeeName} />
        </div>
        <div className="space-y-8">
          <ActionItemsSection 
            actionItems={actionItems} 
            setActionItems={setActionItems}
            carriedOverCount={carriedOverItems.length}
          />
        </div>
      </div>
      <div className="mt-8 pt-6 border-t border-slate-200 flex justify-end">
        <Button onClick={() => setPhase('coaching')} size="lg">
          Proceed to Coaching & Feedback
        </Button>
      </div>
      <InsightsDashboard meetingHistory={meetingHistory} employeeName={meetingDetails.employeeName} />
    </>
  );

  return (
    <div className="space-y-8">
      <div className="bg-white p-6 rounded-lg shadow-md border border-slate-200">
        <h2 className="text-xl font-bold text-slate-900">1-on-1 with {meetingDetails.employeeName}</h2>
        <div className="mt-2 text-sm text-slate-600 space-y-2">
          <p><span className="font-semibold">Role:</span> {meetingDetails.role}</p>
          <p><span className="font-semibold">This Week's Focus:</span> {meetingDetails.goal}</p>
          {meetingDetails.projectStatus && (
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="font-semibold">Project Status:</span>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[meetingDetails.projectStatus]}`}>
                  {meetingDetails.projectStatus}
                </span>
              </div>
              <p><span className="font-semibold">Criticality:</span> {meetingDetails.projectCriticality}</p>
            </div>
          )}
        </div>
      </div>
      
      {previousMeeting && <HistoricalContext previousMeeting={previousMeeting} />}

      {phase === 'agenda' && renderAgendaPhase()}
      
      {phase === 'coaching' && (
        <CoachingPhase
          meetingDetails={meetingDetails}
          onComplete={handleCoachingComplete}
        />
      )}

      {phase === 'feedback' && (
        <FeedbackPhase
          onComplete={handleFeedbackComplete}
          isSummarizing={isSummarizing}
        />
      )}
    </div>
  );
};

export default MeetingWorkspace;
