'use client';

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import type { User, Resident, DocumentRequest, DocumentRequestStatus, Role } from '@/lib/types';
import { users as initialUsersData } from '@/lib/data';
import {
  useCollection,
  useFirebase,
  useMemoFirebase,
  setDocumentNonBlocking,
  updateDocumentNonBlocking,
  deleteDocumentNonBlocking,
  initiateSignOut,
  initiateEmailSignIn,
} from '@/firebase';
import { collection, doc, writeBatch, getDoc, setDoc, query, where, getDocs } from 'firebase/firestore';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { createUserWithEmailAndPassword, fetchSignInMethodsForEmail, deleteUser as deleteAuthUser, signInWithEmailAndPassword } from 'firebase/auth';

interface AppContextType {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  logout: () => void;
  residents: Resident[] | null;
  addResident: (resident: Omit<Resident, 'id' | 'userId' | 'avatarUrl' | 'address'>) => void;
  updateResident: (resident: Resident) => void;
  deleteResident: (residentId: string) => void;
  documentRequests: DocumentRequest[] | null;
  addDocumentRequest: (request: Omit<DocumentRequest, 'id' | 'trackingNumber' | 'requestDate' | 'status'>) => void;
  updateDocumentRequestStatus: (id: string, status: DocumentRequestStatus) => void;
  users: User[] | null;
  addUser: (user: Omit<User, 'id' | 'avatarUrl'>) => void;
  updateUser: (user: User) => void;
  deleteUser: (userId: string) => void;
  isDataLoading: boolean;
  login: (credential: string, password: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

function AppProviderContent({ children }: { children: ReactNode }) {
  const { firestore, auth } = useFirebase();
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Gated queries: these will only run when `currentUser` is not null.
  const usersQuery = useMemoFirebase(() => (firestore && currentUser ? collection(firestore, 'users') : null), [firestore, currentUser]);
  const { data: users, isLoading: isUsersLoading } = useCollection<User>(usersQuery);

  const residentsQuery = useMemoFirebase(() => (firestore && currentUser ? collection(firestore, 'residents') : null), [firestore, currentUser]);
  const { data: residents, isLoading: isResidentsLoading } = useCollection<Resident>(residentsQuery);

  const documentRequestsQuery = useMemoFirebase(() => (firestore && currentUser ? collection(firestore, 'documentRequests') : null), [firestore, currentUser]);
  const { data: documentRequests, isLoading: isRequestsLoading } = useCollection<DocumentRequest>(documentRequestsQuery);

  const isDataLoading = !currentUser || isUsersLoading || isResidentsLoading || isRequestsLoading;

  const login = async (credential: string, password: string) => {
    if (!auth || !firestore) throw new Error("Auth/Firestore service not available.");

    let emailToLogin = credential;
    
    // Check if the credential is a resident ID (doesn't contain '@')
    if (!credential.includes('@')) {
        const q = query(collection(firestore, "residents"), where("userId", "==", credential));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
            const residentDoc = querySnapshot.docs[0];
            const userDoc = await getDoc(doc(firestore, 'users', residentDoc.id));
            if (userDoc.exists()) {
                emailToLogin = userDoc.data().email;
            } else {
                throw new Error("User record not found for this resident ID.");
            }
        } else {
             // If not found as a resident ID, it might be an email for a staff member.
             // We let it proceed with the original credential as email.
             console.log(`Could not find resident with User ID: ${credential}. Attempting login with credential as email.`);
        }
    }
    
    await signInWithEmailAndPassword(auth, emailToLogin, password);
  };

  const logout = () => {
    if (!auth) return;
    initiateSignOut(auth);
    setCurrentUser(null);
  };

  const addResident = async (newResidentData: Omit<Resident, 'id' | 'userId' | 'avatarUrl' | 'address'>) => {
    if (!firestore || !auth) return;
    
    const defaultPassword = 'password';

    try {
      const newAuthUserRef = doc(collection(firestore, 'temp'));
      const tempEmail = `${newAuthUserRef.id}@ibarangay.local`;

      // Step 1: Create the user in Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, tempEmail, defaultPassword);
      const authUser = userCredential.user;
      
      const batch = writeBatch(firestore);

      const residentId = authUser.uid;
      const userId = `R-${Math.floor(Date.now() / 1000).toString().slice(-6)}`;

      // Step 2: Create the resident document in /residents collection
      const newResident: Resident = {
        ...newResidentData,
        id: residentId,
        userId: userId,
        address: `${newResidentData.purok}, Brgy. Mina De Oro, Bongabong, Oriental Mindoro`,
        avatarUrl: `https://picsum.photos/seed/${residentId}/100/100`,
      };
      const residentRef = doc(firestore, 'residents', residentId);
      batch.set(residentRef, newResident);

      // Step 3: Create the user document in /users collection
      const newUser: User = {
        id: residentId,
        name: `${newResidentData.firstName} ${newResidentData.lastName}`,
        email: tempEmail,
        avatarUrl: newResident.avatarUrl,
        role: 'Resident',
        residentId: residentId,
      };
      const userRef = doc(firestore, 'users', residentId);
      batch.set(userRef, newUser);

      // Step 4: Commit all writes at once
      await batch.commit();

    } catch (error: any) {
      console.error("Error creating new resident:", error);
      if (error.code === 'auth/email-already-in-use') {
         throw new Error("An account for this resident might already exist.");
      }
       throw new Error("Failed to create resident account.");
    }
  };

  const updateResident = (updatedResident: Resident) => {
    if (!firestore) return;
    const residentRef = doc(firestore, 'residents', updatedResident.id);
    updateDocumentNonBlocking(residentRef, updatedResident);

    // Also update the name in the corresponding user document
    const userRef = doc(firestore, 'users', updatedResident.id);
    updateDocumentNonBlocking(userRef, { name: `${updatedResident.firstName} ${updatedResident.lastName}` });
  };

  const deleteResident = async (residentId: string) => {
    if (!firestore || !auth) return;
    console.warn("Warning: Deleting Firestore documents only. The Firebase Auth user must be deleted manually from the Firebase Console or via a backend function.");
    
    const batch = writeBatch(firestore);
    const residentRef = doc(firestore, 'residents', residentId);
    const userRef = doc(firestore, 'users', residentId);

    batch.delete(residentRef);
    batch.delete(userRef);
    
    await batch.commit();
  };

  const addDocumentRequest = (request: Omit<DocumentRequest, 'id' | 'trackingNumber' | 'requestDate' | 'status'>) => {
    if (!firestore || !documentRequests) return;
    const newId = doc(collection(firestore, 'documentRequests')).id;
    const newIdNumber = documentRequests.length + 1;
    const newRequest: DocumentRequest = {
        ...request,
        id: newId,
        requestDate: new Date().toISOString().split('T')[0], // YYYY-MM-DD
        status: 'Pending',
        trackingNumber: `IBGY-${new Date().getFullYear().toString().slice(2)}${(new Date().getMonth() + 1).toString().padStart(2, '0')}${new Date().getDate().toString().padStart(2, '0')}${String(newIdNumber).padStart(3, '0')}`,
    };
    const requestRef = doc(firestore, 'documentRequests', newId);
    setDocumentNonBlocking(requestRef, newRequest, { merge: true });
  };

  const updateDocumentRequestStatus = (id: string, status: DocumentRequestStatus) => {
    if (!firestore) return;
    const requestRef = doc(firestore, 'documentRequests', id);
    updateDocumentNonBlocking(requestRef, { status });
  };

  const addUser = async (user: Omit<User, 'id' | 'avatarUrl'>) => {
    if (!firestore || !auth) return;
    
    try {
      // Step 1: Create the user in Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, user.email, 'password');
      const authUser = userCredential.user;
      
      // Step 2: Create the user document in Firestore
      const newUser: User = {
        ...user,
        id: authUser.uid,
        avatarUrl: `https://picsum.photos/seed/${authUser.uid}/100/100`,
      };
      const userRef = doc(firestore, 'users', authUser.uid);
      await setDoc(userRef, newUser, { merge: true });
    } catch (error: any) {
      console.error("Error creating auth user:", error);
      if (error.code === 'auth/email-already-in-use') {
        throw new Error("This email is already in use. Please use a different email.");
      }
      throw new Error("Failed to create user.");
    }
  };

  const updateUser = (updatedUser: User) => {
    if (!firestore) return;
    const userRef = doc(firestore, 'users', updatedUser.id);
    // Do not update email from here as it's a sensitive operation
    const { email, ...rest } = updatedUser;
    updateDocumentNonBlocking(userRef, rest);
  };

  const deleteUser = (userId: string) => {
    if (!firestore || !auth) return;
    console.warn("Warning: Deleting user from Firestore only. Auth user remains and should be deleted from the Firebase Console or via a backend function.");
    const userRef = doc(firestore, 'users', userId);
    deleteDocumentNonBlocking(userRef);
  };

  return (
    <AppContext.Provider value={{
      currentUser,
      setCurrentUser,
      logout,
      residents,
      addResident,
      updateResident,
      deleteResident,
      documentRequests,
      addDocumentRequest,
      updateDocumentRequestStatus,
      users,
      addUser,
      updateUser,
      deleteUser,
      isDataLoading,
      login,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function AppProvider({ children }: { children: ReactNode }) {
  return (
    <FirebaseClientProvider>
      <AppProviderContent>{children}</AppProviderContent>
    </FirebaseClientProvider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}
