import firebase from "firebase/compat/app";
import {
  User
} from "firebase/auth";
import { getFirebaseAuth, getDB, isFirebaseConfigured } from "../config/firebase";
import { TeamMember, MeetingRecord, AppUser } from "../types";

const NOT_CONFIGURED_ERROR = new Error("Firebase is not configured. Please add your Firebase project configuration to `config/firebase.ts`.");

// --- AUTH FUNCTIONS ---

export const onAuthStateChanged = (callback: (user: User | null) => void) => {
  if (!isFirebaseConfigured) {
      console.error(NOT_CONFIGURED_ERROR.message);
      callback(null);
      return () => {}; // Return an empty unsubscribe function
  }
  try {
      const auth = getFirebaseAuth();
      // Fix: Use v8-compat onAuthStateChanged
      return auth.onAuthStateChanged(callback);
  } catch (error) {
      console.error("Firebase Auth Error in onAuthStateChanged:", error);
      callback(null);
      return () => {};
  }
};

export const signUp = async (email: string, password: string, organizationName: string): Promise<User> => {
  if (!isFirebaseConfigured) return Promise.reject(NOT_CONFIGURED_ERROR);
  const auth = getFirebaseAuth();
  const db = getDB();

  // Step 1: Create the user in Firebase Auth
  // Fix: Use v8-compat createUserWithEmailAndPassword
  const userCredential = await auth.createUserWithEmailAndPassword(email, password);
  const user = userCredential.user;

  if (!user) {
    throw new Error("User creation failed.");
  }

  // Step 2: Handle organization and create user profile
  const organizationsRef = db.collection("organizations");
  const usersRef = db.collection("users");

  // Use a transaction to safely find or create the organization
  const organizationId = await db.runTransaction(async (transaction) => {
    // Fix: Use v8-compat query syntax
    const orgQuery = organizationsRef.where("name", "==", organizationName);
    const querySnapshot = await transaction.get(orgQuery);
    
    if (!querySnapshot.empty) {
      // Organization exists, return its ID
      return querySnapshot.docs[0].id;
    } else {
      // Organization doesn't exist, create it
      const newOrgRef = organizationsRef.doc();
      transaction.set(newOrgRef, { name: organizationName, createdAt: firebase.firestore.Timestamp.now() });
      return newOrgRef.id;
    }
  });

  // Step 3: Create the user's profile document in Firestore
  const userProfile: Omit<AppUser, 'uid'> = {
    email: user.email,
    organizationId,
  };
  // Fix: Use v8-compat set
  await usersRef.doc(user.uid).set(userProfile);

  return user;
};


export const signIn = async (email: string, password: string): Promise<User> => {
  if (!isFirebaseConfigured) return Promise.reject(NOT_CONFIGURED_ERROR);
  const auth = getFirebaseAuth();
  // Fix: Use v8-compat signInWithEmailAndPassword
  const userCredential = await auth.signInWithEmailAndPassword(email, password);
  if (!userCredential.user) {
    throw new Error("Sign in failed, user not found.");
  }
  return userCredential.user;
};

export const doSignOut = (): Promise<void> => {
  if (!isFirebaseConfigured) return Promise.resolve();
  const auth = getFirebaseAuth();
  // Fix: Use v8-compat signOut
  return auth.signOut();
};

export const getUserProfile = async (uid: string): Promise<AppUser | null> => {
    if (!isFirebaseConfigured) return null;
    const db = getDB();
    // Fix: Use v8-compat doc().get()
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
    // Fix: Use v8-compat collection path
    return db.collection('users').doc(userId).collection('teamMembers');
}


export const getTeamMembers = async (userId: string, organizationId: string): Promise<TeamMember[]> => {
  if (!isFirebaseConfigured) return [];
  const db = getDB();
  
  // Scoped to user and organization for security
  const teamMembersCol = getTeamMembersCollection(userId);
  // Fix: Use v8-compat query syntax
  const q = teamMembersCol.where("organizationId", "==", organizationId);
  const snapshot = await q.get();
  
  const members: TeamMember[] = await Promise.all(snapshot.docs.map(async (memberDoc) => {
    const memberData = memberDoc.data();
    // Fix: Use v8-compat collection path and query
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
    // Fix: Use v8-compat add
    const docRef = await getTeamMembersCollection(userId).add(newMemberData);
    return { ...newMemberData, id: docRef.id, meetingHistory: [] };
};

export const updateTeamMember = async (userId: string, member: TeamMember): Promise<void> => {
    if (!isFirebaseConfigured) return Promise.reject(NOT_CONFIGURED_ERROR);
    const db = getDB();
    // Fix: Use v8-compat doc().update()
    const memberDocRef = db.collection('users').doc(userId).collection('teamMembers').doc(member.id);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, meetingHistory, ...dataToUpdate } = member; 
    await memberDocRef.update(dataToUpdate);
};

export const deleteTeamMember = async (userId: string, memberId: string): Promise<void> => {
    if (!isFirebaseConfigured) return Promise.reject(NOT_CONFIGURED_ERROR);
    const db = getDB();
    // Fix: Use v8-compat doc().delete()
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
    // Fix: Use v8-compat batch
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
    // Fix: Use v8-compat collectionGroup and query
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
