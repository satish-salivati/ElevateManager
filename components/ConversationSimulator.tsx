import React, { useState, useRef, useEffect } from 'react';
import { TeamMember } from '../types';
import { simulateConversationResponse } from '../services/geminiService';
import Card from './common/Card';
import Button from './common/Button';
import Input from './common/Input';
import Spinner from './common/Spinner';

interface ConversationSimulatorProps {
  teamMember: TeamMember;
  onBack: () => void;
}

interface ChatMessage {
    type: 'user' | 'model';
    text: string;
}

const ConversationSimulator: React.FC<ConversationSimulatorProps> = ({ teamMember, onBack }) => {
    const [topic, setTopic] = useState('');
    const [hasStarted, setHasStarted] = useState(false);
    const [history, setHistory] = useState<ChatMessage[]>([]);
    const [userInput, setUserInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const chatEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [history]);

    const handleStart = () => {
        if (topic) {
            setHasStarted(true);
        }
    };

    const handleSend = async () => {
        if (!userInput.trim()) return;

        const newUserMessage: ChatMessage = { type: 'user', text: userInput };
        setHistory(prev => [...prev, newUserMessage]);
        setUserInput('');
        setIsLoading(true);

        const apiHistory = [...history, newUserMessage].reduce((acc, msg) => {
            if (msg.type === 'user') {
                acc.push({ user: msg.text, model: '' });
            } else if (acc.length > 0) {
                acc[acc.length - 1].model = msg.text;
            }
            return acc;
        }, [] as { user: string; model: string }[]);
        
        try {
            const response = await simulateConversationResponse(teamMember, topic, apiHistory);
            const newModelMessage: ChatMessage = { type: 'model', text: response };
            setHistory(prev => [...prev, newModelMessage]);
        } catch (error) {
            const errorMessage: ChatMessage = { type: 'model', text: "Sorry, I encountered an error. Please try again." };
            setHistory(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };
    
    if (!hasStarted) {
        return (
             <div className="max-w-xl mx-auto">
                <Card>
                    <div className="p-8 text-center">
                        <h2 className="text-2xl font-bold text-slate-900">Conversation Simulator</h2>
                        <p className="mt-2 text-slate-600">
                            Practice a tough conversation with an AI simulating <span className="font-semibold">{teamMember.name}</span>.
                        </p>
                    </div>
                    <div className="p-8 border-t border-slate-200 space-y-4">
                         <Input 
                            label="What is the topic of this conversation?"
                            id="topic"
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            placeholder="e.g., Addressing missed deadlines"
                            required
                        />
                        <Button onClick={handleStart} fullWidth disabled={!topic}>Start Simulation</Button>
                    </div>
                </Card>
            </div>
        )
    }

    return (
        <Card className="max-w-3xl mx-auto">
            <div className="p-4 border-b border-slate-200">
                <h3 className="font-semibold text-slate-800">Practice Conversation with {teamMember.name}</h3>
                <p className="text-sm text-slate-500">Topic: <span className="font-medium">{topic}</span></p>
            </div>
            <div className="p-4 h-96 overflow-y-auto bg-slate-50 space-y-4">
                {history.map((message, index) => (
                    <div key={index} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-lg px-4 py-2 rounded-lg ${message.type === 'user' ? 'bg-brand-primary text-white' : 'bg-white border border-slate-200 text-slate-800'}`}>
                            <p className="text-sm">{message.text}</p>
                        </div>
                    </div>
                ))}
                {isLoading && (
                     <div className="flex justify-start">
                        <div className="max-w-lg px-4 py-2 rounded-lg bg-white border border-slate-200 text-slate-800">
                           <Spinner small />
                        </div>
                    </div>
                )}
                 <div ref={chatEndRef} />
            </div>
            <div className="p-4 border-t border-slate-200">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSend()}
                        placeholder="Type your message..."
                        className="flex-grow p-2 text-sm border border-slate-300 rounded-md focus:ring-brand-primary focus:border-brand-primary"
                        disabled={isLoading}
                    />
                    <Button onClick={handleSend} disabled={isLoading}>Send</Button>
                </div>
            </div>
        </Card>
    )
};

export default ConversationSimulator;
