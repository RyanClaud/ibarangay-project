'use client';

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import type { User, Resident, DocumentRequest, DocumentRequestStatus, Role } from '@/lib/types';
import { users as initialUsers, findUserByCredential } from '@/lib/data';
import {
  useCollection,
  useFirebase,
  useMemoFirebase,
  addDocumentNonBlocking,
  updateDocumentNonBlocking,
  setDocumentNonBlocking,
  deleteDocumentNonBlocking,
} from '@/firebase';
import { collection, doc, where, query } from 'firebase/firestore';
import { FirebaseClientProvider } from '@/firebase/client-provider';

interface AppContextType {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  login: (credential: string) => User | undefined;
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
}

const AppContext = createContext<AppContextType | undefined>(undefined);

function AppProviderContent({ children }: { children: ReactNode }) {
  const { firestore, user: firebaseUser, isUserLoading: isAuthLoading } = useFirebase();
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // 1. Fetch users only after Firebase Auth has confirmed a user is logged in.
  const usersQuery = useMemoFirebase(() => {
    if (!firestore || isAuthLoading || !firebaseUser) return null; // Don't query if no user
    return collection(firestore, 'users');
  }, [firestore, isAuthLoading, firebaseUser]);
  const { data: users, isLoading: isUsersLoading } = useCollection<User>(usersQuery);

  // 2. Determine the app's current user based on the Auth user and the fetched users list.
  useEffect(() => {
    if (isAuthLoading) {
      return; // Wait for auth to finish
    }
    if (!firebaseUser) {
      setCurrentUser(null); // No firebase user, so no app user
      return;
    }
    if (users) { // Wait for users collection to be loaded
      const appUser = users.find(u => u.id === firebaseUser.uid);
      setCurrentUser(appUser || null);
    }
  }, [firebaseUser, isAuthLoading, users]);


  // 3. Fetch other data only if we have determined the current app user.
  const residentsQuery = useMemoFirebase(() => (firestore && currentUser) ? collection(firestore, 'residents') : null, [firestore, currentUser]);
  const { data: residents, isLoading: isResidentsLoading } = useCollection<Resident>(residentsQuery);

  const documentRequestsQuery = useMemoFirebase(() => (firestore && currentUser) ? collection(firestore, 'documentRequests') : null, [firestore, currentUser]);
  const { data: documentRequests, isLoading: isRequestsLoading } = useCollection<DocumentRequest>(documentRequestsQuery);

  // 4. Consolidate loading state.
  const isDataLoading = isAuthLoading || (!!firebaseUser && (isUsersLoading || (!!currentUser && (isResidentsLoading || isRequestsLoading))));

  const login = (credential: string) => {
    // This function is just a placeholder for initiating login.
    // The actual user state change is handled by Firebase Auth and the effects above.
    const user = findUserByCredential(credential, initialUsers);
    if (user) {
        // In a real app, this would trigger Firebase's signInWithEmailAndPassword.
        // For the mockup, we simulate this by finding the user in the initial staff list
        // to show that the login attempt is valid. The actual state transition
        // will happen when Firebase Auth reports a signed-in user.
        console.log("Login attempt for:", user.email);
    }
    return user;
  };

  const logout = () => {
    // In a real app: signOut(auth);
    // The onAuthStateChanged listener will then set firebaseUser to null.
    setCurrentUser(null);
  };

  const addResident = (newResidentData: Omit<Resident, 'id' | 'userId' | 'avatarUrl' | 'address'>) => {
    if (!firestore || !residents) return;
    const newId = doc(collection(firestore, 'residents')).id;
    const newResUserIdNumber = Math.max(...residents.map(r => parseInt(r.userId.replace('R-', ''))), 1000) + 1;

    const newResident: Resident = {
      ...newResidentData,
      id: newId,
      userId: `R-${newResUserIdNumber}`,
      address: `${newResidentData.purok}, Brgy. Mina De Oro, Bongabong, Oriental Mindoro`,
      avatarUrl: `https://picsum.photos/seed/${Math.random()}/100/100`,
    };

    const residentRef = doc(firestore, 'residents', newId);
    setDocumentNonBlocking(residentRef, newResident, { merge: true });

    // Also create a user account for the resident
     const newUser: User = {
       id: newResident.userId, // Using the resident's User ID for the auth user's UID
       name: `${newResident.firstName} ${newResident.lastName}`,
       email: `${newResident.lastName.toLowerCase()}${newResUserIdNumber}@ibarangay.com`, // dummy email
       avatarUrl: newResident.avatarUrl,
       role: 'Resident',
       residentId: newResident.id,
     };
     const userRef = doc(firestore, 'users', newUser.id);
     setDocumentNonBlocking(userRef, newUser, { merge: true });
  };

  const updateResident = (updatedResident: Resident) => {
    if (!firestore) return;
    const residentRef = doc(firestore, 'residents', updatedResident.id);
    updateDocumentNonBlocking(residentRef, updatedResident);
  };

  const deleteResident = (residentId: string) => {
    if (!firestore) return;
    const residentRef = doc(firestore, 'residents', residentId);
    deleteDocumentNonBlocking(residentRef);
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

  const addUser = (user: Omit<User, 'id' | 'avatarUrl'>) => {
    if (!firestore) return;
    const newId = doc(collection(firestore, 'users')).id;
    const newUser: User = {
      ...user,
      id: newId,
      avatarUrl: `https://picsum.photos/seed/${Math.random()}/100/100`,
    };
    const userRef = doc(firestore, 'users', newId);
    setDocumentNonBlocking(userRef, newUser, { merge: true });
  };

  const updateUser = (updatedUser: User) => {
    if (!firestore) return;
    const userRef = doc(firestore, 'users', updatedUser.id);
    updateDocumentNonBlocking(userRef, updatedUser);
  };

  const deleteUser = (userId: string) => {
    if (!firestore) return;
    const userRef = doc(firestore, 'users', userId);
    deleteDocumentNonBlocking(userRef);
  };

  return (
    <AppContext.Provider value={{
      currentUser,
      setCurrentUser,
      login,
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
