// Import Firebase types for type safety. The actual Firebase object is loaded globally.
// @google/genai-fix: Changed `import * as Firebase` to a default import to correctly load the Firebase compat library, which fixes the type of the global `firebase` variable.
import Firebase from "firebase/compat/app";
// These imports augment the 'firebase' type definition.
import "firebase/compat/auth";
import "firebase/compat/firestore";

import { getFirebaseAuth, getDB, isFirebaseConfigured } from "../config/firebase";
import { TeamMember, MeetingRecord, AppUser } from "../types";

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

  // Step 1: Create the user in Firebase Auth
  const userCredential = await auth.createUserWithEmailAndPassword(email, password);
  const user = userCredential.user;

  if (!user) {
    throw new Error("User creation failed. No user returned from Firebase Auth.");
  }

  // Step 2 & 3: Use a batch write to atomically create the organization and user profile.
  // This ensures that either both documents are created successfully, or none are.
  // This is the most robust way to handle multi-document creation on sign-up.
  try {
    const batch = db.batch();

    // Define a reference for the new organization
    const orgRef = db.collection("organizations").doc();
    batch.set(orgRef, { 
        name: organizationName, 
        createdAt: firebase.firestore.Timestamp.now() 
    });

    // Define a reference for the new user's profile
    const userRef = db.collection("users").doc(user.uid);
    batch.set(userRef, {
        email: user.email,
        organizationId: orgRef.id // Use the generated ID of the new organization
    });

    // Commit the batch
    await batch.commit();

    return user;
  } catch (dbError) {
    // If the database write fails, we should delete the newly created auth user
    // to allow them to try signing up again without getting an "email already in use" error.
    console.error("Firestore batch write failed during sign up. Deleting auth user.", dbError);
    await user.delete();
    // Re-throw the original database error to be displayed to the user.
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
    const docSnap = await userDocRef.get();
    if (docSnap.exists) {
        return { uid, ...docSnap.data() } as AppUser;
    }
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

export const getAllTeamDataForAdmin = async (organizationId: string): Promise<TeamMember[]> => {
    if (!isFirebaseConfigured) return [];
    const db = getDB();
    
    // Query the collection group but filter strictly by the admin's organizationId
    const membersQuery = db.collectionGroup('teamMembers').where("organizationId", "==", organizationId);
    const snapshot = await membersQuery.get();

    const members: TeamMember[] = await Promise.all(snapshot.docs.map(async (memberDoc) => {
        const memberData = memberDoc.data();
        // The path to the history subcollection is part of the member's document reference path.
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
