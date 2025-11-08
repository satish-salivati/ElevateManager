import React, { useState, useEffect } from 'react';
import { MeetingDetails, TeamMember } from '../types';
import Card from './common/Card';
import Button from './common/Button';
import Input from './common/Input';
import MultiSelectPills from './common/MultiSelectPills';

interface MeetingSetupProps {
  onStart: (details: MeetingDetails) => void;
  isLoading: boolean;
  error: string | null;
  teamMember: TeamMember | null;
}

const STRENGTH_OPTIONS = ["Problem-Solving", "Collaboration & Teamwork", "Communication", "Adaptability & Flexibility", "Leadership & Mentoring", "Initiative & Proactivity", "Technical Expertise", "Creativity & Innovation", "Time Management & Organization", "Other"];
const CHALLENGE_OPTIONS = ["Prioritization", "Time Management", "Delegation", "Managing Up", "Public Speaking / Presentations", "Conflict Resolution", "Building Confidence", "Strategic Thinking", "Giving & Receiving Feedback", "Other"];
const PROJECT_STATUS_OPTIONS = ['On Track', 'At Risk', 'Off Track', 'Blocked', 'On Hold'];

const focusModes = [
  { title: 'Project Check-in', description: 'Progress, roadblocks, and next steps.', icon: 'M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m5.231 13.481L15 17.25m-4.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Zm3.75 11.625a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z' },
  { title: 'Goal Setting & Career Growth', description: 'Long-term aspirations and skill development.', icon: 'M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941' },
  { title: 'Feedback & Development', description: 'Give and receive constructive feedback.', icon: 'M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.83-5.83M11.42 15.17l2.496-3.03c.527-1.04 2.476-1.04 3.004 0l1.917 2.323a1.875 1.875 0 0 1-.417 2.704l-2.323 1.917a1.125 1.125 0 0 1-1.406-.134l-3.03-2.496M11.42 15.17 6.83 20.17a2.652 2.652 0 0 1-3.75 0V17.25c0-1.007.368-1.95.984-2.7l8.305-8.305c.675-.675 1.66-.675 2.335 0l2.323 2.323c.675.675.675 1.66 0 2.335L11.42 15.17Z' },
  { title: 'General Catch-up', description: 'A flexible, open-ended conversation.', icon: 'M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.76 9.76 0 0 1-2.544-.467l.099-.023c.133-.03.263-.065.389-.104l2.25-1.004a.75.75 0 0 0 .33-.615V14.25a1.5 1.5 0 0 0-1.5-1.5h-2.25a1.5 1.5 0 0 0-1.5 1.5v2.25c0 1.01.626 1.867 1.528 2.168l-2.127 1.185A9.755 9.755 0 0 1 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z' },
];

const MeetingSetup: React.FC<MeetingSetupProps> = ({ onStart, isLoading, error, teamMember }) => {
  const [employeeName, setEmployeeName] = useState(teamMember?.name || '');
  const [role, setRole] = useState(teamMember?.role || '');
  const [goal, setGoal] = useState('');
  const [careerAspirations, setCareerAspirations] = useState(teamMember?.careerAspirations || '');
  const [sentiment, setSentiment] = useState<MeetingDetails['sentiment']>('Neutral');
  const [meetingFocus, setMeetingFocus] = useState<string>(focusModes[0].title);
  
  const [employeeStrengths, setEmployeeStrengths] = useState<string[]>([]);
  const [employeeStrengthsOther, setEmployeeStrengthsOther] = useState('');
  const [employeeChallenges, setEmployeeChallenges] = useState<string[]>([]);
  const [employeeChallengesOther, setEmployeeChallengesOther] = useState('');

  const [projectStatus, setProjectStatus] = useState<MeetingDetails['projectStatus']>('On Track');
  const [projectCriticality, setProjectCriticality] = useState<MeetingDetails['projectCriticality']>('Medium');

  useEffect(() => {
    setEmployeeName(teamMember?.name || '');
    setRole(teamMember?.role || '');
    setCareerAspirations(teamMember?.careerAspirations || '');
  }, [teamMember]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (employeeName && role && goal) {
      onStart({ 
        employeeName, 
        role, 
        goal, 
        sentiment,
        employeeStrengths,
        employeeStrengthsOther,
        employeeChallenges,
        employeeChallengesOther,
        projectStatus,
        projectCriticality,
        careerAspirations,
        meetingFocus
      });
    }
  };
  
  const employeeTopics = teamMember?.previousMeeting?.employeeTalkingPoints || [];

  return (
    <div className="max-w-3xl mx-auto">
      <Card>
        <div className="p-8 text-center">
          <h2 className="text-2xl font-bold text-slate-900">Plan Your 1-on-1 with {employeeName || 'Your Team Member'}</h2>
          <p className="mt-2 text-slate-600">
            Provide some context and let AI create a tailored agenda to make your meeting effective and impactful.
          </p>
        </div>

        {employeeTopics.length > 0 && (
             <div className="px-8 pb-6">
                <Card className="bg-slate-50">
                    <div className="p-4">
                        <h4 className="font-semibold text-slate-800 flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-slate-500" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                            Topics from {employeeName}
                        </h4>
                        <p className="text-sm text-slate-500 mt-1">Your team member added these topics to discuss:</p>
                        <ul className="mt-3 space-y-2 list-disc list-inside">
                            {employeeTopics.map((topic, index) => (
                                <li key={index} className="text-sm text-slate-700">{topic}</li>
                            ))}
                        </ul>
                    </div>
                </Card>
            </div>
        )}

        <form onSubmit={handleSubmit} className="p-8 border-t border-slate-200">
          <div className="space-y-8">
            
            <div>
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Select a Meeting Focus</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {focusModes.map(mode => (
                  <button 
                    key={mode.title}
                    type="button"
                    onClick={() => setMeetingFocus(mode.title)}
                    className={`p-4 text-left border rounded-lg transition-all ${meetingFocus === mode.title ? 'bg-brand-light border-brand-primary ring-2 ring-brand-primary' : 'bg-white hover:bg-slate-50 border-slate-300'}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-6 h-6 mb-2 ${meetingFocus === mode.title ? 'text-brand-primary' : 'text-slate-500'}`}>
                      <path strokeLinecap="round" strokeLinejoin="round" d={mode.icon} />
                    </svg>
                    <p className="font-semibold text-sm text-slate-800">{mode.title}</p>
                    <p className="text-xs text-slate-500 mt-1">{mode.description}</p>
                  </button>
                ))}
              </div>
            </div>

            <div>
                <h3 className="text-lg font-semibold text-slate-800 border-b pb-2 mb-4">Meeting Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input
                    label="Employee Name"
                    id="employeeName"
                    value={employeeName}
                    onChange={(e) => setEmployeeName(e.target.value)}
                    placeholder="e.g., Alex Doe"
                    required
                    readOnly
                    className={'bg-slate-100 cursor-not-allowed'}
                    />
                    <Input
                    label="Employee Role"
                    id="role"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    placeholder="e.g., Senior Software Engineer"
                    required
                    readOnly
                    className={'bg-slate-100 cursor-not-allowed'}
                    />
                    <div className="md:col-span-2">
                    <Input
                        label="Key Goal or Project Focus (This Week)"
                        id="goal"
                        value={goal}
                        onChange={(e) => setGoal(e.target.value)}
                        placeholder="e.g., Launching the new dashboard feature"
                        required
                    />
                    </div>
                    <div className="md:col-span-2">
                    <Input
                        label="Career Aspirations / Long-term Goal"
                        id="careerAspirations"
                        value={careerAspirations}
                        onChange={(e) => setCareerAspirations(e.target.value)}
                        placeholder="e.g., Grow into a Tech Lead role"
                        required
                    />
                    </div>
                    <div>
                    <label htmlFor="sentiment" className="block text-sm font-medium text-slate-700 mb-1">
                        Recent Sentiment / Morale
                    </label>
                    <select
                        id="sentiment"
                        value={sentiment}
                        onChange={(e) => setSentiment(e.target.value as MeetingDetails['sentiment'])}
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm rounded-md"
                    >
                        <option>Positive</option>
                        <option>Neutral</option>
                        <option>Needs Improvement</option>
                    </select>
                    </div>
                </div>
            </div>

            <div className="pt-4">
                <h3 className="text-lg font-semibold text-slate-800 border-b pb-2 mb-4">Context (Optional but Recommended)</h3>
                
                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Employee's Key Strengths</label>
                        <MultiSelectPills options={STRENGTH_OPTIONS} selectedOptions={employeeStrengths} onChange={setEmployeeStrengths} />
                        {employeeStrengths.includes('Other') && (
                            <Input id="strengths-other" label="Other Strengths" value={employeeStrengthsOther} onChange={(e) => setEmployeeStrengthsOther(e.target.value)} placeholder="Please specify other strengths" className="mt-3"/>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Employee's Current Challenges</label>
                        <MultiSelectPills options={CHALLENGE_OPTIONS} selectedOptions={employeeChallenges} onChange={setEmployeeChallenges} />
                        {employeeChallenges.includes('Other') && (
                            <Input id="challenges-other" label="Other Challenges" value={employeeChallengesOther} onChange={(e) => setEmployeeChallengesOther(e.target.value)} placeholder="Please specify other challenges" className="mt-3"/>
                        )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                        <div>
                            <label htmlFor="projectStatus" className="block text-sm font-medium text-slate-700 mb-1">Project Status</label>
                            <select id="projectStatus" value={projectStatus} onChange={(e) => setProjectStatus(e.target.value as MeetingDetails['projectStatus'])} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm rounded-md">
                                {PROJECT_STATUS_OPTIONS.map(opt => <option key={opt}>{opt}</option>)}
                            </select>
                        </div>
                        <div>
                        <label htmlFor="projectCriticality" className="block text-sm font-medium text-slate-700 mb-1">
                            Project Criticality
                        </label>
                        <select
                            id="projectCriticality"
                            value={projectCriticality}
                            onChange={(e) => setProjectCriticality(e.target.value as MeetingDetails['projectCriticality'])}
                            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm rounded-md"
                        >
                            <option>High</option>
                            <option>Medium</option>
                            <option>Low</option>
                        </select>
                        </div>
                    </div>
                </div>
            </div>
          </div>
          
          {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
          <Button type="submit" fullWidth disabled={isLoading} className="mt-8">
            {isLoading ? 'Generating...' : 'Generate Agenda'}
          </Button>
        </form>
      </Card>
    </div>
  );
};

export default MeetingSetup;