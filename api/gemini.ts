import { GoogleGenAI, Type } from "@google/genai";
import { MeetingDetails, StructuredSummary, TeamMember, GrowthSuggestions } from "../types";

// This function runs on the server, where process.env.API_KEY is securely available.
// The initialization is kept at the top level for performance (to be reused across invocations).
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

// --- Robust JSON Parsing ---
/**
 * A more robust JSON parser that handles potential markdown code fences.
 * @param jsonString The string response from the AI model.
 * @returns The parsed JSON object.
 */
const parseJsonResponse = (jsonString: string) => {
    // Try to find JSON within markdown fences (e.g., ```json\n{...}\n```)
    const match = jsonString.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    const extractedJson = match ? match[1] : jsonString;
    
    try {
        return JSON.parse(extractedJson.trim());
    } catch (error) {
        console.error("Failed to parse JSON response:", extractedJson);
        throw new Error("The AI returned a response in an invalid format.");
    }
};


// --- API Logic Handlers ---

const handleGenerateAgenda = async (payload: { details: MeetingDetails }) => {
  const { details } = payload;
  const formatList = (list: string[], other?: string) => [...list, other].filter(Boolean).join(', ') || 'Not specified';
  const prompt = `
    You are an expert manager's assistant. Generate a 5-point agenda for a one-on-one meeting with the following details:
    - Employee Name: ${details.employeeName}, Role: ${details.role}
    - Meeting Focus: ${details.meetingFocus || 'General Catch-up'}
    - Goal: ${details.goal}
    - Career Aspirations: ${details.careerAspirations || 'Not specified'}
    - Sentiment: ${details.sentiment}
    - Strengths: ${formatList(details.employeeStrengths, details.employeeStrengthsOther)}
    - Challenges: ${formatList(details.employeeChallenges, details.employeeChallengesOther)}
    - Project Status: ${details.projectStatus || 'Not specified'}, Criticality: ${details.projectCriticality}

    Instructions:
    1. The first agenda item MUST be "Review previous action items".
    2. Tailor the other points to the "Meeting Focus".
  `;
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
        responseMimeType: "application/json",
        responseSchema: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
        },
    },
  });
  return parseJsonResponse(response.text);
};

const handleGetCoachingPrompts = async (payload: { details: MeetingDetails }) => {
    const { details } = payload;
    const formatList = (list: string[], other?: string): string => [...list, other].filter(Boolean).join(', ') || 'Not specified';
    const prompt = `
        You are an expert executive coach. Generate two simple, direct, and highly impactful coaching questions for a manager's 1-on-1 meeting.
        Context: Employee ${details.employeeName} (${details.role}), Career Aspiration: "${details.careerAspirations}", Goal: "${details.goal}", Strengths: ${formatList(details.employeeStrengths, details.employeeStrengthsOther)}, Challenges: ${formatList(details.employeeChallenges, details.employeeChallengesOther)}, Sentiment: ${details.sentiment}.
        
        Instructions:
        1. Questions must be simple, open-ended, contextual, and non-generic.
        2. One question should connect their current goal to their long-term aspiration.
    `;
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash', 
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
            },
        },
    });
    return parseJsonResponse(response.text);
};

const handleGetManagerFeedbackPrompts = async () => {
    const prompt = `
        You are a leadership coach. Provide two open-ended questions a manager can ask to solicit constructive feedback about their own performance.
        The questions should be designed to create psychological safety and encourage honest feedback.
    `;
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash', 
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
            },
        },
    });
    return parseJsonResponse(response.text);
};

const handleGenerateSummary = async (payload: { content: any }) => {
    const { content } = payload;
    const completedAgenda = content.agenda.filter((i: any) => i.completed).map((i: any) => i.text).join(', ');
    const newActionItems = content.actionItems.map((i: any) => `- ${i.text} (Status: ${i.status})`).join('\n');
    const prompt = `
      You are an expert manager's assistant tasked with writing a structured summary of a 1-on-1 meeting.
      Analyze the following meeting data:
      - Meeting with: ${content.details.employeeName}
      - Key Goal: ${content.details.goal}
      - Completed Agenda Items: ${completedAgenda || 'None'}
      - Meeting Notes: """${content.notes}"""
      - New Action Items: """${newActionItems || 'None'}"""

      Synthesize this information to populate the response schema.
    `;
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro', 
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    keyPoints: { type: Type.ARRAY, items: { type: Type.STRING }, description: "A list of the most important discussion points." },
                    decisions: { type: Type.ARRAY, items: { type: Type.STRING }, description: "A list of any decisions that were made." },
                    sentiment: { type: Type.STRING, description: "A single string describing the overall sentiment of the meeting (e.g., 'Positive and productive', 'Slightly concerned but optimistic')." },
                    impactScore: { type: Type.NUMBER, description: "A number between 0 and 100 representing the meeting's effectiveness and progress toward the goal." },
                    reasoning: { type: Type.STRING, description: "A brief explanation for the impact score, considering goal progress, clarity of action items, and overall sentiment." }
                },
                required: ['keyPoints', 'decisions', 'sentiment', 'impactScore', 'reasoning']
            },
        },
    });
    return parseJsonResponse(response.text);
};

const handleGetGrowthSuggestions = async (payload: { role: string, aspiration: string }) => {
    const { role, aspiration } = payload;
    const prompt = `
        You are an expert career coach. An employee with the role of "${role}" has a career aspiration to become a "${aspiration}".
        Your task is to provide actionable growth suggestions. Ensure the URLs for articles are valid and publicly accessible.
    `;
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash', 
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    skills: { type: Type.ARRAY, items: { type: Type.STRING }, description: "A list of 1-2 key skills to develop for this career transition." },
                    projects: { type: Type.ARRAY, items: { type: Type.STRING }, description: "A list of 1-2 practical project ideas to gain relevant experience." },
                    articles: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                title: { type: Type.STRING, description: "Relevant and specific article title" },
                                url: { type: Type.STRING, description: "A valid, publicly accessible URL for the article." },
                                description: { type: Type.STRING, description: "A brief, one-sentence description of why the article is relevant." }
                            },
                            required: ['title', 'url', 'description']
                        }
                    }
                },
                required: ['skills', 'projects', 'articles']
            }
        }
    });
    return parseJsonResponse(response.text);
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
        
        Your task is to identify 2-3 potential "blind spots" or coaching opportunities FOR THE MANAGER based on cross-team patterns.
        Phrase these as constructive, actionable tips. For example, if many team members report "Prioritization" as a challenge, suggest a workshop on time management techniques for the team.
    `;
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash', 
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
            },
        },
    });
    return parseJsonResponse(response.text);
};

const handleSimulateConversationResponse = async (payload: { teamMember: TeamMember, topic: string, history: { user: string; model: string }[] }) => {
    const { teamMember, topic, history } = payload;
    const prompt = `
        You are an AI simulating a conversation. You must stay in character as ${teamMember.name}, who is a ${teamMember.role}.
        Your Profile:
        - Career Aspiration: ${teamMember.careerAspirations}
        - Recent Challenges: ${teamMember.previousMeeting?.challenges?.join(', ') || 'None specified'}
        - Recent Strengths: ${teamMember.previousMeeting?.strengths?.join(', ')  || 'None specified'}
        - Recent Meeting Sentiment: ${teamMember.meetingHistory.slice(-1)[0]?.sentiment || 'Neutral'}
        
        The topic of this difficult conversation, initiated by the manager, is: "${topic}".
        
        Conversation History:
        ${history.map(h => `Manager: ${h.user}\nYou: ${h.model}`).join('\n')}
        
        Your Task: Provide a realistic, in-character response (2-4 sentences) to the manager's last message. Your response should reflect your personality traits inferred from your profile.
        Manager's last message: "${history.slice(-1)[0].user}"
        
        Your response as ${teamMember.name}:
    `;
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: prompt,
    });
    // This is a text response, no JSON parsing needed.
    return response.text;
};


// --- Vercel Edge Function Handler ---
export const config = {
  runtime: 'edge',
};

export default async function handler(req: Request) {
  // Check if the API key is available. This is crucial for Vercel deployment.
  if (!process.env.API_KEY) {
    console.error("CRITICAL: API_KEY environment variable is not set in the Vercel project settings.");
    return new Response(
      JSON.stringify({ 
        message: "AI service is not configured correctly. The API key is missing on the server. Please contact the administrator to set the API_KEY environment variable." 
      }), 
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
  
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ message: 'Method not allowed' }), { 
        status: 405,
        headers: { 'Content-Type': 'application/json' },
    });
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
        return new Response(JSON.stringify({ message: 'Invalid action' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ result }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error(`Error in action:`, error);
    const errorMessage = error.message.includes('API key not valid') 
      ? 'The provided API key is invalid. Please check the key in the Vercel environment variables.'
      : error.message || 'An internal server error occurred.';
      
    return new Response(JSON.stringify({ message: errorMessage }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' },
    });
  }
}
