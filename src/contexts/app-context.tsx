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

// Helper function to seed initial users into Firebase Auth and Firestore
const seedInitialUsers = async (firestore: any, auth: any) => {
  if (sessionStorage.getItem('firebase_users_seeded_v3')) {
    return;
  }
  console.log('Seeding initial staff users...');

  for (const user of initialUsers) {
    try {
      // Check if user exists in auth
      let authUser;
      try {
        const signInMethods = await fetchSignInMethodsForEmail(auth, user.email);
        if (signInMethods.length > 0) {
          // This is not perfectly accurate as it doesn't give us the UID, but it's a good guess
          // A more robust solution might involve a Cloud Function lookup.
          console.log(`Auth user ${user.email} already exists.`);
           const usersQuery = query(collection(firestore, "users"), where("email", "==", user.email));
           const querySnapshot = await getDocs(usersQuery);
            if (!querySnapshot.empty) {
                authUser = { uid: querySnapshot.docs[0].id };
            } else {
                 console.warn(`Auth user ${user.email} exists but has no Firestore document. This should not happen.`);
                 continue; // Skip to next user
            }

        } else {
            const userCredential = await createUserWithEmailAndPassword(auth, user.email, 'password');
            authUser = userCredential.user;
            console.log(`User ${user.email} created in Auth with UID: ${authUser.uid}.`);
        }
      } catch (authError: any) {
         if (authError.code === 'auth/email-already-in-use') {
            console.log(`Auth user ${user.email} already exists (caught on create).`);
             const usersQuery = query(collection(firestore, "users"), where("email", "==", user.email));
             const querySnapshot = await getDocs(usersQuery);
             if (!querySnapshot.empty) {
                authUser = { uid: querySnapshot.docs[0].id };
            } else {
                 console.warn(`Auth user ${user.email} exists but has no Firestore document. This should not happen.`);
                 continue; // Skip to next user
            }
         } else {
            throw authError;
         }
      }

      // Now check/create the firestore document
      if (authUser?.uid) {
        const userDocRef = doc(firestore, 'users', authUser.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (!userDocSnap.exists()) {
          console.log(`Creating Firestore doc for ${user.email} with UID ${authUser.uid}.`);
          const userData: User = {
            ...user,
            id: authUser.uid,
          };
          await setDoc(userDocRef, userData);
        }
      }

    } catch (error: any) {
      console.error(`Error seeding user ${user.email}:`, error);
    }
  }
  
  sessionStorage.setItem('firebase_users_seeded_v3', 'true');
};


function AppProviderContent({ children }: { children: ReactNode }) {
  const { firestore, auth } = useFirebase();
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Users data from collection
  const usersQuery = useMemoFirebase(() => (firestore ? collection(firestore, 'users') : null), [firestore]);
  const { data: users, isLoading: isUsersLoading } = useCollection<User>(usersQuery);
  // Residents data from collection
  const residentsQuery = useMemoFirebase(() => (firestore ? collection(firestore, 'residents') : null), [firestore]);
  const { data: residents, isLoading: isResidentsLoading } = useCollection<Resident>(residentsQuery);
  // Document Requests data from collection
  const documentRequestsQuery = useMemoFirebase(() => (firestore ? collection(firestore, 'documentRequests') : null), [firestore]);
  const { data: documentRequests, isLoading: isRequestsLoading } = useCollection<DocumentRequest>(documentRequestsQuery);

  const isDataLoading = isUsersLoading || isResidentsLoading || isRequestsLoading;

  // Run seeding effect
  useEffect(() => {
    if (firestore && auth) {
      seedInitialUsers(firestore, auth);
    }
  }, [firestore, auth]);

  const login = async (credential: string, password: string) => {
    if (!auth) throw new Error("Auth service not available.");

    let emailToLogin = credential;
    // This heuristic is not secure but is required by the prompt's design.
    // A real app would use a secure backend endpoint for this lookup.
    if (!credential.includes('@') && firestore && users) {
       const residentUser = users.find(u => u.role === 'Resident' && u.residentId && residents?.find(r => r.id === u.residentId)?.userId === credential);
       if(residentUser) {
        emailToLogin = residentUser.email;
       }
    }
    
    // Use initiateEmailSignIn which is non-blocking and returns a promise for the UI to handle
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
        // In a real app, you would call a Cloud Function here to set custom claims
        // For example: setCustomUserClaims(authUser.uid, { role: user.role });
        console.log(`User created. In a real app, a custom claim for role '${user.role}' would be set here.`);

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
    // In a real app, you would call a Cloud Function here to update the custom claim
    console.log(`User updated. In a real app, a custom claim for role '${updatedUser.role}' would be set here.`);
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
