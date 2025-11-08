import React from 'react';
import { TeamMember } from '../types';
import Card from './common/Card';

interface DataExplorerProps {
  teamMembers: TeamMember[];
}

const DataExplorer: React.FC<DataExplorerProps> = ({ teamMembers }) => {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-slate-900">Data Explorer</h2>
        <p className="mt-2 text-slate-600">
          A read-only view of the raw JSON data for all team members stored in the database.
          This is useful for verifying data structure and integrity.
        </p>
      </div>

      <div className="space-y-4">
        {teamMembers.map(member => (
          <Card key={member.id}>
            <details className="p-4 group">
              <summary className="font-semibold text-slate-800 cursor-pointer flex justify-between items-center">
                <div>
                    {member.name} - <span className="text-sm font-normal text-slate-600">{member.role}</span>
                </div>
                <svg
                    className="w-5 h-5 text-slate-500 transition-transform duration-200 transform group-open:rotate-180"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                >
                    <path
                    fillRule="evenodd"
                    d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                    clipRule="evenodd"
                    />
                </svg>
              </summary>
              <div className="mt-4 pt-4 border-t border-slate-200">
                <pre className="bg-slate-800 text-white p-4 rounded-md text-xs overflow-x-auto">
                  <code>
                    {JSON.stringify(member, null, 2)}
                  </code>
                </pre>
              </div>
            </details>
          </Card>
        ))}
        {teamMembers.length === 0 && (
            <div className="text-center py-16 border-2 border-dashed border-slate-300 rounded-lg">
                <p className="text-slate-500">No team member data to display.</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default DataExplorer;
