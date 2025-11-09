// Import Firebase types for type safety. The actual Firebase object is loaded globally.
// @google/genai-fix: Changed `import * as Firebase` to a default import to correctly load the Firebase compat library, which fixes the type of the global `firebase` variable.
import Firebase from "firebase/compat/app";
// These imports augment the 'firebase' type definition.
import "firebase/compat/auth";
import "firebase/compat/firestore";

import { getFirebaseAuth, getDB, isFirebaseConfigured } from "../config/firebase";
import { TeamMember, MeetingRecord, AppUser, Organization } from "../types";

// This tells TypeScript that the 'firebase' object (from the global script) exists and has the correct types.
// FIX: Use the imported 'Firebase' type to correctly type the global constant.
// @google/genai-fix: Changed to 'typeof Firebase' to use the type of the imported namespace, resolving the "Cannot use namespace as a type" error.
declare const firebase: typeof Firebase;


const NOT_CONFIGURED_ERROR = new Error("Firebase is not configured. Please add your Firebase project configuration to `config/firebase.ts`.");

// --- AUTH FUNCTIONS ---

// FIX: The 'User' type is not available as a direct import. Use 'firebase.User' to reference the type from the global namespace.
// @google/genai-fix: Corrected the Firebase User type from `firebase.auth.User` to `Firebase.User`. The User type is on the root `firebase` namespace.
export const onAuthStateChanged = (callback: (user: Firebase.User | null) => void) => {
  if (!isFirebaseConfigured) {
      console.error(NOT_CONFIGURED_ERROR.message);
      callback(null);
      return () => {}; // Return an empty unsubscribe function
  }
  try {
      const auth = getFirebaseAuth();
      return auth.onAuthStateChanged(callback);
  } catch (error) {
      console.error("Firebase Auth Error in onAuthStateChanged:", error);
      callback(null);
      return () => {};
  }
};

// FIX: The 'User' type is not available as a direct import. Use 'firebase.User' to reference the type from the global namespace.
// @google/genai-fix: Corrected the Firebase User type from `firebase.auth.User` to `Firebase.User`. The User type is on the root `firebase` namespace.
export const signUp = async (email: string, password: string, organizationName: string): Promise<Firebase.User> => {
    if (!isFirebaseConfigured) return Promise.reject(NOT_CONFIGURED_ERROR);
    const auth = getFirebaseAuth();
    const db = getDB();

    // Step 1: Create the user in Firebase Auth FIRST. This makes them authenticated for subsequent DB operations.
    const userCredential = await auth.createUserWithEmailAndPassword(email, password);
    const user = userCredential.user;

    if (!user) {
        throw new Error("User creation failed. No user returned from Firebase Auth.");
    }

    // Step 2: Now that user is authenticated, perform all database operations.
    // Wrap in a try/catch to roll back auth user creation on any database failure.
    try {
        // Find or Create the Organization ID
        const orgsRef = db.collection('organizations');
        const orgQuery = await orgsRef.where('name', '==', organizationName.trim()).limit(1).get();
        
        let orgId: string;
        if (orgQuery.empty) {
            const newOrgRef = await orgsRef.add({ name: organizationName.trim() });
            orgId = newOrgRef.id;
        } else {
            orgId = orgQuery.docs[0].id;
        }

        // Create the user profile document in Firestore.
        const userRef = db.collection("users").doc(user.uid);
        await userRef.set({
            email: user.email,
            organizationId: orgId,
        });

        // Step 3: Verify the profile was created before finishing to avoid race conditions on the client.
        const profile = await pollForUserProfile(user.uid, 5, 500); // Poll for ~2.5 seconds
        if (!profile) {
            throw new Error("Profile verification failed. The database write could not be confirmed.");
        }

        return user;
    } catch (dbError) {
        // If ANY database operation fails, we MUST delete the auth user to prevent a stuck account.
        console.error("Firestore operation failed during sign up. Deleting auth user to allow retry.", dbError);
        await user.delete();
        // Re-throw the original database error so it's visible to the user.
        throw dbError;
    }
};


// FIX: The 'User' type is not available as a direct import. Use 'firebase.User' to reference the type from the global namespace.
// @google/genai-fix: Corrected the Firebase User type from `firebase.auth.User` to `Firebase.User`. The User type is on the root `firebase` namespace.
export const signIn = async (email: string, password: string): Promise<Firebase.User> => {
  if (!isFirebaseConfigured) return Promise.reject(NOT_CONFIGURED_ERROR);
  const auth = getFirebaseAuth();
  const userCredential = await auth.signInWithEmailAndPassword(email, password);
  if (!userCredential.user) {
    throw new Error("Sign in failed, user not found.");
  }
  return userCredential.user;
};

export const doSignOut = (): Promise<void> => {
  if (!isFirebaseConfigured) return Promise.resolve();
  const auth = getFirebaseAuth();
  return auth.signOut();
};

export const getUserProfile = async (uid: string): Promise<AppUser | null> => {
    if (!isFirebaseConfigured) return null;
    const db = getDB();
    const userDocRef = db.collection('users').doc(uid);
    try {
        const docSnap = await userDocRef.get();
        if (docSnap.exists) {
            return { uid, ...docSnap.data() } as AppUser;
        }
        return null;
    } catch (error) {
        console.error("Error fetching user profile:", error);
        return null;
    }
}

/**
 * A helper function to poll for a user profile document after creation.
 * This is used to mitigate Firestore replication delays.
 */
const pollForUserProfile = async (uid: string, retries = 5, delay = 1000): Promise<AppUser | null> => {
    for (let i = 0; i < retries; i++) {
        const userProfile = await getUserProfile(uid);
        if (userProfile) {
            console.log(`User profile verified after ${i + 1} attempt(s).`);
            return userProfile;
        }
        if (i < retries - 1) {
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
    console.warn(`User profile could not be verified after ${retries} attempts.`);
    return null;
}


// --- TEAM MEMBER CRUD ---

const getTeamMembersCollection = (userId: string) => {
    const db = getDB();
    return db.collection('users').doc(userId).collection('teamMembers');
}


export const getTeamMembers = async (userId: string, organizationId: string): Promise<TeamMember[]> => {
  if (!isFirebaseConfigured) return [];
  const db = getDB();
  
  // Scoped to user and organization for security
  const teamMembersCol = getTeamMembersCollection(userId);
  const q = teamMembersCol.where("organizationId", "==", organizationId);
  const snapshot = await q.get();
  
  const members: TeamMember[] = await Promise.all(snapshot.docs.map(async (memberDoc) => {
    const memberData = memberDoc.data();
    const historyCol = db.collection('users').doc(userId).collection('teamMembers').doc(memberDoc.id).collection('meetingHistory');
    const historySnapshot = await historyCol.orderBy('date', 'desc').get();
    const meetingHistory = historySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MeetingRecord));

    return {
      id: memberDoc.id,
      name: memberData.name,
      role: memberData.role,
      careerAspirations: memberData.careerAspirations,
      previousMeeting: memberData.previousMeeting || null,
      userId: memberData.userId,
      organizationId: memberData.organizationId,
      meetingHistory,
    };
  }));

  return members;
};

export const addTeamMember = async (userId: string, organizationId: string, memberData: Omit<TeamMember, 'id' | 'userId' | 'previousMeeting' | 'meetingHistory' | 'organizationId'>): Promise<TeamMember> => {
    if (!isFirebaseConfigured) return Promise.reject(NOT_CONFIGURED_ERROR);
    const newMemberData = {
        ...memberData,
        userId,
        organizationId,
        previousMeeting: null,
    };
    const docRef = await getTeamMembersCollection(userId).add(newMemberData);
    return { ...newMemberData, id: docRef.id, meetingHistory: [] };
};

export const updateTeamMember = async (userId: string, member: TeamMember): Promise<void> => {
    if (!isFirebaseConfigured) return Promise.reject(NOT_CONFIGURED_ERROR);
    const db = getDB();
    const memberDocRef = db.collection('users').doc(userId).collection('teamMembers').doc(member.id);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, meetingHistory, ...dataToUpdate } = member; 
    await memberDocRef.update(dataToUpdate);
};

export const deleteTeamMember = async (userId: string, memberId: string): Promise<void> => {
    if (!isFirebaseConfigured) return Promise.reject(NOT_CONFIGURED_ERROR);
    const db = getDB();
    const memberDocRef = db.collection('users').doc(userId).collection('teamMembers').doc(memberId);
    await memberDocRef.delete();
};


// --- MEETING CYCLE MANAGEMENT ---

export const finalizeMeeting = async (
    userId: string,
    memberId: string,
    newRecord: Omit<MeetingRecord, 'id'>,
    newPreviousMeeting: TeamMember['previousMeeting'],
    newCareerAspirations: string
) => {
    if (!isFirebaseConfigured) return Promise.reject(NOT_CONFIGURED_ERROR);
    const db = getDB();
    const batch = db.batch();

    // 1. Add new record to meetingHistory subcollection
    const historyCol = db.collection('users').doc(userId).collection('teamMembers').doc(memberId).collection('meetingHistory');
    const newHistoryDocRef = historyCol.doc();
    batch.set(newHistoryDocRef, newRecord);

    // 2. Update the parent teamMember document
    const memberDocRef = db.collection('users').doc(userId).collection('teamMembers').doc(memberId);
    batch.update(memberDocRef, {
        previousMeeting: newPreviousMeeting,
        careerAspirations: newCareerAspirations,
    });
    
    await batch.commit();
};


// --- ADMIN ANALYTICS ---

export const getAllOrganizations = async (): Promise<Organization[]> => {
    if (!isFirebaseConfigured) return [];
    const db = getDB();
    const snapshot = await db.collection('organizations').get();
    return snapshot.docs.map(doc => ({ id: doc.id, name: doc.data().name as string }));
}

export const getManagersForOrganization = async (organizationId: string): Promise<AppUser[]> => {
    if (!isFirebaseConfigured) return [];
    const db = getDB();
    const snapshot = await db.collection('users').where('organizationId', '==', organizationId).get();
    return snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as AppUser));
}

export const getTeamDataForOrg = async (organizationId: string): Promise<TeamMember[]> => {
    if (!isFirebaseConfigured) return [];
    const db = getDB();
    
    const membersQuery = db.collectionGroup('teamMembers').where('organizationId', '==', organizationId);
    const snapshot = await membersQuery.get();

    const members: TeamMember[] = await Promise.all(snapshot.docs.map(async (memberDoc) => {
        const memberData = memberDoc.data();
        const historyCol = memberDoc.ref.collection('meetingHistory');
        const historySnapshot = await historyCol.orderBy('date', 'desc').get();
        const meetingHistory = historySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MeetingRecord));

        return {
            id: memberDoc.id,
            ...memberData,
            meetingHistory,
        } as TeamMember;
    }));
    
    return members;
};
