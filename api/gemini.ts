import { GoogleGenAI, Type } from "@google/genai";
import { MeetingDetails, StructuredSummary, TeamMember, GrowthSuggestions } from "../types";

// This function runs on the server, where process.env.API_KEY is securely available.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- Schema Definitions ---
const agendaSchema = { type: Type.ARRAY, items: { type: Type.STRING } };
const promptsSchema = { type: Type.ARRAY, items: { type: Type.STRING } };
const summarySchema = {
  type: Type.OBJECT,
  properties: {
    keyPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
    decisions: { type: Type.ARRAY, items: { type: Type.STRING } },
    sentiment: { type: Type.STRING },
    impactScore: { type: Type.NUMBER },
    reasoning: { type: Type.STRING }
  },
  required: ["keyPoints", "decisions", "sentiment", "impactScore", "reasoning"]
};
const growthSuggestionsSchema = {
    type: Type.OBJECT,
    properties: {
        articles: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: { title: { type: Type.STRING }, url: { type: Type.STRING }, description: { type: Type.STRING } },
                required: ["title", "url", "description"]
            }
        },
        projects: { type: Type.ARRAY, items: { type: Type.STRING } },
        skills: { type: Type.ARRAY, items: { type: Type.STRING } }
    },
    required: ["articles", "projects", "skills"]
};
const managerInsightsSchema = { type: Type.ARRAY, items: { type: Type.STRING } };


// --- API Logic Handlers ---

const handleGenerateAgenda = async (payload: { details: MeetingDetails }) => {
  const { details } = payload;
  const formatList = (list: string[], other?: string) => [...list, other].filter(Boolean).join(', ') || 'Not specified';
  const prompt = `
    You are an expert manager's assistant. Generate a 5-point agenda for a meeting with the following details:
    - Employee Name: ${details.employeeName}, Role: ${details.role}
    - Meeting Focus: ${details.meetingFocus || 'General Catch-up'}
    - Goal: ${details.goal}
    - Career Aspirations: ${details.careerAspirations || 'Not specified'}
    - Sentiment: ${details.sentiment}
    - Strengths: ${formatList(details.employeeStrengths, details.employeeStrengthsOther)}
    - Challenges: ${formatList(details.employeeChallenges, details.employeeChallengesOther)}
    - Project Status: ${details.projectStatus || 'Not specified'}, Criticality: ${details.projectCriticality}

    Instructions: The first item MUST be "Review previous action items". Tailor other points to the "Meeting Focus".
    Return ONLY a JSON array of 5 strings.
  `;
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: { responseMimeType: "application/json", responseSchema: agendaSchema }
  });
  return JSON.parse(response.text);
};

const handleGetCoachingPrompts = async (payload: { details: MeetingDetails }) => {
    const { details } = payload;
    const formatList = (list: string[], other?: string): string => [...list, other].filter(Boolean).join(', ') || 'Not specified';
    const prompt = `
        You are an expert executive coach. Generate two simple, direct, and highly impactful coaching questions for a manager's 1-on-1 meeting.
        Context: Employee ${details.employeeName} (${details.role}), Career Aspiration: "${details.careerAspirations}", Goal: "${details.goal}", Strengths: ${formatList(details.employeeStrengths, details.employeeStrengthsOther)}, Challenges: ${formatList(details.employeeChallenges, details.employeeChallengesOther)}, Sentiment: ${details.sentiment}.
        Instructions: Questions must be simple, open-ended, contextual, and non-generic. One should connect their goal to their aspiration.
        Return ONLY a JSON array of 2 strings.
    `;
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash', contents: prompt,
        config: { responseMimeType: "application/json", responseSchema: promptsSchema }
    });
    return JSON.parse(response.text);
};

const handleGetManagerFeedbackPrompts = async () => {
    const prompt = `
        You are a leadership coach. Provide 2 open-ended questions a manager can ask to solicit constructive feedback about their own performance.
        The questions should create psychological safety.
        Return ONLY a JSON array of 2 strings.
    `;
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash', contents: prompt,
        config: { responseMimeType: "application/json", responseSchema: promptsSchema }
    });
    return JSON.parse(response.text);
};

const handleGenerateSummary = async (payload: { content: any }) => {
    const { content } = payload;
    const completedAgenda = content.agenda.filter((i: any) => i.completed).map((i: any) => i.text).join(', ');
    const newActionItems = content.actionItems.map((i: any) => `- ${i.text} (Status: ${i.status})`).join('\n');
    const prompt = `
      You are an expert manager's assistant writing a structured summary of a 1-on-1.
      Analyze: Meeting with ${content.details.employeeName}, Goal: ${content.details.goal}, Discussed: ${completedAgenda}, Notes: """${content.notes}""", Action Items: ${newActionItems}.
      Synthesize this into a JSON object. Base the impactScore on goal progress, clear action items, and sentiment.
    `;
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro', contents: prompt,
        config: { responseMimeType: "application/json", responseSchema: summarySchema }
    });
    return JSON.parse(response.text);
};

const handleGetGrowthSuggestions = async (payload: { role: string, aspiration: string }) => {
    const { role, aspiration } = payload;
    const prompt = `
        Act as a career coach. An employee who is a "${role}" wants to become a "${aspiration}".
        Generate actionable growth suggestions: 1-2 skills, 1-2 practical project ideas, 1-2 relevant articles/books (with public URLs).
        Return a JSON object.
    `;
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash', contents: prompt,
        config: { responseMimeType: "application/json", responseSchema: growthSuggestionsSchema }
    });
    return JSON.parse(response.text);
};

const handleGenerateManagerInsights = async (payload: { teamData: TeamMember[] }) => {
    const { teamData } = payload;
    const simplifiedData = teamData.map(member => ({
        name: member.name,
        history: member.meetingHistory.slice(-5).map(h => ({ focus: h.focus, sentiment: h.sentiment, challenges: h.challenges })),
        openActionItems: member.previousMeeting?.actionItems.filter(i => i.status !== 'Completed').length || 0
    }));
    const prompt = `
        You are a leadership coach analyzing a manager's 1-on-1 data:
        ${JSON.stringify(simplifiedData, null, 2)}
        Identify 2-3 potential "blind spots" or coaching opportunities FOR THE MANAGER based on cross-team patterns.
        Phrase these as constructive, actionable tips.
        Return ONLY a JSON array of 2-3 strings.
    `;
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash', contents: prompt,
        config: { responseMimeType: "application/json", responseSchema: managerInsightsSchema }
    });
    return JSON.parse(response.text);
};

const handleSimulateConversationResponse = async (payload: { teamMember: TeamMember, topic: string, history: { user: string; model: string }[] }) => {
    const { teamMember, topic, history } = payload;
    const prompt = `
        Simulate a conversation. You are ${teamMember.name} (${teamMember.role}).
        Profile: Career Aspiration: ${teamMember.careerAspirations}, Challenges: ${teamMember.previousMeeting?.challenges?.join(', ')}, Strengths: ${teamMember.previousMeeting?.strengths?.join(', ')}, Sentiment: ${teamMember.meetingHistory.slice(-1)[0]?.sentiment || 'Neutral'}.
        Topic: "${topic}".
        History: ${history.map(h => `Manager: ${h.user}\nYou: ${h.model}`).join('\n')}
        Task: Provide a realistic, in-character response (2-4 sentences) to the manager's last message: "${history.slice(-1)[0].user}".
    `;
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: prompt,
    });
    return response.text;
};


// --- Vercel Edge Function Handler ---
export const config = {
  runtime: 'edge',
};

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ message: 'Method not allowed' }), { status: 405 });
  }

  try {
    const { action, payload } = await req.json();
    let result;

    switch (action) {
      case 'generateAgenda':
        result = await handleGenerateAgenda(payload);
        break;
      case 'getCoachingPrompts':
        result = await handleGetCoachingPrompts(payload);
        break;
      case 'getManagerFeedbackPrompts':
        result = await handleGetManagerFeedbackPrompts();
        break;
      case 'generateSummary':
        result = await handleGenerateSummary(payload);
        break;
      case 'getGrowthSuggestions':
        result = await handleGetGrowthSuggestions(payload);
        break;
      case 'generateManagerInsights':
        result = await handleGenerateManagerInsights(payload);
        break;
      case 'simulateConversationResponse':
        result = await handleSimulateConversationResponse(payload);
        break;
      default:
        return new Response(JSON.stringify({ message: 'Invalid action' }), { status: 400 });
    }

    return new Response(JSON.stringify({ result }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error(`Error in action:`, error);
    return new Response(JSON.stringify({ message: error.message || 'An internal server error occurred.' }), { status: 500 });
  }
}
