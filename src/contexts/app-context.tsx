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
import { collection, doc, where, query, getDocs, writeBatch } from 'firebase/firestore';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { createUserWithEmailAndPassword, fetchSignInMethodsForEmail } from 'firebase/auth';

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
  console.log('Checking and seeding initial users if necessary...');

  for (const user of initialUsers) {
    try {
      // Check if user exists in Auth by fetching sign-in methods for their email
      const signInMethods = await fetchSignInMethodsForEmail(auth, user.email);
      
      if (signInMethods.length === 0) {
        // User does not exist in Auth, so create them
        console.log(`Creating auth user for ${user.email}...`);
        const userCredential = await createUserWithEmailAndPassword(auth, user.email, 'password');
        const authUser = userCredential.user;

        // Now create their document in Firestore using the UID from Auth
        const userDocRef = doc(firestore, 'users', authUser.uid);
        const userData: User = {
          ...user,
          id: authUser.uid, // This is critical
        };
        await setDocumentNonBlocking(userDocRef, userData, { merge: true });
        console.log(`User ${user.email} created in Auth and Firestore.`);
      } else {
        // User already exists in Auth, we can skip creation.
        // Optional: you could add logic here to ensure their Firestore doc is up-to-date.
        console.log(`User ${user.email} already exists in Auth. Skipping creation.`);
      }
    } catch (error) {
      // Catch and log any other errors during seeding
      console.error(`Error seeding user ${user.email}:`, error);
    }
  }
  console.log('Finished user seeding check.');
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
  const isDataLoading = isAuthLoading || (!!firebaseUser && (!users || isUsersLoading || !currentUser || isResidentsLoading || isRequestsLoading));

  const login = async (credential: string, password: string): Promise<User | undefined> => {
    if (!auth || !firestore) {
      throw new Error("Firebase not initialized");
    }

    let emailToSignIn = credential;

    // If the credential is NOT an email address, assume it's a Resident User ID
    if (!credential.includes('@')) {
      const q = query(collection(firestore, "residents"), where("userId", "==", credential));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const residentDoc = querySnapshot.docs[0].data() as Resident;
        // Now find the corresponding user account to get the email
        const usersQuery = query(collection(firestore, "users"), where("residentId", "==", residentDoc.id));
        const userQuerySnapshot = await getDocs(usersQuery);

        if (!userQuerySnapshot.empty) {
            const userAccount = userQuerySnapshot.docs[0].data() as User;
            emailToSignIn = userAccount.email;
        } else {
             throw new Error("No user account associated with that Resident ID.");
        }
      } else {
        throw new Error("Invalid User ID. Please use your email if you are a staff member.");
      }
    }

    initiateEmailSignIn(auth, emailToSignIn, password);
    // Let the auth state listener handle the user update.
    return undefined; 
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
        // Use setDoc and chain a .catch for error handling
        setDocumentNonBlocking(userRef, newUser, { merge: true });
      })
      .catch(error => {
        // This will catch auth errors (like email-already-in-use)
        // Firestore permission errors for the setDoc are handled in setDocumentNonBlocking
        console.error("Error creating auth user:", error);
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
