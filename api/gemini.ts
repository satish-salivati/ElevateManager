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

const handleGetGrowthSuggestions = async (payload: { details: MeetingDetails }): Promise<GrowthSuggestions> => {
    const { details } = payload;
    const formatList = (list: string[], other?: string) => [...list, other].filter(Boolean).join(', ') || 'Not specified';

    const prompt = `
      You are an expert career coach. Your task is to analyze the context of a 1-on-1 meeting and generate growth suggestions.
      
      MEETING CONTEXT:
      - Employee: ${details.employeeName} (${details.role})
      - Stated Career Aspiration: "${details.careerAspirations}"
      - Meeting Goal: ${details.goal}
      - Employee's Stated Strengths: ${formatList(details.employeeStrengths, details.employeeStrengthsOther)}
      - Employee's Stated Challenges: ${formatList(details.employeeChallenges, details.employeeChallengesOther)}

      YOUR TASK:
      Based on ALL of the information above, generate a single, valid JSON object. Do not add any introductory text, closing text, or markdown formatting like \`\`\`json.

      The JSON object must contain these top-level keys:

      -   \`skills\`: Identify 1-2 key skills the employee should develop to reach their career aspiration, directly referencing their stated challenges.
      -   \`projects\`: Suggest 1-2 practical, small-scale project ideas that would help them develop these skills, leveraging their stated strengths.
      -   \`articles\`: Find 2 real, publicly accessible articles with valid URLs that are highly relevant to the skills and challenges discussed. Provide a title, URL, and a one-sentence description of why it's relevant.
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    skills: { type: Type.ARRAY, items: { type: Type.STRING } },
                    projects: { type: Type.ARRAY, items: { type: Type.STRING } },
                    articles: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                title: { type: Type.STRING },
                                url: { type: Type.STRING },
                                description: { type: Type.STRING }
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

const handleGenerateFinalReport = async (payload: { content: any }) => {
    const { content } = payload;
    const completedAgenda = content.agenda.filter((i: any) => i.completed).map((i: any) => i.text).join(', ');
    const newActionItems = content.actionItems.map((i: any) => `- ${i.text} (Status: ${i.status})`).join('\n');
    const formatList = (list: string[], other?: string) => [...list, other].filter(Boolean).join(', ') || 'Not specified';

    const prompt = `
      You are an expert manager's assistant and career coach. Your task is to analyze the full context of a 1-on-1 meeting and generate a comprehensive report.
      
      MEETING CONTEXT:
      - Employee: ${content.details.employeeName} (${content.details.role})
      - Stated Career Aspiration: "${content.details.careerAspirations}"
      - Meeting Goal: ${content.details.goal}
      - Employee's Stated Strengths: ${formatList(content.details.employeeStrengths, content.details.employeeStrengthsOther)}
      - Employee's Stated Challenges: ${formatList(content.details.employeeChallenges, content.details.employeeChallengesOther)}
      - Completed Agenda Items: ${completedAgenda || 'None'}
      - Comprehensive Meeting Notes: """${content.notes}"""
      - New Action Items Created: """${newActionItems || 'None'}"""

      YOUR TASK:
      Based on ALL of the information above, generate a single, valid JSON object. Do not add any introductory text, closing text, or markdown formatting like \`\`\`json.

      The JSON object must contain two top-level keys: "summary" and "growthSuggestions".

      1.  **For the "summary" object:**
          -   \`keyPoints\`: Synthesize the most important discussion points from the notes.
          -   \`decisions\`: List any concrete decisions made.
          -   \`sentiment\`: Describe the overall sentiment of the meeting.
          -   \`impactScore\`: Calculate a score (0-100) for the meeting's effectiveness based on goal progress, sentiment, and defined action items.
          -   \`reasoning\`: Briefly explain the impact score.
          -   \`coachingMoment\`: Provide a single, forward-looking, actionable tip FOR THE MANAGER on what to focus on in the NEXT meeting, based on the notes and challenges.

      2.  **For the "growthSuggestions" object:**
          -   \`skills\`: Identify 1-2 key skills the employee should develop to reach their career aspiration, directly referencing their stated challenges or topics from the meeting notes.
          -   \`projects\`: Suggest 1-2 practical, small-scale project ideas that would help them develop these skills, leveraging their stated strengths.
          -   \`articles\`: Find 2 real, publicly accessible articles with valid URLs that are highly relevant to the skills and challenges discussed. Provide a title, URL, and a one-sentence description of why it's relevant.
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    summary: {
                        type: Type.OBJECT,
                        properties: {
                            keyPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
                            decisions: { type: Type.ARRAY, items: { type: Type.STRING } },
                            sentiment: { type: Type.STRING },
                            impactScore: { type: Type.NUMBER },
                            reasoning: { type: Type.STRING },
                            coachingMoment: { type: Type.STRING }
                        },
                        required: ['keyPoints', 'decisions', 'sentiment', 'impactScore', 'reasoning', 'coachingMoment']
                    },
                    growthSuggestions: {
                        type: Type.OBJECT,
                        properties: {
                            skills: { type: Type.ARRAY, items: { type: Type.STRING } },
                            projects: { type: Type.ARRAY, items: { type: Type.STRING } },
                            articles: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        title: { type: Type.STRING },
                                        url: { type: Type.STRING },
                                        description: { type: Type.STRING }
                                    },
                                    required: ['title', 'url', 'description']
                                }
                            }
                        },
                        required: ['skills', 'projects', 'articles']
                    }
                },
                required: ['summary', 'growthSuggestions']
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
      case 'generateFinalReport':
        result = await handleGenerateFinalReport(payload);
        break;
      case 'generateManagerInsights':
        result = await handleGenerateManagerInsights(payload);
        break;
      case 'simulateConversationResponse':
        result = await handleSimulateConversationResponse(payload);
        break;
      // FIX: Added case for the new getGrowthSuggestions action.
      case 'getGrowthSuggestions':
        result = await handleGetGrowthSuggestions(payload);
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
