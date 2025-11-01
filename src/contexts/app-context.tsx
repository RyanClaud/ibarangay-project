'use client';

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import type { User, Resident, DocumentRequest, DocumentRequestStatus, Role } from '@/lib/types';
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
  const usersQuery = useMemoFirebase(() => (firestore && currentUser ? collection(firestore, 'users') : null), [firestore, currentUser]);
  const { data: users, isLoading: isUsersLoading } = useCollection<User>(usersQuery);

  const residentsQuery = useMemoFirebase(() => (firestore && currentUser ? collection(firestore, 'residents') : null), [firestore, currentUser]);
  const { data: residents, isLoading: isResidentsLoading } = useCollection<Resident>(residentsQuery);
  
  const documentRequestsQuery = useMemoFirebase(() => {
    if (!firestore || !currentUser) return null;
    if (currentUser.role === 'Resident') {
      // For residents, only fetch their own document requests
      return query(collection(firestore, 'documentRequests'), where('residentId', '==', currentUser.id));
    }
    // For staff, fetch all document requests
    return collection(firestore, 'documentRequests');
  }, [firestore, currentUser]);
  const { data: documentRequests, isLoading: isRequestsLoading } = useCollection<DocumentRequest>(documentRequestsQuery);

  const isDataLoading = !currentUser || isUsersLoading || isResidentsLoading || isRequestsLoading;

  const login = async (credential: string, password: string) => {
    if (!auth || !firestore) throw new Error("Auth/Firestore service not available.");
    
    // Check if the credential is an email
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(credential);

    if (isEmail) {
        await signInWithEmailAndPassword(auth, credential, password);
        return;
    }
    
    // If not an email, assume it's a User ID and try to find the corresponding user.
    // This query is now allowed by the updated security rules for unauthenticated users.
    const residentsRef = collection(firestore, 'residents');
    const q = query(residentsRef, where("userId", "==", credential));
    
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
        throw new Error("auth/user-not-found");
    }
    
    const residentDoc = querySnapshot.docs[0].data() as Resident;
    const residentEmail = residentDoc.email;

    if (!residentEmail) {
        throw new Error("auth/invalid-credential"); // Resident has no email on file
    }

    await signInWithEmailAndPassword(auth, residentEmail, password);
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
      // Step 1: Create the user in Firebase Authentication with the provided email
      const userCredential = await createUserWithEmailAndPassword(auth, newResidentData.email, defaultPassword);
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
        email: newResidentData.email, // Ensure email is stored
      };
      const residentRef = doc(firestore, 'residents', residentId);
      batch.set(residentRef, newResident);

      // Step 3: Create the user document in /users collection
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

      // Step 4: Commit all writes at once
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
