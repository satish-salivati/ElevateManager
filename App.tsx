import React, { useState, useCallback, useEffect } from 'react';
import { MeetingDetails, AgendaItem, ActionItem, MeetingSummaryData, MeetingRecord, TeamMember, Conversation, AppUser, AppError, Organization } from './types';
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
import { generateAgenda, generateFinalReport } from './services/geminiService';
import { 
    onAuthStateChanged, 
    doSignOut,
    getUserProfile,
    getTeamMembers,
    addTeamMember,
    updateTeamMember,
    deleteTeamMember,
    finalizeMeeting,
    getTeamDataForOrg,
    getAllOrganizations,
    getManagersForOrganization
} from './services/firebaseService';

const ADMIN_EMAIL = 'admin@elevatemanager.com'; // Hardcoded admin user for demo purposes

const FIRESTORE_RULES_GUIDE = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Function to check if the user is the admin
    function isAdmin() {
      // Check for the existence of the user document before trying to access its data.
      return exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.email == 'admin@elevatemanager.com';
    }

    // Users can create their own profile.
    // A user can read/update their own profile.
    // The admin user can read ANY user profile.
    match /users/{userId} {
      allow create: if request.auth != null;
      allow read: if request.auth.uid == userId || isAdmin();
      allow update: if request.auth.uid == userId;

      // Users can fully manage their own team members and meeting history.
      // The admin can read any team member's data and history for the dashboard.
      match /teamMembers/{memberId} {
        allow create, update, delete: if request.auth.uid == userId;
        allow read: if request.auth.uid == userId || isAdmin(); // Combined read rule
        
        match /meetingHistory/{historyId} {
          allow create, update, delete: if request.auth.uid == userId;
          allow read: if request.auth.uid == userId || isAdmin(); // Combined read rule
        }
      }
    }
    
    // This rule specifically allows the admin to perform the collectionGroup query
    // which is needed for the main organization dashboard.
    match /{path=**}/teamMembers/{memberId} {
      allow list: if isAdmin();
    }

    // Organizations can be queried, read, and created by any logged-in user.
    // 'list' is required for the sign-up query to check if an organization exists.
    match /organizations/{orgId} {
      allow list, read, create: if request.auth != null;
    }
  }
}`;

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

  // Admin dashboard specific state
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [managers, setManagers] = useState<AppUser[]>([]);
  const [selectedManagerId, setSelectedManagerId] = useState<string | null>(null);


  const [selectedTeamMember, setSelectedTeamMember] = useState<TeamMember | null>(null);

  const [meetingDetails, setMeetingDetails] = useState<MeetingDetails | null>(null);
  const [agenda, setAgenda] = useState<AgendaItem[]>([]);
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);
  const [coachingConversations, setCoachingConversations] = useState<Conversation[]>([]);
  const [feedbackConversations, setFeedbackConversations] = useState<Conversation[]>([]);

  const [summaryData, setSummaryData] = useState<MeetingSummaryData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<AppError | null>(null);
  
  if (!isFirebaseConfigured) {
    return <FirebaseConfigErrorPage />;
  }

  const handleAdminDataError = (err: unknown) => {
    const error = err as Error;
    const errorMessage = error.message || 'An unknown error occurred.';
    console.error("Failed to fetch admin data:", error);

    if (errorMessage.includes('The query requires an index')) {
          setError({
              type: 'ADMIN_ORG_INDEX_REQUIRED',
              message: "Admin Action Required: The organization dashboard needs a database index to function. Please open your browser's developer console (F12), find the error message from Firebase that contains a link, and click that link to create the index. This is a one-time setup. The index may take a few minutes to build. After it's ready, please refresh the page."
          });
    } else if (errorMessage.includes('Missing or insufficient permissions')) {
        setError({
            type: 'ADMIN_PERMISSIONS_REQUIRED',
            message: "Could not load admin dashboard data due to a permissions issue. Your Firestore Security Rules need to be updated to allow the admin account to read data across the organization.",
            details: FIRESTORE_RULES_GUIDE
        });
    } else {
        setError({
            type: 'FETCH_FAILED',
            message: "Could not load organization data. This may be due to a network issue or a problem with your Firestore setup. Please check the console for more details."
        });
    }
  }

  const fetchManagerData = useCallback(async () => {
    if (currentUser && currentUser.organizationId) {
        setIsLoading(true);
        setError(null);
        try {
            const members = await getTeamMembers(currentUser.uid, currentUser.organizationId);
            setTeamMembers(members);
            setDashboardTeamMembers(members); // For manager's own dashboard
        } catch (err) {
             setError({
                type: 'FETCH_FAILED',
                message: "Could not load your team data. Please check your connection and try again."
            });
        } finally {
            setIsLoading(false);
        }
    }
  }, [currentUser]);


  const fetchAdminDashboardData = useCallback(async () => {
    // This function fetches the data based on admin selections
    if (!isAdmin || !selectedOrgId) {
        setDashboardTeamMembers([]);
        return;
    }
    
    setIsLoading(true);
    setError(null);
    try {
        let members;
        if (selectedManagerId) {
            // If a manager is selected, fetch their specific team
            const manager = managers.find(m => m.uid === selectedManagerId);
            if(manager) {
                members = await getTeamMembers(manager.uid, manager.organizationId);
            } else {
                members = [];
            }
        } else {
            // Otherwise, fetch all team members for the selected organization
            members = await getTeamDataForOrg(selectedOrgId);
        }
        setDashboardTeamMembers(members);
    } catch(err) {
        handleAdminDataError(err);
    } finally {
        setIsLoading(false);
    }
  }, [isAdmin, selectedOrgId, selectedManagerId, managers]);


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(async (user) => {
        if (user) {
            const creationTime = user.metadata.creationTime ? new Date(user.metadata.creationTime).getTime() : 0;
            const isNewUser = (new Date().getTime() - creationTime) < 10000;

            let userProfile = await getUserProfile(user.uid);

            if (!userProfile && isNewUser) {
                userProfile = await pollForUserProfile(user.uid);
            }

            if (userProfile) {
                setCurrentUser(userProfile);
                const isAdminUser = userProfile.email === ADMIN_EMAIL;
                setIsAdmin(isAdminUser);
                setError(null);
                setView('main');

                if (isAdminUser) {
                    setIsLoading(true);
                    getAllOrganizations().then(setOrganizations).catch(handleAdminDataError).finally(() => setIsLoading(false));
                }
            } else {
                console.error("CRITICAL: User is authenticated but profile document is missing.");
                setCurrentUser({ uid: user.uid, email: user.email, organizationId: '' }); 
                setIsAdmin(user.email === ADMIN_EMAIL);
                setError({
                    type: 'PROFILE_CREATION_FAILED',
                    message: "Your account was created, but your profile could not be saved to the database. This is a common setup issue caused by restrictive default Firestore Security Rules.",
                    details: FIRESTORE_RULES_GUIDE
                });
                setView('main');
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

  // Effect for regular manager data fetching
  useEffect(() => {
    if (currentUser && !isAdmin && (!error || error.type !== 'PROFILE_CREATION_FAILED')) {
      fetchManagerData();
    }
  }, [currentUser, isAdmin, fetchManagerData, error]);

  // Effect for fetching managers when an organization is selected by admin
  useEffect(() => {
    if (isAdmin && selectedOrgId) {
      setIsLoading(true);
      setManagers([]); // Clear previous managers
      setSelectedManagerId(null); // Reset manager selection
      getManagersForOrganization(selectedOrgId).then(setManagers).catch(handleAdminDataError).finally(() => setIsLoading(false));
    }
  }, [isAdmin, selectedOrgId]);

  // Effect to fetch dashboard data whenever admin selections change
  useEffect(() => {
    if(isAdmin) {
        fetchAdminDashboardData();
    }
  }, [isAdmin, fetchAdminDashboardData]);

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
      setError({ type: 'FETCH_FAILED', message: 'Failed to generate agenda. Please check your API key and try again.'});
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

    setAgenda(finalAgenda);
    setActionItems(finalActionItems);
    setCoachingConversations(coachingData);
    setFeedbackConversations(feedbackData);

    try {
      const comprehensiveNotes = constructFullNotes(finalAgenda, coachingData, feedbackData);
      const finalReport = await generateFinalReport({
        details: meetingDetails,
        agenda: finalAgenda,
        notes: comprehensiveNotes,
        actionItems: finalActionItems,
      });
      setSummaryData({ 
        summary: finalReport.summary, 
        growthSuggestions: finalReport.growthSuggestions,
        actionItems: finalActionItems 
      });
      setView('summary');
    } catch (err) {
      setError({type: 'FETCH_FAILED', message: 'Failed to generate summary and suggestions. Please try again.'});
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
    // Do not reset admin selections on simple navigation
    // setSelectedOrgId(null);
    // setSelectedManagerId(null);
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
    }
    
    setView('main');
    resetState();
    fetchManagerData();
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
            dashboardTeamMembers={dashboardTeamMembers}
            isAdmin={isAdmin} 
            isLoading={isLoading}
            error={error}
            onSelectMember={handleSelectTeamMember} 
            onStartSimulation={handleStartSimulation}
            onAddMember={handleAddTeamMember}
            onUpdateMember={handleUpdateTeamMember}
            onDeleteMember={handleDeleteTeamMember}
            onRetry={isAdmin ? fetchAdminDashboardData : fetchManagerData}
            // Admin specific props
            organizations={organizations}
            selectedOrgId={selectedOrgId}
            onSelectOrg={setSelectedOrgId}
            managers={managers}
            selectedManagerId={selectedManagerId}
            onSelectManager={setSelectedManagerId}
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
                    error={error ? error.message : null} 
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
            return <ConversationSimulator teamMember={selectedTeamMember} onBack={() => { setView('main'); resetState(); }} />;
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
