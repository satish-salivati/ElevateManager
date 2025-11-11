import React, { useState, useRef, useEffect, useCallback } from 'react';
import { AgendaItem } from '../types';
import Card from './common/Card';
import { useSpeechRecognition } from './common/useSpeechRecognition';

interface AgendaWithNotesProps {
  agenda: AgendaItem[];
  setAgenda: React.Dispatch<React.SetStateAction<AgendaItem[]>>;
  employeeName: string;
}

const AgendaWithNotes: React.FC<AgendaWithNotesProps> = ({ agenda, setAgenda, employeeName }) => {
  const { isListening, startListening, stopListening, hasSupport } = useSpeechRecognition();
  const [activeTranscriptionTarget, setActiveTranscriptionTarget] = useState<string | null>(null);
  const activeTargetRef = useRef<string | null>(null);
  const noteSnapshotRef = useRef(''); // Stores text before transcription starts

  useEffect(() => {
    if (!isListening) {
      setActiveTranscriptionTarget(null);
    }
  }, [isListening]);


  const toggleItem = (id: string) => {
    setAgenda(
      agenda.map((item) =>
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    );
  };
  
  const handleNoteChange = (id: string, newNote: string) => {
    setAgenda(
      agenda.map((item) =>
        item.id === id ? { ...item, notes: newNote } : item
      )
    );
  }

  const handleAddItem = () => {
      const newItem: AgendaItem = {
        id: crypto.randomUUID(),
        text: "New talking point...",
        completed: false,
        source: 'user', // 'user' represents the manager
        notes: '',
      };
      setAgenda([...agenda, newItem]);
  };
  
  const handleTranscriptUpdate = useCallback((transcript: string) => {
    const targetId = activeTargetRef.current;
    if (!targetId) return;

    setAgenda(prevAgenda => 
      prevAgenda.map(item => {
        if (item.id === targetId) {
          const prefix = noteSnapshotRef.current ? noteSnapshotRef.current + ' ' : '';
          return { ...item, notes: prefix + transcript };
        }
        return item;
      })
    );
  }, [setAgenda]);
  
  const handleTranscribeClick = (itemId: string, currentNotes: string) => {
    const isCurrentlyListeningToThis = isListening && activeTranscriptionTarget === itemId;
  
    // Always stop any active listening session first.
    if (isListening) {
      stopListening();
    }
  
    // If the button clicked was not the one actively listening, start a new session.
    if (!isCurrentlyListeningToThis) {
      activeTargetRef.current = itemId;
      setActiveTranscriptionTarget(itemId);
      noteSnapshotRef.current = currentNotes.trim();
      startListening(handleTranscriptUpdate);
    }
  };


  const ManagerIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-500" viewBox="0 0 20 20" fill="currentColor">
      <path d="M10 9a3 3 0 100-6 3 3 0 000 6zM6 8a2 2 0 11-4 0 2 2 0 014 0zM1.49 15.326a.78.78 0 01-.358-.442 3 3 0 014.308-3.516 6.484 6.484 0 00-1.905 3.959c-.023.222-.014.442.028.658a.78.78 0 01-.358.442zM20 8a2 2 0 11-4 0 2 2 0 014 0zM18.51 15.326a.78.78 0 00.358-.442c.042-.216.051-.436.028-.658a6.484 6.484 0 00-1.905-3.959 3 3 0 004.308 3.516.78.78 0 00.358.442z" />
    </svg>
  );

  const EmployeeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-500" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
    </svg>
  );

  const AiIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-brand-primary" viewBox="0 0 20 20" fill="currentColor">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  );

  const getSourceInfo = (source: AgendaItem['source']) => {
      switch(source) {
          case 'ai': return { icon: <AiIcon />, text: 'AI Suggestion' };
          case 'user': return { icon: <ManagerIcon />, text: 'Added by you' };
          case 'employee': return { icon: <EmployeeIcon />, text: `Added by ${employeeName}` };
          default: return { icon: null, text: ''};
      }
  }

  return (
    <Card>
      <div className="p-6">
        <h3 className="text-lg font-semibold text-slate-900">Agenda & Notes</h3>
        <p className="text-sm text-slate-500 mt-1">Discuss each point and capture notes before moving on.</p>
      </div>
      <div className="px-6 pb-6">
        <ul className="space-y-4">
          {agenda.map((item) => {
            const sourceInfo = getSourceInfo(item.source);
            const isListeningToThis = isListening && activeTranscriptionTarget === item.id;
            return (
                <li key={item.id} className="p-4 bg-slate-50 rounded-md border border-slate-200">
                <div className="flex items-start">
                    <input
                    type="checkbox"
                    id={`agenda-${item.id}`}
                    checked={item.completed}
                    onChange={() => toggleItem(item.id)}
                    className="h-5 w-5 rounded border-slate-300 text-brand-primary focus:ring-brand-primary mt-0.5 cursor-pointer"
                    />
                    <div className="ml-3 flex-1">
                    <label
                        htmlFor={`agenda-${item.id}`}
                        className={`text-sm font-medium ${
                        item.completed ? 'text-slate-500 line-through' : 'text-slate-800'
                        } cursor-pointer`}
                    >
                        {item.text}
                    </label>
                    <div className="flex items-center mt-1 text-xs text-slate-500 gap-1">
                        {sourceInfo.icon}
                        <span>{sourceInfo.text}</span>
                    </div>
                    </div>
                </div>
                <div className="mt-3 pl-8">
                    <textarea
                    value={item.notes}
                    onChange={(e) => handleNoteChange(item.id, e.target.value)}
                    placeholder="Add notes for this topic..."
                    className="w-full p-2 text-sm border border-slate-300 rounded-md focus:ring-brand-primary focus:border-brand-primary resize-y"
                    rows={2}
                    />
                    {hasSupport && (
                        <div className="text-right mt-2">
                            <button
                                type="button"
                                onClick={() => handleTranscribeClick(item.id, item.notes || '')}
                                className={`inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md border transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-brand-primary ${isListeningToThis ? 'bg-red-100 text-red-700 border-red-300 animate-pulse' : 'bg-white hover:bg-slate-100 text-slate-600 border-slate-300'}`}
                                title={isListeningToThis ? 'Stop Listening' : 'Transcribe Response'}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M7 4a3 3 0 016 0v6a3 3 0 11-6 0V4z" />
                                    <path fillRule="evenodd" d="M7 3a1 1 0 000 2v4a1 1 0 102 0V5a1 1 0 00-2 0zM6.343 11.657A5 5 0 0015 8V7a1 1 0 10-2 0v1a3 3 0 11-6 0V7a1 1 0 10-2 0v1a5 5 0 004.343 4.657zM12 14a1 1 0 100-2h-2a1 1 0 100 2h2z" clipRule="evenodd" />
                                </svg>
                                <span>{isListeningToThis ? 'Listening...' : 'Transcribe'}</span>
                            </button>
                        </div>
                    )}
                </div>
                </li>
            );
          })}
        </ul>
        <div className="mt-6 pt-4 border-t border-slate-200">
           <button onClick={handleAddItem} className="text-sm font-medium text-brand-primary hover:text-brand-dark">
                + Add a talking point
           </button>
        </div>
      </div>
    </Card>
  );
};

export default AgendaWithNotes;
