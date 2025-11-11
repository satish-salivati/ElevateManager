import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Conversation } from '../types';
import { getManagerFeedbackPrompts } from '../services/geminiService';
import Card from './common/Card';
import Button from './common/Button';
import Spinner from './common/Spinner';
import { useSpeechRecognition } from './common/useSpeechRecognition';

interface FeedbackPhaseProps {
  onComplete: (conversations: Conversation[]) => void;
  isSummarizing: boolean;
}

const FeedbackPhase: React.FC<FeedbackPhaseProps> = ({ onComplete, isSummarizing }) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const { isListening, startListening, hasSupport } = useSpeechRecognition();
  const currentIndexRef = useRef(currentIndex);
  const responseSnapshotRef = useRef('');

  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  useEffect(() => {
    const fetchPrompts = async () => {
      setIsLoading(true);
      const prompts = await getManagerFeedbackPrompts();
      setConversations(prompts.map(p => ({ question: p, response: '', source: 'ai' })));
      setIsLoading(false);
    };
    fetchPrompts();
  }, []);

  const handleResponseChange = (index: number, response: string) => {
    const updatedConvos = [...conversations];
    updatedConvos[index].response = response;
    setConversations(updatedConvos);
  };
  
  const handleTranscriptUpdate = useCallback((transcript: string) => {
    const index = currentIndexRef.current;
    setConversations(currentConversations => {
      if (index >= 0 && index < currentConversations.length) {
        const updatedConvos = [...currentConversations];
        const prefix = responseSnapshotRef.current ? responseSnapshotRef.current + ' ' : '';
        updatedConvos[index] = { ...updatedConvos[index], response: prefix + transcript };
        return updatedConvos;
      }
      return currentConversations;
    });
  }, [setConversations]);

  const handleTranscribeClick = () => {
    if (!isListening) {
      const currentResponse = conversations[currentIndex]?.response || '';
      responseSnapshotRef.current = currentResponse.trim();
    }
    startListening(handleTranscriptUpdate);
  };

  const handleAddQuestion = () => {
    setConversations([
      ...conversations,
      { question: '', response: '', source: 'user' }
    ]);
    setCurrentIndex(conversations.length);
  };
  
  const handleQuestionChange = (index: number, question: string) => {
     const updatedConvos = [...conversations];
     if (updatedConvos[index].source === 'user') {
        updatedConvos[index].question = question;
        setConversations(updatedConvos);
     }
  }

  const canProceed = conversations.length === 0 || conversations[currentIndex]?.response.trim() !== '';

  const handleNext = () => {
    if (currentIndex < conversations.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      onComplete(conversations);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <div className="p-8 text-center flex flex-col items-center justify-center h-64">
          <Spinner />
          <p className="mt-4 text-slate-600">Generating feedback questions...</p>
        </div>
      </Card>
    );
  }

  const currentConvo = conversations[currentIndex];

  return (
    <Card>
      <div className="p-8 text-center bg-indigo-50 border-b border-indigo-200">
        <h2 className="text-2xl font-bold text-slate-900">Feedback for You</h2>
        <p className="mt-2 text-slate-600">
          Create psychological safety by actively asking for feedback on your own performance.
        </p>
      </div>
      <div className="p-8">
        {currentConvo && (
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Feedback Question {currentIndex + 1} of {conversations.length}
            </label>
            {currentConvo.source === 'user' ? (
                <input
                    type="text"
                    value={currentConvo.question}
                    onChange={(e) => handleQuestionChange(currentIndex, e.target.value)}
                    placeholder="Type your custom question here..."
                    className="mt-2 text-lg font-semibold w-full p-2 border border-slate-300 rounded-md"
                />
            ) : (
                <p className="mt-2 text-lg font-semibold text-slate-800 p-2">{currentConvo.question}</p>
            )}
            <div className="relative">
              <textarea
                value={currentConvo.response}
                onChange={(e) => handleResponseChange(currentIndex, e.target.value)}
                placeholder="Capture the employee's feedback here..."
                className="mt-4 w-full h-32 p-3 border border-slate-300 rounded-md focus:ring-brand-primary focus:border-brand-primary text-sm"
              />
               {hasSupport && (
                <button
                    type="button"
                    onClick={handleTranscribeClick}
                    className={`absolute bottom-3 right-3 inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md border transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-brand-primary ${isListening ? 'bg-red-100 text-red-700 border-red-300 animate-pulse' : 'bg-white hover:bg-slate-100 text-slate-600 border-slate-300'}`}
                    title={isListening ? 'Stop Listening' : 'Transcribe Response'}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M7 4a3 3 0 016 0v6a3 3 0 11-6 0V4z" />
                        <path fillRule="evenodd" d="M7 3a1 1 0 000 2v4a1 1 0 102 0V5a1 1 0 00-2 0zM6.343 11.657A5 5 0 0015 8V7a1 1 0 10-2 0v1a3 3 0 11-6 0V7a1 1 0 10-2 0v1a5 5 0 004.343 4.657zM12 14a1 1 0 100-2h-2a1 1 0 100 2h2z" clipRule="evenodd" />
                    </svg>
                    <span>{isListening ? 'Listening...' : 'Transcribe'}</span>
                </button>
              )}
            </div>
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-slate-200 flex justify-between items-center">
          <div>
            {conversations.length < 3 && (
                <Button onClick={handleAddQuestion} variant="secondary" size="sm">
                + Add Custom Question
                </Button>
            )}
          </div>
          <div className="flex items-center space-x-4">
            {currentIndex > 0 && (
              <Button onClick={() => setCurrentIndex(currentIndex - 1)} variant="secondary">
                Previous
              </Button>
            )}
            <Button onClick={handleNext} disabled={!canProceed || isSummarizing} size="lg">
              {isSummarizing 
                ? 'Summarizing...' 
                : (currentIndex === conversations.length - 1 ? 'End & Summarize Meeting' : 'Next Question')}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default FeedbackPhase;
