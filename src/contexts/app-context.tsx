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
  residents: Resident[];
  addResident: (resident: Omit<Resident, 'id' | 'userId' | 'avatarUrl' | 'address'>) => void;
  updateResident: (resident: Resident) => void;
  deleteResident: (residentId: string) => void;
  documentRequests: DocumentRequest[];
  addDocumentRequest: (request: Omit<DocumentRequest, 'id' | 'trackingNumber' | 'requestDate' | 'status'>) => void;
  updateDocumentRequestStatus: (id: string, status: DocumentRequestStatus) => void;
  users: User[];
  addUser: (user: Omit<User, 'id' | 'avatarUrl'>) => void;
  updateUser: (user: User) => void;
  deleteUser: (userId: string) => void;
  isDataLoading: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

function AppProviderContent({ children }: { children: ReactNode }) {
  const { firestore, user: firebaseUser, isUserLoading: isAuthLoading } = useFirebase();
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const usersQuery = useMemoFirebase(() => firestore ? collection(firestore, 'users') : null, [firestore]);
  const { data: users = [], isLoading: isUsersLoading } = useCollection<User>(usersQuery);

  useEffect(() => {
    if (!isAuthLoading && firebaseUser && users.length > 0) {
      const appUser = users.find(u => u.id === firebaseUser.uid);
      if (appUser) {
        setCurrentUser(appUser);
      } else {
         // This can happen if the user exists in Firebase Auth but not in the 'users' collection
         // Or if the users collection is not yet loaded.
         // For resident users, their ID might be different. Let's find by email.
         const userByEmail = users.find(u => u.email === firebaseUser.email);
         if (userByEmail) {
            setCurrentUser(userByEmail);
         } else {
           console.log("Could not find user in 'users' collection. Logging out.");
           setCurrentUser(null);
         }
      }
    } else if (!isAuthLoading && !firebaseUser) {
        setCurrentUser(null);
    }
  }, [firebaseUser, isAuthLoading, users]);


  // Firestore collections - these will only run if currentUser is not null
  const residentsQuery = useMemoFirebase(() => (firestore && currentUser) ? collection(firestore, 'residents') : null, [firestore, currentUser]);
  const { data: residents = [], isLoading: isResidentsLoading } = useCollection<Resident>(residentsQuery);

  const documentRequestsQuery = useMemoFirebase(() => (firestore && currentUser) ? collection(firestore, 'documentRequests') : null, [firestore, currentUser]);
  const { data: documentRequests = [], isLoading: isRequestsLoading } = useCollection<DocumentRequest>(documentRequestsQuery);

  const isDataLoading = isAuthLoading || (!!currentUser && (isResidentsLoading || isRequestsLoading || isUsersLoading));

  const login = (credential: string) => {
    // We can only check against staff users here, as resident data isn't loaded yet.
    // The actual "login" will be handled by Firebase Auth, and the effect above will set the user.
    const user = findUserByCredential(credential, initialUsers);
    if (user) {
      // In a real app, you would now call signInWithEmailAndPassword(auth, user.email, password)
      // For this mockup, we'll find the full user from the now-loaded collection and set it.
       const fullUser = users.find(u => u.email.toLowerCase() === credential.toLowerCase() || u.userId?.toLowerCase() === credential.toLowerCase());
       if (fullUser) {
        setCurrentUser(fullUser);
        return fullUser;
       }
    }
    // Resident login would be handled similarly by finding them in the residents collection if needed
    // or ideally via Firebase Auth directly.
    return undefined;
  };

  const logout = () => {
    setCurrentUser(null);
    // In a real app: signOut(auth);
  };

  const addResident = (newResidentData: Omit<Resident, 'id' | 'userId' | 'avatarUrl' | 'address'>) => {
    if (!firestore) return;
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
    if (!firestore) return;
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
