import { MeetingDetails, StructuredSummary, TeamMember, GrowthSuggestions } from "../types";

/**
 * A helper function to call our secure backend API.
 * @param action The specific AI task to perform.
 * @param payload The data required for that task.
 * @returns The JSON result from the API.
 */
const callGeminiApi = async (action: string, payload: object): Promise<any> => {
    try {
        const response = await fetch('/api/gemini', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ action, payload }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'An unknown API error occurred.' }));
            console.error(`API Error for action "${action}":`, errorData.message);
            throw new Error(errorData.message);
        }

        const data = await response.json();
        return data.result;
    } catch (error) {
        console.error(`Network or fetch error for action "${action}":`, error);
        throw error; // Re-throw the error to be caught by the calling function
    }
};

export const generateAgenda = async (details: MeetingDetails): Promise<string[]> => {
    try {
        return await callGeminiApi('generateAgenda', { details });
    } catch (error) {
        console.error("Fallback for generateAgenda:", error);
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
    try {
        return await callGeminiApi('getCoachingPrompts', { details });
    } catch (error) {
        console.error("Fallback for getCoachingPrompts:", error);
        return [
            `Given your aspiration for '${details.careerAspirations}', how does succeeding in '${details.goal}' move you closer to that?`,
            "What's one part of this task you would approach differently if you were in a leadership position?"
        ];
    }
};

export const getManagerFeedbackPrompts = async (): Promise<string[]> => {
    try {
        return await callGeminiApi('getManagerFeedbackPrompts', {});
    } catch (error) {
        console.error("Fallback for getManagerFeedbackPrompts:", error);
        return [
            "What is one thing I could do more of, or less of, to better support you?",
            "What can I do to help you be more effective and successful in your role?"
        ];
    }
}

// FIX: Added getGrowthSuggestions function to provide AI-powered career development ideas.
export const getGrowthSuggestions = async (details: MeetingDetails): Promise<GrowthSuggestions> => {
    try {
        return await callGeminiApi('getGrowthSuggestions', { details });
    } catch (error) {
        console.error("Fallback for getGrowthSuggestions:", error);
        return {
            skills: ["Could not generate suggestions due to an API error."],
            articles: [{ title: "No articles were suggested.", url: "#", description: "" }],
            projects: []
        };
    }
};

interface SummaryContent {
    details: MeetingDetails;
    agenda: any[]; // Using any to avoid circular dependency issues with AgendaItem in this context
    notes: string;
    actionItems: any[]; // Using any to avoid circular dependency issues
}

export const generateFinalReport = async (content: SummaryContent): Promise<{ summary: StructuredSummary, growthSuggestions: GrowthSuggestions }> => {
    try {
        return await callGeminiApi('generateFinalReport', { content });
    } catch (error) {
        console.error("Fallback for generateFinalReport:", error);
        return {
            summary: {
                keyPoints: ["Could not generate a structured summary. Please refer to your notes."],
                decisions: ["No specific decisions were logged."],
                sentiment: "Summary generation failed.",
                impactScore: 0,
                reasoning: "Failed to generate an impact score due to an API error.",
                coachingMoment: "Could not generate a coaching moment due to an API error. Review meeting notes to identify opportunities for your next 1-on-1."
            },
            growthSuggestions: {
                skills: ["Could not generate suggestions due to an API error."],
                articles: [{ title: "No articles were suggested.", url: "#", description: "" }],
                projects: []
            }
        };
    }
};

export const generateManagerInsights = async (teamData: TeamMember[]): Promise<string[]> => {
    try {
        return await callGeminiApi('generateManagerInsights', { teamData });
    } catch (error) {
        console.error("Fallback for generateManagerInsights:", error);
        return ["Could not generate insights at this time. Please check back later."];
    }
}

export const simulateConversationResponse = async (
    teamMember: TeamMember,
    topic: string,
    history: { user: string; model: string }[]
): Promise<string> => {
    try {
        return await callGeminiApi('simulateConversationResponse', { teamMember, topic, history });
    } catch (error) {
        console.error("Fallback for simulateConversationResponse:", error);
        return "I'm not sure how to respond to that. Can you try rephrasing?";
    }
}
