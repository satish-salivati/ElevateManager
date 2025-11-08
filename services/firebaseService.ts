import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged as onFirebaseAuthStateChanged,
  User
} from "firebase/auth";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  doc,
  updateDoc,
  deleteDoc,
  writeBatch,
  Timestamp,
  collectionGroup,
  orderBy,
  limit,
  setDoc,
  getDoc,
  runTransaction
} from "firebase/firestore";
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
      return onFirebaseAuthStateChanged(auth, callback);
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
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  // Step 2: Handle organization and create user profile
  const organizationsRef = collection(db, "organizations");
  const usersRef = collection(db, "users");

  // Use a transaction to safely find or create the organization
  const organizationId = await runTransaction(db, async (transaction) => {
    const orgQuery = query(organizationsRef, where("name", "==", organizationName));
    const querySnapshot = await getDocs(orgQuery);
    
    if (!querySnapshot.empty) {
      // Organization exists, return its ID
      return querySnapshot.docs[0].id;
    } else {
      // Organization doesn't exist, create it
      const newOrgRef = doc(organizationsRef);
      transaction.set(newOrgRef, { name: organizationName, createdAt: Timestamp.now() });
      return newOrgRef.id;
    }
  });

  // Step 3: Create the user's profile document in Firestore
  const userProfile: Omit<AppUser, 'uid'> = {
    email: user.email,
    organizationId,
  };
  await setDoc(doc(usersRef, user.uid), userProfile);

  return user;
};


export const signIn = (email: string, password: string): Promise<User> => {
  if (!isFirebaseConfigured) return Promise.reject(NOT_CONFIGURED_ERROR);
  const auth = getFirebaseAuth();
  return signInWithEmailAndPassword(auth, email, password).then(userCredential => userCredential.user);
};

export const doSignOut = (): Promise<void> => {
  if (!isFirebaseConfigured) return Promise.resolve();
  const auth = getFirebaseAuth();
  return signOut(auth);
};

export const getUserProfile = async (uid: string): Promise<AppUser | null> => {
    if (!isFirebaseConfigured) return null;
    const db = getDB();
    const userDocRef = doc(db, 'users', uid);
    const docSnap = await getDoc(userDocRef);
    if (docSnap.exists()) {
        return { uid, ...docSnap.data() } as AppUser;
    }
    return null;
}


// --- TEAM MEMBER CRUD ---

const getTeamMembersCollection = (userId: string) => {
    const db = getDB();
    return collection(db, 'users', userId, 'teamMembers');
}


export const getTeamMembers = async (userId: string, organizationId: string): Promise<TeamMember[]> => {
  if (!isFirebaseConfigured) return [];
  const db = getDB();
  
  // Scoped to user and organization for security
  const teamMembersCol = getTeamMembersCollection(userId);
  const q = query(teamMembersCol, where("organizationId", "==", organizationId));
  const snapshot = await getDocs(q);
  
  const members: TeamMember[] = await Promise.all(snapshot.docs.map(async (memberDoc) => {
    const memberData = memberDoc.data();
    const historyCol = collection(db, 'users', userId, 'teamMembers', memberDoc.id, 'meetingHistory');
    const historySnapshot = await getDocs(query(historyCol, orderBy('date', 'desc')));
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
    const docRef = await addDoc(getTeamMembersCollection(userId), newMemberData);
    return { ...newMemberData, id: docRef.id, meetingHistory: [] };
};

export const updateTeamMember = async (userId: string, member: TeamMember): Promise<void> => {
    if (!isFirebaseConfigured) return Promise.reject(NOT_CONFIGURED_ERROR);
    const db = getDB();
    const memberDocRef = doc(db, 'users', userId, 'teamMembers', member.id);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, meetingHistory, ...dataToUpdate } = member; 
    await updateDoc(memberDocRef, dataToUpdate);
};

export const deleteTeamMember = async (userId: string, memberId: string): Promise<void> => {
    if (!isFirebaseConfigured) return Promise.reject(NOT_CONFIGURED_ERROR);
    const db = getDB();
    const memberDocRef = doc(db, 'users', userId, 'teamMembers', memberId);
    await deleteDoc(memberDocRef);
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
    const batch = writeBatch(db);

    // 1. Add new record to meetingHistory subcollection
    const historyCol = collection(db, 'users', userId, 'teamMembers', memberId, 'meetingHistory');
    const newHistoryDocRef = doc(historyCol);
    batch.set(newHistoryDocRef, newRecord);

    // 2. Update the parent teamMember document
    const memberDocRef = doc(db, 'users', userId, 'teamMembers', memberId);
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
    const membersQuery = query(
        collectionGroup(db, 'teamMembers'),
        where("organizationId", "==", organizationId)
    );
    const snapshot = await getDocs(membersQuery);

    const members: TeamMember[] = await Promise.all(snapshot.docs.map(async (memberDoc) => {
        const memberData = memberDoc.data();
        // The path to the history subcollection is part of the member's document reference path.
        const historyCol = collection(memberDoc.ref, 'meetingHistory');
        const historySnapshot = await getDocs(query(historyCol, orderBy('date', 'desc')));
        const meetingHistory = historySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MeetingRecord));

        return {
            id: memberDoc.id,
            ...memberData,
            meetingHistory,
        } as TeamMember;
    }));
    
    return members;
};