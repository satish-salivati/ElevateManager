import React, { useState } from 'react';
import Card from './common/Card';
import Button from './common/Button';
import Spinner from './common/Spinner';
import { getGrowthSuggestions } from '../services/geminiService';
import { GrowthSuggestions, MeetingDetails } from '../types';

interface GrowthCareerSectionProps {
  meetingDetails: MeetingDetails;
}

const GrowthCareerSection: React.FC<GrowthCareerSectionProps> = ({ meetingDetails }) => {
    const [suggestions, setSuggestions] = useState<GrowthSuggestions | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGenerate = async () => {
        setIsLoading(true);
        setError(null);
        try {
            // Pass the entire meetingDetails object for rich context
            const result = await getGrowthSuggestions(meetingDetails);
            // Check if the service returned the specific fallback error message
            if (result.skills.includes("Could not generate suggestions due to an API error.")) {
                setError("Could not generate suggestions due to an API error.");
                setSuggestions(null); // Clear any previous valid suggestions
            } else {
                setSuggestions(result);
            }
        } catch (err) {
            setError("Failed to generate suggestions. Please try again.");
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

  if (!meetingDetails.careerAspirations) {
    return null;
  }
  
  const renderSuggestions = () => {
      if (!suggestions) return null;

      const SuggestionSection: React.FC<{title: string; items: string[]; icon: React.ReactNode}> = ({title, items, icon}) => (
          <div>
              <h4 className="font-semibold text-slate-800 flex items-center gap-2">
                {icon}
                {title}
              </h4>
              <ul className="mt-2 list-disc list-inside space-y-1 text-sm text-slate-700">
                  {items.map((item, index) => <li key={index}>{item}</li>)}
              </ul>
          </div>
      );

      return (
          <div className="mt-4 pt-4 border-t border-indigo-200 space-y-4">
              <SuggestionSection 
                title="Key Skills to Develop"
                items={suggestions.skills}
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4M17 3v4m-2-2h4m2 10v4m-2-2h4M5 11h14" /></svg>}
              />
               <div>
                    <h4 className="font-semibold text-slate-800 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-600" viewBox="0 0 20 20" fill="currentColor"><path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 15c1.255 0 2.443-.29 3.5-.804V4.804zM14.5 4c1.255 0 2.443.29 3.5.804v10A7.969 7.969 0 0114.5 15c-1.255 0-2.443-.29-3.5-.804V4.804A7.968 7.968 0 0114.5 4z" /></svg>
                        Relevant Articles
                    </h4>
                    <div className="mt-2 space-y-3">
                        {suggestions.articles.map((article, index) => (
                            <div key={index} className="text-sm">
                                <a href={article.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-brand-primary hover:underline">{article.title}</a>
                                <p className="text-slate-600 text-xs mt-0.5">{article.description}</p>
                            </div>
                        ))}
                        {suggestions.articles.length === 0 && <p className="text-xs text-slate-500">No articles were suggested.</p>}
                    </div>
                </div>
               <SuggestionSection 
                title="Potential Projects"
                items={suggestions.projects}
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-600" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1H8a3 3 0 00-3 3v1.5a1.5 1.5 0 01-3 0V6z" clipRule="evenodd" /><path d="M6 12a2 2 0 012-2h8a2 2 0 012 2v2a2 2 0 01-2 2H8a2 2 0 01-2-2v-2z" /></svg>}
              />
          </div>
      )
  }

  return (
    <Card className="bg-indigo-50 border-indigo-200">
      <div className="p-5">
        <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-brand-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            </div>
            <div className="flex-1">
            <h3 className="text-md font-semibold text-slate-800">Growth & Career Goal</h3>
            <p className="mt-1 text-sm text-slate-700">
                {meetingDetails.careerAspirations}
            </p>
            </div>
        </div>

        {!suggestions && !error && (
             <div className="mt-4 flex items-center gap-4">
                <Button onClick={handleGenerate} size="sm" disabled={isLoading}>
                    {isLoading ? <Spinner small/> : 'Generate Growth Ideas'}
                </Button>
            </div>
        )}
       
        {isLoading && (
            <div className="mt-4 pt-4 border-t border-indigo-200 text-center">
                <div className="flex justify-center"><Spinner small /></div>
                <p className="text-sm text-slate-600 mt-2">Finding relevant resources...</p>
            </div>
        )}

        {error && !isLoading && (
            <div className="mt-4 pt-4 border-t border-indigo-200 text-center">
                <p className="text-sm text-red-600">{error}</p>
                <Button onClick={handleGenerate} size="sm" variant="secondary" className="mt-2">Try Again</Button>
            </div>
        )}
        
        {renderSuggestions()}
      </div>
    </Card>
  );
};

export default GrowthCareerSection;
