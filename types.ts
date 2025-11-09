export type ActionItemStatus = 'Pending' | 'In Progress' | 'Completed' | 'Blocked';

export type AppError = {
  type: 'PROFILE_CREATION_FAILED' | 'FETCH_FAILED' | 'ADMIN_INDEX_REQUIRED' | 'ADMIN_PERMISSIONS_REQUIRED';
  message: string;
  details?: string;
} | null;

export interface AppUser {
  uid: string;
  email: string | null;
  organizationId: string; // Added for multi-tenancy
}

export interface MeetingDetails {
  employeeName: string;
  role: string;
  goal: string;
  sentiment: 'Positive' | 'Neutral' | 'Needs Improvement';
  employeeStrengths: string[];
  employeeChallenges: string[];
  employeeStrengthsOther?: string;
  employeeChallengesOther?: string;
  projectStatus: 'On Track' | 'At Risk' | 'Off Track' | 'Blocked' | 'On Hold' | '';
  projectCriticality: 'High' | 'Medium' | 'Low';
  careerAspirations: string;
  meetingFocus?: string;
}

export interface AgendaItem {
  id: string;
  text: string;
  completed: boolean;
  source: 'ai' | 'user' | 'employee';
  notes?: string;
}

export interface ActionItem {
  id:string;
  text: string;
  status: ActionItemStatus;
  dueDate?: string;
  comments?: string;
}

export interface StructuredSummary {
  keyPoints: string[];
  decisions: string[];
  sentiment: string;
  impactScore: number;
  reasoning: string;
  coachingMoment?: string;
}

export interface Conversation {
    question: string;
    response: string;
    source: 'ai' | 'user';
}

export interface MeetingSummaryData {
  summary: StructuredSummary;
  actionItems: ActionItem[];
}

export interface PreviousMeeting {
  notes: string;
  actionItems: ActionItem[];
  employeeTalkingPoints?: string[];
  // Include details from the last setup for historical context
  strengths?: string[];
  challenges?: string[];
  projectStatus?: MeetingDetails['projectStatus'];
  careerAspirations?: string;
}

export interface MeetingRecord {
  id: string;
  date: string;
  sentiment: 'Positive' | 'Neutral' | 'Needs Improvement';
  focus: string;
  strengths: string[];
  challenges: string[];
  projectStatus: MeetingDetails['projectStatus'];
  impactScore?: number;
}

export interface TeamMember {
    id: string;
    name: string;
    role: string;
    previousMeeting: PreviousMeeting | null;
    meetingHistory: MeetingRecord[];
    careerAspirations: string;
    userId: string; // To associate team members with the logged-in user
    organizationId: string; // Added for multi-tenancy
}

export interface GrowthSuggestionArticle {
  title: string;
  url: string;
  description: string;
}

export interface GrowthSuggestions {
  articles: GrowthSuggestionArticle[];
  projects: string[];
  skills: string[];
}
