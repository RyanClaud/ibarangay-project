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
  initiateSignOut,
} from '@/firebase';
import { collection, doc, writeBatch, getDoc, setDoc } from 'firebase/firestore';
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
  // Use a flag in sessionStorage to ensure this runs only once per browser session,
  // preventing repeated, unnecessary writes and 'email-already-in-use' errors.
  if (sessionStorage.getItem('firebase_users_seeded')) {
    return;
  }
  console.log('Seeding initial staff users...');

  const batch = writeBatch(firestore);
  let hasSeeded = false;

  for (const user of initialUsers) {
    try {
      // Check if user already exists in Auth
      const signInMethods = await fetchSignInMethodsForEmail(auth, user.email);

      if (signInMethods.length === 0) {
        // User does not exist, create them in Auth
        const userCredential = await createUserWithEmailAndPassword(auth, user.email, 'password');
        const authUser = userCredential.user;

        // Now create their document in Firestore using the UID from Auth
        const userDocRef = doc(firestore, 'users', authUser.uid);
        const userData: User = {
          ...user,
          id: authUser.uid, // This is critical
        };
        batch.set(userDocRef, userData);
        console.log(`User ${user.email} created in Auth and queued for Firestore.`);
        hasSeeded = true;
      } else {
        // User exists in Auth, but let's ensure their Firestore doc is also correct.
        // This is a recovery step. For this, we need the UID.
        // We'll skip this complex recovery for this seeding script as it's a one-off.
        console.log(`User ${user.email} already exists in Auth. Skipping creation.`);
      }
    } catch (error: any) {
       // This handles the race condition where another tab might be seeding at the same time.
      if (error.code === 'auth/email-already-in-use') {
        console.log(`User ${user.email} was likely just created. Skipping.`);
      } else {
        console.error(`Error seeding user ${user.email}:`, error);
      }
    }
  }

  if (hasSeeded) {
    await batch.commit();
    console.log('Firestore batch commit successful.');
  }
  
  // Mark as seeded for this session
  sessionStorage.setItem('firebase_users_seeded', 'true');
};


function AppProviderContent({ children }: { children: ReactNode }) {
  const { firestore, auth, user: firebaseUser, isUserLoading: isAuthLoading } = useFirebase();
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Seed users on initial load
  useEffect(() => {
    if (firestore && auth && !isAuthLoading) {
      // Intentionally not awaiting this. Let it run in the background.
      seedInitialUsers(firestore, auth);
    }
  }, [firestore, auth, isAuthLoading]);

  // 1. Fetch the entire `users` collection from Firestore.
  // This query only runs when Firestore is available. Security rules will enforce access.
  const usersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'users');
  }, [firestore]);
  const { data: users, isLoading: isUsersLoading } = useCollection<User>(usersQuery);

  // 2. Determine the app's current user.
  // This effect runs whenever the auth state changes or the users list is loaded/updated.
  useEffect(() => {
    // Wait until auth is resolved and the users list has been fetched.
    if (isAuthLoading || isUsersLoading) {
      return; 
    }
    
    if (!firebaseUser) {
      setCurrentUser(null); // No one is logged in.
      return;
    }

    if (users) {
      // Find the user document in our fetched list that matches the authenticated user's UID.
      const appUser = users.find(u => u.id === firebaseUser.uid);
      setCurrentUser(appUser || null);
    }
  }, [firebaseUser, users, isAuthLoading, isUsersLoading]);


  // 3. Fetch other data only if we have determined the current app user.
  const residentsQuery = useMemoFirebase(() => (firestore && currentUser) ? collection(firestore, 'residents') : null, [firestore, currentUser]);
  const { data: residents, isLoading: isResidentsLoading } = useCollection<Resident>(residentsQuery);

  const documentRequestsQuery = useMemoFirebase(() => (firestore && currentUser) ? collection(firestore, 'documentRequests') : null, [firestore, currentUser]);
  const { data: documentRequests, isLoading: isRequestsLoading } = useCollection<DocumentRequest>(documentRequestsQuery);

  // 4. Consolidate loading state.
  // The app is "loading" if auth is checking, or if a user IS logged in but we haven't fetched their profile yet.
  const isDataLoading = isAuthLoading || isUsersLoading || (!!firebaseUser && !currentUser) || isResidentsLoading || isRequestsLoading;


  const logout = () => {
    if (!auth) return;
    initiateSignOut(auth);
    setCurrentUser(null);
  };

  const addResident = (newResidentData: Omit<Resident, 'id' | 'userId' | 'avatarUrl' | 'address'>) => {
    if (!firestore || !residents || !auth) return;
    const newId = doc(collection(firestore, 'residents')).id;
    const newResUserIdNumber = Math.max(...residents.map(r => parseInt(r.userId.replace('R-', ''))), 1000) + 1;
    const residentUserId = `R-${newResUserIdNumber}`;
    const residentEmail = `${newResidentData.lastName.toLowerCase()}${newResUserIdNumber}@ibarangay.com`;

    // Create resident user in Firebase Auth
    createUserWithEmailAndPassword(auth, residentEmail, 'password')
      .then(userCredential => {
        const authUser = userCredential.user;
        const newResident: Resident = {
          ...newResidentData,
          id: newId,
          userId: residentUserId, // Custom ID for display
          address: `${newResidentData.purok}, Brgy. Mina De Oro, Bongabong, Oriental Mindoro`,
          avatarUrl: `https://picsum.photos/seed/${newId}/100/100`,
        };

        const residentRef = doc(firestore, 'residents', newId);
        setDocumentNonBlocking(residentRef, newResident, { merge: true });

        // Also create a user document for the resident, linking to their auth UID
        const newUser: User = {
          id: authUser.uid, // Use the real Auth UID
          name: `${newResidentData.firstName} ${newResidentData.lastName}`,
          email: residentEmail,
          avatarUrl: newResident.avatarUrl,
          role: 'Resident',
          residentId: newResident.id,
        };
        const userRef = doc(firestore, 'users', authUser.uid);
        setDocumentNonBlocking(userRef, newUser, { merge: true });

      }).catch(error => console.error("Error creating resident user:", error));
  };

  const updateResident = (updatedResident: Resident) => {
    if (!firestore) return;
    const residentRef = doc(firestore, 'residents', updatedResident.id);
    updateDocumentNonBlocking(residentRef, updatedResident);
  };

  const deleteResident = (residentId: string) => {
    if (!firestore) return;
    // This is complex. We also need to delete the user from Auth and their user document.
    // This should ideally be a cloud function for atomicity.
    console.warn("Warning: Deleting resident from Firestore only. Auth user and user doc remain.");
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
          avatarUrl: `https://picsum.photos/seed/${authUser.uid}/100/100`,
        };
        const userRef = doc(firestore, 'users', authUser.uid);
        setDocumentNonBlocking(userRef, newUser, { merge: true });
      })
      .catch(error => {
        if (error.code === 'auth/email-already-in-use') {
          console.warn(`User with email ${user.email} already exists in Firebase Auth.`);
        } else {
          console.error("Error creating auth user:", error);
        }
      });
  };

  const updateUser = (updatedUser: User) => {
    if (!firestore) return;
    const userRef = doc(firestore, 'users', updatedUser.id);
    // It's generally not a good idea to let the client change its own email in the DB
    // without also changing it in Auth, which is a protected operation.
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
