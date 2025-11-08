
import React from 'react';
import Card from './common/Card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { MeetingRecord } from '../types';

interface InsightsDashboardProps {
    meetingHistory: MeetingRecord[];
    employeeName: string;
}

const sentimentToValue = (sentiment: MeetingRecord['sentiment']): number => {
    switch (sentiment) {
        case 'Positive': return 3;
        case 'Neutral': return 2;
        case 'Needs Improvement': return 1;
        default: return 0;
    }
}

const formatSentimentYAxis = (value: number): string => {
    switch (value) {
        case 3: return 'Positive';
        case 2: return 'Neutral';
        case 1: return 'Needs Improvement';
        default: return '';
    }
}

const InsightsDashboard: React.FC<InsightsDashboardProps> = ({ meetingHistory, employeeName }) => {
    const chartData = meetingHistory.map(record => ({
        date: new Date(record.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        Sentiment: sentimentToValue(record.sentiment),
        'Impact Score': record.impactScore || 0,
    })).slice(-10); // Show last 10 meetings

    return (
        <div className="space-y-8">
            <Card>
            <div className="p-6">
                <h3 className="text-lg font-semibold text-slate-900">Trends for {employeeName}</h3>
                <p className="text-sm text-slate-500 mt-1">
                Track sentiment and meeting effectiveness over time.
                </p>
            </div>
            <div className="p-6 border-t border-slate-200">
                {chartData.length > 1 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div style={{ width: '100%', height: 300 }}>
                             <h4 className="text-center font-semibold text-sm text-slate-700 mb-2">Sentiment Over Time</h4>
                            <ResponsiveContainer>
                                <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="date" />
                                    <YAxis 
                                        domain={[0.5, 3.5]} 
                                        ticks={[1, 2, 3]} 
                                        tickFormatter={formatSentimentYAxis}
                                        width={120}
                                    />
                                    <Tooltip formatter={(value) => formatSentimentYAxis(value as number)} />
                                    <Line type="monotone" dataKey="Sentiment" stroke="#4f46e5" strokeWidth={2} activeDot={{ r: 8 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                         <div style={{ width: '100%', height: 300 }}>
                             <h4 className="text-center font-semibold text-sm text-slate-700 mb-2">Impact Score Over Time</h4>
                            <ResponsiveContainer>
                                <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="date" />
                                    <YAxis domain={[0, 100]} />
                                    <Tooltip />
                                    <Line type="monotone" dataKey="Impact Score" stroke="#10b981" strokeWidth={2} activeDot={{ r: 8 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-10">
                        <p className="text-slate-500">Not enough data yet. Complete more meetings to see trends.</p>
                    </div>
                )}
            </div>
            </Card>
        </div>
    );
};

export default InsightsDashboard;