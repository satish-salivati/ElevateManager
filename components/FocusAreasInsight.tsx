import React from 'react';
import { TeamMember } from '../types';
import Card from './common/Card';
import { ResponsiveContainer, PieChart, Pie, Cell, Legend, Tooltip } from 'recharts';

interface FocusAreasInsightProps {
  teamMembers: TeamMember[];
}

const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#3b82f6'];

const FocusAreasInsight: React.FC<FocusAreasInsightProps> = ({ teamMembers }) => {
  const allHistory = teamMembers.flatMap(m => m.meetingHistory);

  const focusCounts = allHistory.reduce((acc, record) => {
    const focus = record.focus || 'General Catch-up';
    acc[focus] = (acc[focus] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const chartData = Object.entries(focusCounts).map(([name, value]) => ({ name, value }));
  
  const totalMeetings = allHistory.length;

  return (
    <Card className="h-full">
      <div className="p-6">
        <h3 className="text-lg font-bold text-slate-900">Meeting Focus Areas</h3>
        <p className="text-sm text-slate-500 mt-1">Distribution of conversation types.</p>
      </div>
      <div className="p-6 border-t border-slate-200">
        {chartData.length > 0 ? (
          <div style={{ width: '100%', height: 250 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  innerRadius={50}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${((Number(value) / totalMeetings) * 100).toFixed(0)}%`} />
                <Legend iconSize={10} layout="vertical" verticalAlign="middle" align="right" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="text-center py-10">
            <p className="text-slate-500">No meeting history yet. Complete meetings to see focus trends.</p>
          </div>
        )}
      </div>
    </Card>
  );
};

export default FocusAreasInsight;