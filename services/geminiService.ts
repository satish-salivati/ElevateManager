
import { GoogleGenAI, Type } from "@google/genai";
import { MeetingDetails, AgendaItem, ActionItem, StructuredSummary, TeamMember, Conversation, GrowthSuggestions } from "../types";

// THIS IS THE FIX: We are ensuring the code uses the secure environment variable.
// Your new, secret API key will be safely provided by Vercel here.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * A robust utility to parse JSON from a Gemini model's text response.
 * It handles markdown code fences (```json ... ```) and other text that the model
 * might return alongside the JSON object or array.
 * @param text The raw text response from the Gemini API.
 * @returns The parsed JavaScript object or array.
 * @throws An error if no valid JSON can be extracted.
 */
const parseJsonFromGeminiResponse = (text: string): any => {
    // Attempt to find JSON within markdown code fences
    const codeBlockMatch = text.match(/```(json)?\s*([\s\S]*?)\s*```/);
    if (codeBlockMatch && codeBlockMatch[2]) {
        try {
            return JSON.parse(codeBlockMatch[2]);
        } catch (e) {
            console.error("Failed to parse JSON from code block, falling back to substring search.", e);
        }
    }

    // Fallback to finding the first '{' or '[' and the last '}' or ']'
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    const firstBracket = text.indexOf('[');
    const lastBracket = text.lastIndexOf(']');

    let startIndex = -1;
    let endIndex = -1;

    // Determine if it's likely an object or an array
    if (firstBrace !== -1 && lastBrace > firstBrace) {
         // It's likely an object. Prioritize this if it appears first.
         if (firstBracket === -1 || firstBrace < firstBracket) {
              startIndex = firstBrace;
              endIndex = lastBrace;
         }
    }
    
    if (firstBracket !== -1 && lastBracket > firstBracket) {
        // It's likely an array. Use this if it's the only option or appears first.
        if (startIndex === -1 || firstBracket < firstBrace) {
            startIndex = firstBracket;
            endIndex = lastBracket;
        }
    }

    if (startIndex !== -1 && endIndex !== -1) {
        const jsonString = text.substring(startIndex, endIndex + 1);
        try {
            return JSON.parse(jsonString);
        } catch (e) {
            console.error("Failed to parse extracted JSON substring:", jsonString, e);
            throw new Error("Could not parse valid JSON from the response.");
        }
    }

    throw new Error("No valid JSON object or array found in the response.");
};


const agendaSchema = {
  type: Type.ARRAY,
  items: {
    type: Type.STRING,
    description: "A specific talking point for the meeting agenda."
  }
};

const promptsSchema = {
    type: Type.ARRAY,
    items: {
        type: Type.STRING,
        description: "An insightful, open-ended coaching question."
    }
};

const summarySchema = {
  type: Type.OBJECT,
  properties: {
    keyPoints: {
      type: Type.ARRAY,
      description: "A list of the most important topics discussed.",
      items: { type: Type.STRING }
    },
    decisions: {
      type: Type.ARRAY,
      description: "A list of concrete decisions or conclusions reached during the meeting.",
      items: { type: Type.STRING }
    },
    sentiment: {
      type: Type.STRING,
      description: "A brief, one-sentence assessment of the overall mood or sentiment of the meeting (e.g., 'Positive and forward-looking', 'Constructive with some challenges addressed')."
    },
    impactScore: {
      type: Type.NUMBER,
      description: "A numerical score from 1-100 representing the meeting's effectiveness."
    },
    reasoning: {
      type: Type.STRING,
      description: "A brief, one-sentence justification for the impact score."
    }
  },
  required: ["keyPoints", "decisions", "sentiment", "impactScore", "reasoning"]
};

const growthSuggestionsSchema = {
    type: Type.OBJECT,
    properties: {
        articles: {
            type: Type.ARRAY,
            description: "Links to 1-2 relevant, free, and publicly accessible articles or well-known books.",
            items: {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING, description: "The title of the article or book." },
                    url: { type: Type.STRING, description: "The full URL if it's an article. Use a google.com search link for a book." },
                    description: { type: Type.STRING, description: "A one-sentence explanation of why this resource is relevant." }
                },
                required: ["title", "url", "description"]
            }
        },
        projects: { type: Type.ARRAY, items: { type: Type.STRING }, description: "1-2 ideas for small, actionable projects." },
        skills: { type: Type.ARRAY, items: { type: Type.STRING }, description: "1-2 key skills to focus on developing." }
    },
    required: ["articles", "projects", "skills"]
};

const managerInsightsSchema = {
    type: Type.ARRAY,
    items: {
        type: Type.STRING,
        description: "An actionable coaching tip or insight for the manager."
    }
}


export const generateAgenda = async (details: MeetingDetails): Promise<string[]> => {
  const formatList = (list: string[], other?: string): string => {
    if (list.length === 0 && !other) return 'Not specified';
    const allItems = [...list];
    if (other) {
      allItems.push(`Other: ${other}`);
    }
    return allItems.join(', ');
  }

  const prompt = `
    You are an expert manager's assistant specializing in effective one-on-one meetings.
    Generate a 5-point agenda for a meeting with the following details:
    - Employee Name: ${details.employeeName}
    - Role: ${details.role}
    - Meeting Focus/Template: ${details.meetingFocus || 'General Catch-up'}
    - Current Focus/Goal: ${details.goal}
    - Employee's Long-Term Career Aspirations: ${details.careerAspirations || 'Not specified'}
    - Recent Sentiment/Morale: ${details.sentiment}
    - Employee's Key Strengths: ${formatList(details.employeeStrengths, details.employeeStrengthsOther)}
    - Employee's Current Challenges: ${formatList(details.employeeChallenges, details.employeeChallengesOther)}
    - Project Status: ${details.projectStatus || 'Not specified'}
    - Project Criticality: ${details.projectCriticality}

    The agenda should be constructive, forward-looking, and strictly tailored to the selected "Meeting Focus/Template".
    
    IMPORTANT INSTRUCTIONS:
    1.  The first agenda item MUST be "Review previous action items".
    2.  If the focus is 'Project Check-in', the agenda must prioritize project status, roadblocks, and tactical next steps.
    3.  If the focus is 'Goal Setting & Career Growth', the agenda must include points about long-term aspirations, skill development, and setting new objectives. It MUST directly reference their stated career aspiration.
    4.  If the focus is 'Feedback & Development', the agenda must create space for both giving and receiving constructive feedback.
    5.  If the focus is 'General Catch-up', create a balanced agenda covering morale, recent work, and forward-looking topics.
    
    Return ONLY a JSON array of 5 strings.
  `;
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: agendaSchema,
      }
    });

    const agendaArray = parseJsonFromGeminiResponse(response.text);
    if (Array.isArray(agendaArray)) {
      return agendaArray;
    } else {
      throw new Error("Parsed response is not an array for agenda.");
    }

  } catch (error) {
    console.error("Error generating agenda:", error);
    // Fallback in case of API error
    return [
      "Review previous action items",
      `Review progress on: ${details.goal}`,
      "Discuss recent challenges and roadblocks",
      `Check in on progress towards career aspirations: ${details.careerAspirations || 'goals'}`,
      "Define priorities for the upcoming week"
    ];
  }
};


export const getCoachingPrompts = async (details: MeetingDetails): Promise<string[]> => {
    const formatList = (list: string[], other?: string): string => {
        if (list.length === 0 && !other) return 'Not specified';
        const allItems = [...list];
        if (other) {
            allItems.push(`Other: ${other}`);
        }
        return allItems.join(', ');
    }
    
    const prompt = `
        You are an expert executive coach known for asking simple, direct, and highly impactful questions. Your task is to generate two coaching questions for a manager's 1-on-1 meeting.

        **Meeting Context:**
        - Employee Name: ${details.employeeName}
        - Role: ${details.role}
        - Employee's Long-Term Career Aspiration: "${details.careerAspirations}"
        - This Week's Key Goal/Topic: "${details.goal}"
        - Employee's Key Strengths: ${formatList(details.employeeStrengths, details.employeeStrengthsOther)}
        - Employee's Current Challenges: ${formatList(details.employeeChallenges, details.employeeChallengesOther)}
        - Recent Sentiment/Morale: ${details.sentiment}

        **Your Task:**
        Provide **2** coaching questions for the manager to ask.

        **IMPORTANT INSTRUCTIONS:**
        1.  **Simple & Crisp:** Each question must be a single, clear sentence. Avoid complex vocabulary and corporate jargon.
        2.  **Value-Focused:** The questions must be designed to help the employee gain clarity, solve a problem, or connect their work to their goals.
        3.  **Impactful:** The questions should be thought-provoking and open-ended.
        4.  **Contextual:** The questions MUST be tailored to the specific meeting context provided above.
        5.  **Avoid Generic Questions:** Do not use common questions like "How's it going?" or "What are your blockers?".
        6.  **Connect to Growth:** If possible, one question should bridge the gap between their current work ("${details.goal}") and their long-term career aspiration ("${details.careerAspirations}").

        **Example of a good question:** "What would 'great' look like for this project if we weren't constrained?"
        **Example of a bad (too complex) question:** "Considering the interdependencies of your current project deliverables, what strategic realignments could we architect to de-risk the timeline and enhance stakeholder value?"

        Return ONLY a JSON array of 2 strings.
    `;
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: promptsSchema,
            }
        });
        
        const promptsArray = parseJsonFromGeminiResponse(response.text);
        if (Array.isArray(promptsArray)) {
            return promptsArray;
        } else {
            throw new Error("Parsed response is not an array for coaching prompts.");
        }
    } catch (error) {
        console.error("Error getting coaching prompts:", error);
        return [
            `Given your aspiration for '${details.careerAspirations}', how does succeeding in '${details.goal}' move you closer to that?`,
            "What's one part of this task you would approach differently if you were in a leadership position?"
        ];
    }
};

export const getManagerFeedbackPrompts = async (): Promise<string[]> => {
    const prompt = `
        You are an expert leadership coach.
        Provide **2** distinct, open-ended questions that a manager can ask their direct report to solicit constructive feedback about their own performance as a manager.
        The questions should encourage honest feedback and be phrased to create psychological safety. For example, instead of "What am I doing wrong?", prefer "What's one thing I could do differently that would be helpful to you?".
        
        Return ONLY a JSON array of 2 strings.
    `;
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: promptsSchema,
            }
        });
        
        const promptsArray = parseJsonFromGeminiResponse(response.text);
        if (Array.isArray(promptsArray)) {
            return promptsArray;
        } else {
            throw new Error("Parsed response is not an array for manager feedback prompts.");
        }
    } catch (error) {
        console.error("Error getting manager feedback prompts:", error);
        return [
            "What is one thing I could do more of, or less of, to better support you?",
            "What can I do to help you be more effective and successful in your role?"
        ];
    }
}

interface SummaryContent {
    details: MeetingDetails;
    agenda: AgendaItem[];
    notes: string;
    actionItems: ActionItem[];
}

export const generateSummary = async (content: SummaryContent): Promise<StructuredSummary> => {
    const completedAgenda = content.agenda.filter(i => i.completed).map(i => i.text).join(', ');
    const newActionItems = content.actionItems.map(i => `- ${i.text} (Status: ${i.status}${i.dueDate ? `, Due: ${i.dueDate}` : ''})${i.comments ? ` | Comment: ${i.comments}` : ''}`).join('\n');

    const prompt = `
      You are an expert manager's assistant. You are tasked with writing a structured summary of a one-on-one meeting.
      Analyze the following information:
      - Meeting with: ${content.details.employeeName} (${content.details.role})
      - Key Goal: ${content.details.goal}
      - Topics Discussed (from agenda): ${completedAgenda || 'None formally checked off.'}
      - Manager's Notes: """${content.notes}"""
      - Action Items, Statuses & Comments: ${newActionItems || 'None.'}

      Your task is to synthesize this information into a JSON object conforming to the provided schema.
      Provide a coherent synthesis, not just a list of the notes.
      - Base the impactScore on factors like whether goals were addressed, clear action items were created, and the overall sentiment.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro', // Using the more powerful model for better synthesis
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: summarySchema,
            }
        });
        const summaryObject = parseJsonFromGeminiResponse(response.text);

        // A simple check to ensure the object is not empty and has a key property
        if (summaryObject && summaryObject.keyPoints) {
            return summaryObject as StructuredSummary;
        } else {
            throw new Error("API returned JSON that does not match the required schema.");
        }
        
    } catch (error) {
        console.error("Error generating summary:", error);
        return {
            keyPoints: ["Could not generate a structured summary. Please refer to your notes."],
            decisions: ["No specific decisions were logged."],
            sentiment: "Summary generation failed.",
            impactScore: 0,
            reasoning: "Failed to generate an impact score due to an API error."
        };
    }
};

export const getGrowthSuggestions = async (role: string, aspiration: string): Promise<GrowthSuggestions> => {
    const prompt = `
        Act as a career coach. An employee who is a "${role}" wants to become a "${aspiration}".
        Based on this career path, generate a list of actionable growth suggestions.
        
        Provide:
        - 1-2 specific skills they should focus on developing.
        - 1-2 ideas for small, practical projects they could do to build those skills.
        - 1-2 relevant, well-known articles or books that would be beneficial. For articles, provide a real, public URL. For books, provide a URL to a google.com search for the book title and author.

        Return the response as a JSON object that strictly adheres to the provided schema.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: growthSuggestionsSchema,
            }
        });
        const suggestions = parseJsonFromGeminiResponse(response.text);
        
        // A simple check to ensure the object is not empty and has a key property
        if (suggestions && suggestions.skills) {
             return suggestions;
        } else {
            throw new Error("API returned JSON that does not match the required schema.");
        }
    } catch (error) {
        console.error("Error generating growth suggestions:", error);
        return {
            skills: ["Could not generate suggestions due to an API error."],
            articles: [{title: "No articles were suggested.", url: "#", description:""}],
            projects: []
        };
    }
};

export const generateManagerInsights = async (teamData: TeamMember[]): Promise<string[]> => {
    // Simplify the data sent to the model to avoid overly large prompts
    const simplifiedData = teamData.map(member => ({
        name: member.name,
        history: member.meetingHistory.slice(-5).map(h => ({
            focus: h.focus,
            sentiment: h.sentiment,
            challenges: h.challenges,
        })),
        openActionItems: member.previousMeeting?.actionItems.filter(i => i.status !== 'Completed').length || 0
    }));

    const prompt = `
        You are an expert leadership coach analyzing a manager's 1-on-1 data.
        Here is a summary of their team's recent meetings:
        ${JSON.stringify(simplifiedData, null, 2)}

        Based on this data, identify 2-3 potential "blind spots" or coaching opportunities FOR THE MANAGER.
        Focus on cross-team patterns, recurring unresolved issues, or imbalances in meeting focus.
        For example: "You've discussed 'Time Management' with multiple team members. Consider a team-wide workshop on prioritization techniques."
        Another example: "Notice that meetings with Alex often have a 'Needs Improvement' sentiment. It might be helpful to start the next meeting by asking what would make these conversations more valuable for him."
        
        Phrase these as constructive, actionable tips for the manager.
        Return ONLY a JSON array of 2-3 strings.
    `;
     try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: managerInsightsSchema,
            }
        });
        const insightsArray = parseJsonFromGeminiResponse(response.text);
        return insightsArray;
    } catch (error) {
        console.error("Error generating manager insights:", error);
        return ["Could not generate insights at this time. Please check back later."];
    }
}

export const simulateConversationResponse = async (
    teamMember: TeamMember,
    topic: string,
    history: { user: string; model: string }[]
): Promise<string> => {
    const prompt = `
        You are simulating a conversation with an employee to help their manager practice.

        **Employee Profile:**
        - Name: ${teamMember.name}
        - Role: ${teamMember.role}
        - Career Aspiration: ${teamMember.careerAspirations}
        - Recent Challenges: ${teamMember.previousMeeting?.challenges?.join(', ') || 'None noted'}
        - Recent Strengths: ${teamMember.previousMeeting?.strengths?.join(', ') || 'None noted'}
        - Recent Sentiment: ${teamMember.meetingHistory.slice(-1)[0]?.sentiment || 'Neutral'}

        **Conversation Context:**
        - Topic: The manager wants to discuss "${topic}".
        - History:
        ${history.map(h => `Manager: ${h.user}\nYou: ${h.model}`).join('\n')}
        
        **Your Task:**
        Based on the employee's profile and the conversation so far, provide a realistic, in-character response to the manager's last message. Keep your response concise (2-4 sentences). Do not break character.
        
        Manager's last message: "${history.slice(-1)[0].user}"
        
        Your response:
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: prompt,
        });
        return response.text;
    } catch (error) {
        console.error("Error in conversation simulation:", error);
        return "I'm not sure how to respond to that. Can you try rephrasing?";
    }
}
