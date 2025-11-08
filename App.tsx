import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { MeetingDetails, AgendaItem, ActionItem, MeetingSummaryData, MeetingRecord, TeamMember, Conversation, AppUser } from './types';
import Header from './components/Header';
import MeetingSetup from './components/MeetingSetup';
import MeetingWorkspace from './components/MeetingWorkspace';
import MeetingSummary from './components/MeetingSummary';
import AuthPage from './components/AuthPage';
import MainPage from './components/MainPage';
import PreMeetingReview from './components/PreMeetingReview';
import ConversationSimulator from './components/ConversationSimulator';
import Spinner from './components/common/Spinner';
import FirebaseConfigErrorPage from './components/FirebaseConfigErrorPage';
import { isFirebaseConfigured } from './config/firebase';
import { generateAgenda, generateSummary } from './services/geminiService';
import { 
    onAuthStateChanged, 
    doSignOut,
    getUserProfile,
    getTeamMembers,
    addTeamMember,
    updateTeamMember,
    deleteTeamMember,
    finalizeMeeting,
    getAllTeamDataForAdmin
} from './services/firebaseService';

const ADMIN_EMAIL = 'admin@elevatemanager.com'; // Hardcoded admin user for demo purposes

const pollForUserProfile = async (uid: string, retries = 5, delay = 1000): Promise<AppUser | null> => {
    for (let i = 0; i < retries; i++) {
        const userProfile = await getUserProfile(uid);
        if (userProfile) {
            console.log(`User profile found after ${i + 1} attempt(s).`);
            return userProfile;
        }
        // Don't log on the last attempt
        if (i < retries - 1) {
            console.log(`Profile not found, attempt ${i + 1}. Retrying in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
    console.log(`User profile not found after ${retries} attempts.`);
    return null;
}

const App: React.FC = () => {
  const [view, setView] = useState<'auth' | 'main' | 'review' | 'setup' | 'workspace' | 'summary' | 'simulator'>('auth');
  
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [dashboardTeamMembers, setDashboardTeamMembers] = useState<TeamMember[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  const [selectedTeamMember, setSelectedTeamMember] = useState<TeamMember | null>(null);

  const [meetingDetails, setMeetingDetails] = useState<MeetingDetails | null>(null);
  const [agenda, setAgenda] = useState<AgendaItem[]>([]);
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);
  const [coachingConversations, setCoachingConversations] = useState<Conversation[]>([]);
  const [feedbackConversations, setFeedbackConversations] = useState<Conversation[]>([]);

  const [summaryData, setSummaryData] = useState<MeetingSummaryData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Add this check at the very top. If Firebase isn't configured, show a helpful guide.
  if (!isFirebaseConfigured) {
    return <FirebaseConfigErrorPage />;
  }

  const fetchData = useCallback(async () => {
    if (currentUser && currentUser.organizationId) { // Ensure orgId exists before fetching
        setIsLoading(true);
        setError(null);
        try {
            const members = await getTeamMembers(currentUser.uid, currentUser.organizationId);
            setTeamMembers(members);

            if (isAdmin) {
                const allMembers = await getAllTeamDataForAdmin(currentUser.organizationId);
                setDashboardTeamMembers(allMembers);
            }
        } catch (err) {
            const error = err as Error;
            const errorMessage = error.message || 'An unknown error occurred.';
            console.error("Failed to fetch user data:", error);

            if (errorMessage.includes('The query requires an index')) {
                  setError("Admin Action Required: The organization dashboard needs a database index to function. Please open your browser's developer console (F12), find the error message from Firebase that contains a link, and click that link to create the index. This is a one-time setup. The index may take a few minutes to build. After it's ready, click 'Retry'.");
            } else if (errorMessage.includes('Missing or insufficient permissions')) {
                setError("Could not load admin dashboard data. This is likely a permissions issue. Please update your Firestore Security Rules to allow 'admin@elevatemanager.com' to read the 'teamMembers' collection group and its 'meetingHistory' subcollections. After updating the rules, please click 'Retry'.");
            } else {
                setError("Could not load team data. This may be due to a network issue or a problem with your Firestore setup. Please check the console for more details.");
            }
        } finally {
            setIsLoading(false);
        }
    }
  }, [currentUser, isAdmin]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(async (user) => {
        if (user) {
            // Widen window to 10 seconds to robustly catch new users
            const creationTime = user.metadata.creationTime ? new Date(user.metadata.creationTime).getTime() : 0;
            const isNewUser = (new Date().getTime() - creationTime) < 10000;

            let userProfile = await getUserProfile(user.uid);

            // If profile doesn't exist and it's a new user, start polling.
            // This handles the race condition where onAuthStateChanged fires before the profile is written to Firestore.
            if (!userProfile && isNewUser) {
                console.log("New user detected without a profile. Starting polling to resolve sign-up race condition...");
                userProfile = await pollForUserProfile(user.uid);
            }

            if (userProfile) {
                setCurrentUser(userProfile);
                setIsAdmin(userProfile.email === ADMIN_EMAIL);
                setError(null); // Clear any previous errors on successful load
                setView('main');
            } else {
                // **THE FIX**: Instead of logging out, stay logged in but show an error.
                // This stops the logout loop and makes the actual problem visible to the user.
                console.error("CRITICAL: User is authenticated but profile document is missing. This is likely a Firestore permissions issue from sign-up.");
                
                // Set a partial user object to keep the user "logged in" visually
                setCurrentUser({ uid: user.uid, email: user.email, organizationId: '' }); 
                setIsAdmin(user.email === ADMIN_EMAIL);

                // Set a specific, actionable error message
                setError("Your account was created, but your profile could not be saved to the database. This is very likely due to restrictive Firestore Security Rules in your Firebase project. Please update your rules to allow authenticated users to create their own profile in the 'users' collection, then refresh this page or log out and log back in.");
                
                setView('main'); // Go to the main page to display the error prominently
            }
        } else {
            setCurrentUser(null);
            setTeamMembers([]);
            setDashboardTeamMembers([]);
            setIsAdmin(false);
            setView('auth');
            resetState();
        }
        setIsAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // Only fetch data if there isn't a critical error from the auth listener
    if (!error) {
      fetchData();
    }
  }, [fetchData, error]);


  const handleLogout = async () => {
      await doSignOut();
  }
  
  const handleSelectTeamMember = (memberId: string) => {
      const member = teamMembers.find(m => m.id === memberId);
      if (member) {
          setSelectedTeamMember(member);
          const previousActionItems = member.previousMeeting?.actionItems || [];
          setActionItems(previousActionItems);
          if (previousActionItems.filter(item => item.status !== 'Completed').length > 0) {
              setView('review');
          } else {
              setView('setup');
          }
      }
  };

  const handleStartSimulation = (memberId: string) => {
    const member = teamMembers.find(m => m.id === memberId);
    if (member) {
        setSelectedTeamMember(member);
        setView('simulator');
    }
  }

  const handlePreMeetingReviewComplete = (updatedActionItems: ActionItem[]) => {
      setActionItems(updatedActionItems);
      setView('setup');
  };

  const handleStartMeeting = useCallback(async (details: MeetingDetails) => {
    setIsLoading(true);
    setError(null);
    try {
      const aiAgendaPoints = await generateAgenda(details);
      const aiAgenda: AgendaItem[] = aiAgendaPoints.map(point => ({ id: crypto.randomUUID(), text: point, completed: false, source: 'ai', notes: '' }));
      
      const employeeAgendaPoints = selectedTeamMember?.previousMeeting?.employeeTalkingPoints || [];
      const employeeAgenda: AgendaItem[] = employeeAgendaPoints.map(point => ({ id: crypto.randomUUID(), text: point, completed: false, source: 'employee', notes: '' }));

      setMeetingDetails(details);
      setAgenda([...aiAgenda, ...employeeAgenda]);
      
      setView('workspace');
    } catch (err) {
      setError('Failed to generate agenda. Please check your API key and try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedTeamMember]);
  
  const constructFullNotes = (
      agendaItems: AgendaItem[], 
      coachingConvos: Conversation[], 
      feedbackConvos: Conversation[]
  ): string => {
      const agendaNotes = agendaItems
          .filter(item => item.notes)
          .map(item => `- Notes on "${item.text}": ${item.notes}`)
          .join('\n');

      const coachingNotes = coachingConvos
          .map(convo => `- Coaching Question: "${convo.question}"\n  - Response: ${convo.response}`)
          .join('\n');

      const feedbackNotes = feedbackConvos
          .map(convo => `- Feedback Question: "${convo.question}"\n  - Response: ${convo.response}`)
          .join('\n');
      
      return [
          "Key discussion points from agenda:",
          agendaNotes || "No notes taken on agenda items.",
          "\nCoaching Conversation:",
          coachingNotes || "No coaching conversation recorded.",
          "\nManager Feedback Received:",
          feedbackNotes || "No feedback recorded."
      ].join('\n');
  };

  const handleEndMeeting = useCallback(async (
    finalAgenda: AgendaItem[],
    finalActionItems: ActionItem[],
    coachingData: Conversation[],
    feedbackData: Conversation[]
  ) => {
    if (!meetingDetails) return;
    setIsLoading(true);
    setError(null);

    setCoachingConversations(coachingData);
    setFeedbackConversations(feedbackData);

    try {
      const comprehensiveNotes = constructFullNotes(finalAgenda, coachingData, feedbackData);
      const summaryResult = await generateSummary({
        details: meetingDetails,
        agenda: finalAgenda,
        notes: comprehensiveNotes,
        actionItems: finalActionItems,
      });
      setSummaryData({ summary: summaryResult, actionItems: finalActionItems });
      setView('summary');
    } catch (err) {
      setError('Failed to generate summary. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [meetingDetails]);

  const resetState = () => {
    setSelectedTeamMember(null);
    setMeetingDetails(null);
    setAgenda([]);
    setActionItems([]);
    setCoachingConversations([]);
    setFeedbackConversations([]);
    setError(null);
    setSummaryData(null);
  };

  const handleFinishMeetingCycle = async () => {
    if (selectedTeamMember && meetingDetails && summaryData && currentUser) {
        const comprehensiveNotes = constructFullNotes(agenda, coachingConversations, feedbackConversations);

        const newMeetingRecord: Omit<MeetingRecord, 'id'> = {
            date: new Date().toISOString().split('T')[0],
            sentiment: meetingDetails.sentiment,
            focus: meetingDetails.meetingFocus || 'General Catch-up',
            strengths: [...meetingDetails.employeeStrengths, meetingDetails.employeeStrengthsOther].filter(Boolean) as string[],
            challenges: [...meetingDetails.employeeChallenges, meetingDetails.employeeChallengesOther].filter(Boolean) as string[],
            projectStatus: meetingDetails.projectStatus,
            impactScore: summaryData.summary.impactScore
        };
        
        const newPreviousMeeting: TeamMember['previousMeeting'] = { 
            notes: comprehensiveNotes, 
            actionItems: summaryData.actionItems,
            employeeTalkingPoints: [],
            strengths: newMeetingRecord.strengths,
            challenges: newMeetingRecord.challenges,
            projectStatus: newMeetingRecord.projectStatus,
            careerAspirations: meetingDetails.careerAspirations,
        };
        
        await finalizeMeeting(currentUser.uid, selectedTeamMember.id, newMeetingRecord, newPreviousMeeting, meetingDetails.careerAspirations);
        const updatedMembers = await getTeamMembers(currentUser.uid, currentUser.organizationId);
        setTeamMembers(updatedMembers);
    }
    
    setView('main');
    resetState();
  };

  const handleAddTeamMember = async (member: Omit<TeamMember, 'id' | 'userId' | 'previousMeeting' | 'meetingHistory' | 'organizationId'>) => {
      if (!currentUser) throw new Error("User not logged in.");
      try {
        const newMember = await addTeamMember(currentUser.uid, currentUser.organizationId, member);
        setTeamMembers(prev => [...prev, newMember]);
      } catch (error) {
        console.error("Error adding team member:", error);
        throw new Error("Failed to add team member. This could be due to a network issue or database permissions. Please try again.");
      }
  };

  const handleUpdateTeamMember = async (updatedMember: TeamMember) => {
      if (!currentUser) throw new Error("User not logged in.");
      try {
        await updateTeamMember(currentUser.uid, updatedMember);
        setTeamMembers(prev => prev.map(m => m.id === updatedMember.id ? updatedMember : m));
      } catch (error) {
        console.error("Error updating team member:", error);
        throw new Error("Failed to update team member. Please check your connection and try again.");
      }
  };
  
  const handleDeleteTeamMember = async (memberId: string) => {
      if (!currentUser) return;
      await deleteTeamMember(currentUser.uid, memberId);
      setTeamMembers(prev => prev.filter(m => m.id !== memberId));
  };
  
  const renderContent = () => {
    if (isAuthLoading) {
      return (
        <div className="flex justify-center items-center h-screen">
          <Spinner />
        </div>
      );
    }

    if (!currentUser) {
        return <AuthPage />;
    }
    
    switch (view) {
      case 'auth':
        return <AuthPage />;
      case 'main':
        return <MainPage 
            teamMembers={teamMembers}
            dashboardTeamMembers={isAdmin ? dashboardTeamMembers : teamMembers}
            isAdmin={isAdmin} 
            isLoading={isLoading}
            error={error}
            onSelectMember={handleSelectTeamMember} 
            onStartSimulation={handleStartSimulation}
            onAddMember={handleAddTeamMember}
            onUpdateMember={handleUpdateTeamMember}
            onDeleteMember={handleDeleteTeamMember}
            onRetry={fetchData}
          />;
      case 'review':
        if (selectedTeamMember) {
            return <PreMeetingReview 
                        teamMember={selectedTeamMember} 
                        actionItems={actionItems}
                        onComplete={handlePreMeetingReviewComplete}
                    />;
        }
        return null;
      case 'setup':
        return <MeetingSetup 
                    onStart={handleStartMeeting} 
                    isLoading={isLoading} 
                    error={error} 
                    teamMember={selectedTeamMember}
                />;
      case 'workspace':
        if (meetingDetails && selectedTeamMember) {
          return <MeetingWorkspace
            meetingDetails={meetingDetails}
            agenda={agenda}
            setAgenda={setAgenda}
            actionItems={actionItems}
            setActionItems={setActionItems}
            onEndMeeting={handleEndMeeting}
            isSummarizing={isLoading}
            previousMeeting={selectedTeamMember.previousMeeting}
            meetingHistory={selectedTeamMember.meetingHistory}
          />;
        }
        return null;
      case 'summary':
        if (summaryData) {
          return <MeetingSummary summaryData={summaryData} onStartNew={handleFinishMeetingCycle} />;
        }
        return null;
       case 'simulator':
        if (selectedTeamMember) {
            return <ConversationSimulator teamMember={selectedTeamMember} onBack={handleFinishMeetingCycle} />;
        }
        return null;
      default:
        return <AuthPage />;
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 font-sans">
      <Header 
        onHome={() => {
            if(currentUser) {
              setView('main');
              resetState();
            }
        }}
        onLogout={handleLogout}
        isLoggedIn={!!currentUser} 
      />
      <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        {renderContent()}
      </main>
    </div>
  );
};

export default App;
