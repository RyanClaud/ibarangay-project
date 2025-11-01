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

// Helper function to seed initial users into Firebase Auth and Firestore
const seedInitialUsers = async (firestore: any, auth: any) => {
  if (sessionStorage.getItem('firebase_users_seeded_v2')) {
    return;
  }
  console.log('Seeding initial staff users...');

  for (const user of initialUsers) {
    try {
      const signInMethods = await fetchSignInMethodsForEmail(auth, user.email);

      if (signInMethods.length === 0) {
        console.log(`Creating auth user for ${user.email}...`);
        const userCredential = await createUserWithEmailAndPassword(auth, user.email, 'password');
        const authUser = userCredential.user;
        
        const userDocRef = doc(firestore, 'users', authUser.uid);
        const userData: User = {
          ...user,
          id: authUser.uid,
        };
        await setDoc(userDocRef, userData);
        console.log(`User ${user.email} created in Auth and Firestore with UID: ${authUser.uid}.`);

      } else {
         // User exists in Auth, ensure they have a firestore doc.
         // This is a recovery step for failed previous attempts.
         const usersQuery = query(collection(firestore, "users"), where("email", "==", user.email));
         const querySnapshot = await getDocs(usersQuery);
         if(querySnapshot.empty) {
            console.warn(`Auth user ${user.email} exists but has no Firestore document. This should not happen.`);
         }
      }
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        console.log(`Auth user ${user.email} already exists. Skipping auth creation.`);
      } else {
        console.error(`Error seeding user ${user.email}:`, error);
      }
    }
  }
  
  sessionStorage.setItem('firebase_users_seeded_v2', 'true');
};


function AppProviderContent({ children }: { children: ReactNode }) {
  const { firestore, auth, user: firebaseUser, isUserLoading: isAuthLoading } = useFirebase();
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Seed users on initial load if auth is ready.
  useEffect(() => {
    if (firestore && auth && !isAuthLoading) {
      seedInitialUsers(firestore, auth);
    }
  }, [firestore, auth, isAuthLoading]);

  // Fetch all collections. These hooks are safe because they return null if firestore is not ready.
  const usersQuery = useMemoFirebase(() => (firestore ? collection(firestore, 'users') : null), [firestore]);
  const { data: users, isLoading: isUsersLoading } = useCollection<User>(usersQuery);

  const residentsQuery = useMemoFirebase(() => (firestore ? collection(firestore, 'residents') : null), [firestore]);
  const { data: residents, isLoading: isResidentsLoading } = useCollection<Resident>(residentsQuery);

  const documentRequestsQuery = useMemoFirebase(() => (firestore ? collection(firestore, 'documentRequests') : null), [firestore]);
  const { data: documentRequests, isLoading: isRequestsLoading } = useCollection<DocumentRequest>(documentRequestsQuery);

  // This is the main loading state for the entire app's data.
  const isDataLoading = isAuthLoading || isUsersLoading || isResidentsLoading || isRequestsLoading;

  const login = async (credential: string, password: string) => {
    if (!auth) throw new Error("Auth service not available.");
    
    // Resident ID check is heuristic. A real app might use a Cloud Function for lookup.
    const isLikelyResidentID = /R-\d+/.test(credential);
    let emailToLogin = credential;

    if (isLikelyResidentID && firestore) {
      // THIS IS INSECURE for a real app but required by the prompt's design.
      // An unauthenticated user cannot query the 'residents' collection with default rules.
      // For this to work, security rules would need to be relaxed, which is not ideal.
      // We will assume for now it fails silently and the user must use email.
      // In a real scenario, this lookup should be done via a secure backend endpoint (Cloud Function).
      console.warn("Attempting to look up resident by ID before login. This is insecure and will likely fail with default security rules.");
      const resQuery = query(collection(firestore, "residents"), where("userId", "==", credential));
      const resSnapshot = await getDocs(resQuery);
      if (!resSnapshot.empty) {
        const resDoc = resSnapshot.docs[0];
        const resData = resDoc.data();
        const userQuery = query(collection(firestore, "users"), where("residentId", "==", resDoc.id));
        const userSnapshot = await getDocs(userQuery);
        if (!userSnapshot.empty) {
          emailToLogin = userSnapshot.docs[0].data().email;
        } else {
            throw new Error("Resident found, but no associated user account exists.");
        }
      } else {
        // To prevent revealing which IDs exist, we don't throw here.
        // It will just fail the email/password sign-in below.
      }
    }
    
    await signInWithEmailAndPassword(auth, emailToLogin, password);
  };

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

    createUserWithEmailAndPassword(auth, residentEmail, 'password')
      .then(userCredential => {
        const authUser = userCredential.user;
        const newResident: Resident = {
          ...newResidentData,
          id: authUser.uid, // Use Auth UID for resident ID
          userId: residentUserId, 
          address: `${newResidentData.purok}, Brgy. Mina De Oro, Bongabong, Oriental Mindoro`,
          avatarUrl: `https://picsum.photos/seed/${newId}/100/100`,
        };

        const residentRef = doc(firestore, 'residents', authUser.uid);
        setDocumentNonBlocking(residentRef, newResident, { merge: true });

        const newUser: User = {
          id: authUser.uid,
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

  const deleteResident = async (residentId: string) => {
    if (!firestore || !auth) return;
    console.warn("Warning: Deleting resident from Firestore only. This does not delete the Firebase Auth user, which should be done via a backend function.");
    const residentRef = doc(firestore, 'residents', residentId);
    await deleteDocumentNonBlocking(residentRef);

    const userQuery = query(collection(firestore, "users"), where("residentId", "==", residentId));
    const userSnapshot = await getDocs(userQuery);
    if (!userSnapshot.empty) {
        const userDoc = userSnapshot.docs[0];
        await deleteDocumentNonBlocking(userDoc.ref);
    }
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
