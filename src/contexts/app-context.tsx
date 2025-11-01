'use client';

import { createContext, useContext, useState, ReactNode, useEffect, useMemo } from 'react';
import type { User, Resident, DocumentRequest, DocumentRequestStatus, Role } from '@/lib/types';
import {
  useCollection,
  useFirebase,
  useMemoFirebase,
  setDocumentNonBlocking,
  updateDocumentNonBlocking,
  deleteDocumentNonBlocking,
  initiateSignOut,
  useDoc,
} from '@/firebase';
import { collection, doc, writeBatch, getDoc, setDoc, query, where, getDocs } from 'firebase/firestore';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';

interface AppContextType {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  logout: () => void;
  residents: Resident[] | null;
  addResident: (resident: Omit<Resident, 'id' | 'userId' | 'avatarUrl' | 'address'> & { email: string }) => void;
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
  const usersQuery = useMemoFirebase(() => {
    if (!firestore || !currentUser) return null;
    // Only staff should be able to list all users.
    if (currentUser.role !== 'Resident') {
      return collection(firestore, 'users');
    }
    return null; // Residents should not fetch all users.
  }, [firestore, currentUser]);
  
  const { data: staffUsers, isLoading: isUsersLoading } = useCollection<User>(usersQuery);

  // If the user is a resident, we fetch their single user document separately.
  const userDocRef = useMemoFirebase(() => {
      if (!firestore || !currentUser || currentUser.role !== 'Resident') return null;
      return doc(firestore, 'users', currentUser.id);
  }, [firestore, currentUser]);

  const { data: residentUserDoc, isLoading: isResidentUserLoading } = useDoc<User>(userDocRef);

  // Combine the user data based on role
  const users = useMemo(() => {
      if (currentUser?.role === 'Resident') {
          // If a resident is logged in, the `users` array should only contain their own user object.
          // The useDoc hook `residentUserDoc` already fetches just this one document.
          return residentUserDoc ? [residentUserDoc] : [];
      }
      // For staff, `staffUsers` from useCollection contains the list of all users (or is null).
      return staffUsers;
  }, [currentUser?.role, staffUsers, residentUserDoc]);


  const residentsQuery = useMemoFirebase(() => {
    if (!firestore || !currentUser) return null;
    // Staff can see all residents
    if (currentUser.role !== 'Resident') {
      return collection(firestore, 'residents');
    }
    // Residents should fetch their own profile specifically using their ID.
    return query(collection(firestore, 'residents'), where('id', '==', currentUser.id));
  }, [firestore, currentUser]);
  const { data: residents, isLoading: isResidentsLoading } = useCollection<Resident>(residentsQuery);
  
  const documentRequestsQuery = useMemoFirebase(() => {
    if (!firestore || !currentUser) return null;
    if (currentUser.role !== 'Resident') {
      // For staff, fetch all document requests
      return collection(firestore, 'documentRequests');
    }
    // For residents, only fetch their own document requests
    return query(collection(firestore, 'documentRequests'), where('residentId', '==', currentUser.id));
  }, [firestore, currentUser]);
  const { data: documentRequests, isLoading: isRequestsLoading } = useCollection<DocumentRequest>(documentRequestsQuery);

  const isDataLoading = !currentUser || isUsersLoading || isResidentsLoading || isRequestsLoading || isResidentUserLoading;

  const login = async (credential: string, password: string) => {
    if (!auth || !firestore) throw new Error("Auth/Firestore service not available.");
    await signInWithEmailAndPassword(auth, credential, password);
  };

  const logout = () => {
    if (!auth) return;
    initiateSignOut(auth);
    setCurrentUser(null);
  };

  const addResident = async (newResidentData: Omit<Resident, 'id' | 'userId' | 'avatarUrl' | 'address'> & { email: string }) => {
    if (!firestore || !auth) return;
    
    const defaultPassword = 'password';

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, newResidentData.email, defaultPassword);
      const authUser = userCredential.user;
      
      const batch = writeBatch(firestore);

      const residentId = authUser.uid;
      const userId = `R-${Math.floor(Date.now() / 1000).toString().slice(-6)}`;

      const newResident: Resident = {
        ...newResidentData,
        id: residentId, 
        userId: userId, 
        address: `${newResidentData.purok}, Brgy. Mina De Oro, Bongabong, Oriental Mindoro`,
        avatarUrl: `https://picsum.photos/seed/${residentId}/100/100`,
        email: newResidentData.email,
      };
      const residentRef = doc(firestore, 'residents', residentId);
      batch.set(residentRef, newResident);

      const newUser: User = {
        id: residentId,
        name: `${newResidentData.firstName} ${newResidentData.lastName}`,
        email: newResidentData.email,
        avatarUrl: newResident.avatarUrl,
        role: 'Resident',
        residentId: residentId,
      };
      const userRef = doc(firestore, 'users', residentId);
      batch.set(userRef, newUser);

      await batch.commit();

    } catch (error: any) {
      console.error("Error creating new resident:", error);
      if (error.code === 'auth/email-already-in-use') {
         throw new Error("An account for this email already exists.");
      }
       throw new Error("Failed to create resident account.");
    }
  };

  const updateResident = (updatedResident: Resident) => {
    if (!firestore) return;
    const residentRef = doc(firestore, 'residents', updatedResident.id);
    updateDocumentNonBlocking(residentRef, updatedResident);

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
    const newIdNumber = (documentRequests?.length ?? 0) + 1;
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
      const userCredential = await createUserWithEmailAndPassword(auth, user.email, 'password');
      const authUser = userCredential.user;
      
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
