'use client';

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import type { User, Resident, DocumentRequest, DocumentRequestStatus, Role } from '@/lib/types';
import { users as initialUsers } from '@/lib/data';
import {
  useCollection,
  useFirebase,
  useMemoFirebase,
  setDocumentNonBlocking,
  updateDocumentNonBlocking,
  deleteDocumentNonBlocking,
  initiateEmailSignIn,
  initiateSignOut,
} from '@/firebase';
import { collection, doc, where, query, getDocs, writeBatch, getDoc, setDoc } from 'firebase/firestore';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { createUserWithEmailAndPassword, fetchSignInMethodsForEmail, deleteUser as deleteAuthUser } from 'firebase/auth';

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
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Helper function to seed initial users into Firebase Auth and Firestore
const seedInitialUsers = async (firestore: any, auth: any) => {
  console.log('Checking and seeding initial users if necessary...');
  let hasSeeded = false;
  // Use a flag in sessionStorage to ensure this runs only once per session.
  if (sessionStorage.getItem('user_seeded')) {
    return;
  }

  for (const initialUser of initialUsers) {
    try {
      // Check if user already exists in Auth
      const signInMethods = await fetchSignInMethodsForEmail(auth, initialUser.email);
      
      if (signInMethods.length === 0) {
        // User does not exist, create them in Auth
        console.log(`Creating auth user for ${initialUser.email}...`);
        const userCredential = await createUserWithEmailAndPassword(auth, initialUser.email, 'password');
        const authUser = userCredential.user;

        // Now create their document in Firestore using the UID from Auth
        const userDocRef = doc(firestore, 'users', authUser.uid);
        const userData: User = {
          ...initialUser,
          id: authUser.uid, // This is critical
        };
        await setDoc(userDocRef, userData);
        console.log(`Created Firestore document for ${initialUser.email} with UID ${authUser.uid}`);
        hasSeeded = true;
      } else {
        // User exists in auth, ensure they have a firestore doc.
        // This is a recovery step in case of partial failure.
        // NOTE: This part is complex because we don't know the UID from the email alone.
        // For this app, we'll assume that if an auth user exists, the Firestore doc
        // was likely created on the first successful run.
      }
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        console.log(`User ${initialUser.email} already exists in Auth. Skipping creation.`);
      } else {
        console.error(`Error seeding user ${initialUser.email}:`, error);
      }
    }
  }
  if (hasSeeded) {
    sessionStorage.setItem('user_seeded', 'true');
  }
   console.log('Finished user seeding check.');
};


function AppProviderContent({ children }: { children: ReactNode }) {
  const { firestore, auth, user: firebaseUser, isUserLoading: isAuthLoading } = useFirebase();
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Seed users on initial load
  useEffect(() => {
    if (firestore && auth) {
      // Intentionally not awaiting this. Let it run in the background.
      seedInitialUsers(firestore, auth);
    }
  }, [firestore, auth]);

  // 1. Fetch users only after Firebase Auth has confirmed a user is logged in.
  const usersQuery = useMemoFirebase(() => {
    if (!firestore) return null; // Query immediately, rules will enforce access
    return collection(firestore, 'users');
  }, [firestore]);
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
  const isDataLoading = isAuthLoading || (!!firebaseUser && (!users || isUsersLoading || !currentUser || isResidentsLoading || isRequestsLoading));

  const logout = () => {
    if (!auth) return;
    initiateSignOut(auth);
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
       id: newResident.userId, // This is still problematic as it assumes we can set the UID.
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
    if (!firestore || !auth) return;
    
    createUserWithEmailAndPassword(auth, user.email, 'password')
      .then(userCredential => {
        const authUser = userCredential.user;
        const newUser: User = {
          ...user,
          id: authUser.uid,
          avatarUrl: `https://picsum.photos/seed/${Math.random()}/100/100`,
        };
        const userRef = doc(firestore, 'users', authUser.uid);
        setDocumentNonBlocking(userRef, newUser, { merge: true });
      })
      .catch(error => {
        if (error.code !== 'auth/email-already-in-use') {
          console.error("Error creating auth user:", error);
        }
      });
  };

  const updateUser = (updatedUser: User) => {
    if (!firestore) return;
    const userRef = doc(firestore, 'users', updatedUser.id);
    const { email, ...rest } = updatedUser;
    updateDocumentNonBlocking(userRef, rest);
  };

  const deleteUser = (userId: string) => {
    if (!firestore || !auth) return;
    // This is not a complete implementation. Deleting a Firebase Auth user
    // is a privileged operation that should be handled by a backend function.
    // The client-side can only delete its own account.
    // For this app, we will just delete the Firestore record.
    console.warn("Warning: Deleting user from Firestore only. Auth user remains.");
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
