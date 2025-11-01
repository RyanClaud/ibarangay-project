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
  initiateEmailSignIn,
  initiateSignOut,
} from '@/firebase';
import { collection, doc, where, query, getDocs, writeBatch } from 'firebase/firestore';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { createUserWithEmailAndPassword } from 'firebase/auth';

interface AppContextType {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  login: (credential: string, password: string) => Promise<User | undefined>;
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
  const usersRef = collection(firestore, 'users');
  const querySnapshot = await getDocs(usersRef);

  // Check if users collection is empty to prevent re-seeding
  if (querySnapshot.empty) {
    console.log('Seeding initial users...');
    const batch = writeBatch(firestore);
    
    for (const user of initialUsers) {
      try {
        // Create user in Firebase Authentication
        const userCredential = await createUserWithEmailAndPassword(auth, user.email, 'password');
        const authUser = userCredential.user;

        // Use the UID from Auth as the document ID in Firestore
        const userDocRef = doc(firestore, 'users', authUser.uid);
        
        const userData: User = {
          ...user,
          id: authUser.uid, // Ensure Firestore ID matches Auth UID
        };

        batch.set(userDocRef, userData);
        console.log(`User ${user.email} created in Auth and Firestore.`);

      } catch (error: any) {
        if (error.code === 'auth/email-already-in-use') {
          console.log(`User ${user.email} already exists in Auth.`);
          // If user exists in Auth, still ensure they are in Firestore
          // This part is tricky without knowing the UID, so we rely on initial seeding being robust.
          // For this app, we'll assume if one exists, they all do.
        } else {
          console.error('Error seeding user:', user.email, error);
        }
      }
    }

    await batch.commit();
    console.log('Finished seeding initial users.');
  }
};


function AppProviderContent({ children }: { children: ReactNode }) {
  const { firestore, auth, user: firebaseUser, isUserLoading: isAuthLoading } = useFirebase();
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Seed users on initial load
  useEffect(() => {
    if (firestore && auth) {
      seedInitialUsers(firestore, auth);
    }
  }, [firestore, auth]);

  // 1. Fetch users only after Firebase Auth has confirmed a user is logged in.
  const usersQuery = useMemoFirebase(() => {
    if (!firestore || !firebaseUser) return null; // Don't query if no user
    return collection(firestore, 'users');
  }, [firestore, firebaseUser]);
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

  const login = async (credential: string, password: string): Promise<User | undefined> => {
    if (!auth || !firestore) {
      throw new Error("Firebase not initialized");
    }

    let userToLogin: User | undefined;
    const allUsers = await getDocs(collection(firestore, 'users'));
    const userList = allUsers.docs.map(doc => doc.data() as User);
    
    userToLogin = findUserByCredential(credential, userList);

    if (!userToLogin) {
      throw new Error("No user found with that ID or email.");
    }
    
    initiateEmailSignIn(auth, userToLogin.email, password);

    // The actual state change is handled by onAuthStateChanged, but we return
    // the found user for immediate feedback on the login page.
    return userToLogin;
  };

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
       id: newResident.userId, // Using the resident's User ID for the auth user's UID
       name: `${newResident.firstName} ${newResident.lastName}`,
       email: `${newResident.lastName.toLowerCase()}${newResUserIdNumber}@ibarangay.com`, // dummy email
       avatarUrl: newResident.avatarUrl,
       role: 'Resident',
       residentId: newResident.id,
     };
     // This is problematic; creating an auth user should be separate. For now, just create the user doc.
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
    
    // Create user in Auth
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
        console.error("Error creating user:", error);
        // Here you would likely show a toast to the user
      });
  };

  const updateUser = (updatedUser: User) => {
    if (!firestore) return;
    const userRef = doc(firestore, 'users', updatedUser.id);
    // Don't update email directly in firestore without updating in Auth too.
    // For this app, we'll just update non-sensitive fields.
    const { email, ...rest } = updatedUser;
    updateDocumentNonBlocking(userRef, rest);
  };

  const deleteUser = (userId: string) => {
    if (!firestore) return;
    // Note: This only deletes the Firestore record, not the Auth user.
    // Proper implementation requires a Firebase Function.
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
