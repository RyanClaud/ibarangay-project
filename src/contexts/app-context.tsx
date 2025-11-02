'use client';

import { createContext, useContext, useState, ReactNode, useEffect, useMemo, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import type { User, Resident, DocumentRequest, DocumentRequestStatus, Role, BarangayConfig } from '@/lib/types';
import {
  useCollection,
  useFirebase,
  useMemoFirebase,
  setDocumentNonBlocking,
  updateDocumentNonBlocking,
  deleteDocumentNonBlocking,
  useDoc,
  useUser,
} from '@/firebase';
import type { User as AuthUser } from 'firebase/auth';
import { collection, doc, writeBatch, getDoc, setDoc, query, where, getDocs, limit, updateDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, EmailAuthProvider, reauthenticateWithCredential, updatePassword, signOut, sendPasswordResetEmail, GoogleAuthProvider, signInWithPopup, linkWithCredential, fetchSignInMethodsForEmail } from 'firebase/auth';
import { toast } from '@/hooks/use-toast';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

interface AppContextType {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  barangayConfig: BarangayConfig | null;
  logout: () => void;
  residents: Resident[] | null;
  addResident: (resident: Omit<Resident, 'id' | 'userId' | 'avatarUrl' | 'address'> & { email: string }) => Promise<void>;
  updateResident: (residentId: string, dataToUpdate: Partial<Resident>) => Promise<void>;
  deleteResident: (residentId: string) => void;
  documentRequests: DocumentRequest[] | null;
  addDocumentRequest: (request: Omit<DocumentRequest, 'id' | 'trackingNumber' | 'requestDate' | 'status' | 'referenceNumber'>) => void;
  updateDocumentRequestStatus: (id: string, status: DocumentRequestStatus, paymentDetails?: DocumentRequest['paymentDetails']) => void;
  deleteDocumentRequest: (id: string) => void;
  users: User[] | null;
  addUser: (user: Omit<User, 'id' | 'avatarUrl' | 'residentId'>) => Promise<void>;
  updateUser: (dataToUpdate: Partial<User> & { id: string }) => Promise<void>;
  deleteUser: (userId: string) => void;
  isDataLoading: boolean;
  login: (credential: string, password: string) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Store admin credentials in memory ONLY. This is not secure for production but works for this dev environment.
let adminCredentials: { email: string; password: string } | null = null;


function AppProviderContent({ children }: { children: ReactNode }) {
  const { firestore, auth, storage } = useFirebase();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const { user: firebaseUser, isUserLoading: isAuthLoading } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  // --- Barangay Config Query ---
  const barangayConfigDocRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'barangayConfig', 'main'); // Assuming a single config doc with ID 'main'
  }, [firestore]);
  const { data: barangayConfig, isLoading: isConfigLoading } = useDoc<BarangayConfig>(barangayConfigDocRef);

  // --- Role-based Data Fetching ---
  const isStaff = currentUser?.role !== 'Resident';

  // Queries for staff members
  const allUsersQuery = useMemoFirebase(() => {
    if (!firestore || !currentUser?.id || !isStaff) return null;
    return collection(firestore, 'users');
  }, [firestore, currentUser?.id, isStaff]);
  const { data: allUsers, isLoading: isAllUsersLoading } = useCollection<User>(allUsersQuery);

  const allResidentsQuery = useMemoFirebase(() => {
    if (!firestore || !currentUser?.id || !isStaff) return null;
    return collection(firestore, 'residents');
  }, [firestore, currentUser?.id, isStaff]);
  const { data: allResidents, isLoading: isAllResidentsLoading } = useCollection<Resident>(allResidentsQuery);
  
  // Query for a single resident's own profile
  const singleResidentDocRef = useMemoFirebase(() => {
    if (!firestore || !currentUser?.id || isStaff) return null;
    return doc(firestore, 'residents', currentUser.residentId);
  }, [firestore, currentUser, isStaff]);
  const { data: singleResident, isLoading: isSingleResidentLoading } = useDoc<Resident>(singleResidentDocRef);
  
  // --- Combined Data Logic ---
  const users = useMemo(() => {
    if (!currentUser) return null;
    return isStaff ? allUsers : (currentUser ? [currentUser] : []);
  }, [currentUser, allUsers, isStaff]);

  const residents = useMemo(() => {
    if (!currentUser) return null;
    return isStaff ? allResidents : (singleResident ? [singleResident] : []);
  }, [isStaff, allResidents, singleResident]);


  // --- Document Requests Query (works for both roles) ---
  const documentRequestsQuery = useMemoFirebase(() => {
    if (!firestore || !currentUser) return null;
    if (currentUser.role === 'Resident' && currentUser.id) {
      // Residents see only their own requests
      return query(collection(firestore, 'documentRequests'), where('residentId', '==', currentUser.id));
    }
    if (currentUser.role !== 'Resident') {
       // Staff see all requests
      return collection(firestore, 'documentRequests');
    }
    return null;
  }, [firestore, currentUser]);
  const { data: documentRequests, isLoading: isRequestsLoading } = useCollection<DocumentRequest>(documentRequestsQuery);

  const isDataLoading = useMemo(() => {
    if (!currentUser) return true; // Still loading if no user is authenticated yet.
    if (isConfigLoading || isRequestsLoading) return true; // Always wait for these.
    return isStaff ? (isAllUsersLoading || isAllResidentsLoading) : isSingleResidentLoading;
  }, [currentUser, isConfigLoading, isRequestsLoading, isStaff, isAllUsersLoading, isAllResidentsLoading, isSingleResidentLoading]);

  const logout = useCallback(() => {
    if (!auth) return;
    signOut(auth);
    setCurrentUser(null);
    adminCredentials = null; // Clear credentials on logout
  }, [auth]);

  // --- Auth Effect: The new, stable core of authentication ---
  useEffect(() => {
    if (isAuthLoading) {
      return; // Wait for Firebase Auth to be ready
    }

    const isPublicPage = pathname === '/login' || pathname === '/forgot-password';

    if (!firebaseUser) {
      // User is logged out
      setCurrentUser(null);
      if (!isPublicPage) {
        router.push('/login');
      }
      return;
    }

    // User is logged in, get their Firestore document
    const userDocRef = doc(firestore, 'users', firebaseUser.uid);
    const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) { // If the user document exists, use it.
        const appUser = docSnap.data() as User;
        if (!appUser.role) {
          console.error(`User document for ${firebaseUser.uid} is missing a role. Forcing logout.`);
          logout();
        } else {
          setCurrentUser(appUser);
          if (isPublicPage && appUser) { // Check appUser to be safe
            router.push('/dashboard');
          }
        }
      } else {
        // If the user document does NOT exist, create a default one.
        // This ensures every authenticated user is represented in Firestore.
        console.warn(`No user document for ${firebaseUser.uid}. Creating default 'Resident' user.`);
        const newUser: User = {
            id: firebaseUser.uid,
            name: firebaseUser.displayName || firebaseUser.email || 'New User',
            email: firebaseUser.email || '',
            avatarUrl: firebaseUser.photoURL || `https://picsum.photos/seed/${firebaseUser.uid}/100/100`,
            role: 'Resident', // All auto-created users default to 'Resident'
            residentId: firebaseUser.uid,
        };
        setDoc(userDocRef, newUser).catch(err => {
            console.error("Failed to create default user document:", err);
            logout(); // If we can't create the doc, log them out to be safe.
        });
        // The onSnapshot listener will fire again once the document is created, setting the user correctly.
      }
    }, (error) => {
      console.error("Error fetching user document:", error);
      logout();
    });

    return () => unsubscribe();
  }, [firebaseUser, isAuthLoading, firestore, pathname, router, logout]);

  const login = async (credential: string, password: string) => {
    if (!auth || !firestore) throw new Error("Auth/Firestore service not available.");

    const email = credential;
    // Store credentials in memory for re-login if admin creates a user
    adminCredentials = { email, password };
    await signInWithEmailAndPassword(auth, email, password);
  };
  
  const signInWithGoogle = async () => {
    if (!auth || !firestore) throw new Error("Authentication service not available.");

    const provider = new GoogleAuthProvider();
    try {
        const result = await signInWithPopup(auth, provider);
        const authUser = result.user;

        // After successful sign-in, check if a user document exists.
        const userDocRef = doc(firestore, 'users', authUser.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (!userDocSnap.exists()) {
            // If the user is new, create both a user and a resident document.
            console.log(`New Google user ${authUser.uid}. Creating user and resident documents.`);
            const batch = writeBatch(firestore);

            const residentId = authUser.uid;
            const userId = `R-${authUser.uid.slice(0,6).toUpperCase()}`;

            const newResident: Resident = {
                id: residentId,
                userId: userId,
                firstName: authUser.displayName?.split(' ')[0] || 'New',
                lastName: authUser.displayName?.split(' ').slice(1).join(' ') || 'Resident',
                middleName: '',
                address: 'Not specified',
                birthdate: new Date().toISOString().split('T')[0], // Placeholder
                householdNumber: 'N/A',
                email: authUser.email || '',
                contactNumber: authUser.phoneNumber || '',
                avatarUrl: authUser.photoURL || `https://picsum.photos/seed/${residentId}/100/100`,
            };
            const residentRef = doc(firestore, 'residents', residentId);
            batch.set(residentRef, newResident);

            const newUser: User = {
                id: residentId,
                name: authUser.displayName || 'New User',
                email: authUser.email || '',
                avatarUrl: newResident.avatarUrl,
                role: 'Resident',
                residentId: residentId,
            };
            batch.set(userDocRef, newUser);

            await batch.commit();
        }
        // The onSnapshot listener in the main useEffect will handle setting the currentUser
        // and redirecting to the dashboard automatically for both new and existing users.
    } catch (error: any) {
      console.error("Google Sign-In Error:", error);
      if (error.code !== 'auth/popup-closed-by-user') {
        toast({ title: 'Google Sign-In Failed', description: error.message || 'An unknown error occurred.', variant: 'destructive' });
      }
    }
  };

  const reSignInAdmin = async () => {
    if (!auth || !adminCredentials) return;
    try {
        await signInWithEmailAndPassword(auth, adminCredentials.email, adminCredentials.password);
    } catch (error) {
        console.error("Failed to re-sign in admin", error);
        // If re-sign-in fails, clear credentials and log out completely
        adminCredentials = null;
        logout();
    }
  };


  const changePassword = async (currentPassword: string, newPassword: string) => {
    if (!auth?.currentUser) throw new Error("You must be logged in to change your password.");

    const user = auth.currentUser;
    const providerId = user.providerData[0]?.providerId;

    // Prevent password change for users who signed in with a social provider
    if (providerId !== 'password') {
      throw new Error(`You cannot change your password because you signed in with ${providerId.replace('.com', '')}.`);
    }

    if (!user.email) throw new Error("Cannot re-authenticate user without an email.");

    const credential = EmailAuthProvider.credential(user.email, currentPassword);

    try {
        await reauthenticateWithCredential(user, credential);
        await updatePassword(user, newPassword);
        // We log out the user for security, forcing them to log in with the new password.
        logout();
    } catch (error: any) {
        console.error("Password change error:", error.code);
        if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
            throw new Error("The current password you entered is incorrect.");
        }
        throw new Error("Failed to change password. Please try again.");
    }
  };

  const sendPasswordReset = async (email: string) => {
    if (!auth) throw new Error("Authentication service not available.");
    await sendPasswordResetEmail(auth, email);
  };

  const addResident = async (newResidentData: Omit<Resident, 'id' | 'userId' | 'avatarUrl' | 'address'> & { email: string }) => {
    if (!firestore || !auth) throw new Error("Firebase services are not available.");
    
    const defaultPassword = 'password';
    const adminUser = auth.currentUser; // Keep track of the currently logged-in admin

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, newResidentData.email, defaultPassword);
        const authUser = userCredential.user;
        
        const batch = writeBatch(firestore);

        const residentId = authUser.uid;
        const userId = `R-${authUser.uid.slice(0,6).toUpperCase()}`;

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

        // After creating the user, sign them out and sign the admin back in.
        if (auth.currentUser?.uid === authUser.uid && adminUser) {
            await signOut(auth);
            if(adminCredentials) {
              await signInWithEmailAndPassword(auth, adminCredentials.email, adminCredentials.password);
            }
        }

    } catch (error: any) {
      // If the admin was signed out by the process, sign them back in
      if (adminCredentials && auth.currentUser?.email !== adminCredentials.email) {
          await reSignInAdmin();
      }
      
      console.error("Error creating resident:", error);
      if (error.code === 'auth/email-already-in-use') {
          throw new Error("An account for this email already exists.");
      }
      throw new Error("Failed to create resident account.");
    }
  };

  const updateResident = async (residentId: string, dataToUpdate: Partial<Resident>) => {
    if (!firestore) return;
  
    const residentRef = doc(firestore, 'residents', residentId);
    await updateDoc(residentRef, dataToUpdate);
  
    // Also update the associated user document if needed
    const dataForUser: Partial<User> = {};
    if (dataToUpdate.firstName || dataToUpdate.lastName) {
       // To get the full name, we need the full document
       const residentSnap = await getDoc(residentRef);
       if (residentSnap.exists()) {
           const residentData = residentSnap.data() as Resident;
           // Construct name from potentially partial data
           const newFirstName = dataToUpdate.firstName || residentData.firstName;
           const newLastName = dataToUpdate.lastName || residentData.lastName;
           dataForUser.name = `${newFirstName} ${newLastName}`;
       }
    }
  
    if (Object.keys(dataForUser).length > 0) {
      const userRef = doc(firestore, 'users', residentId);
      await updateDoc(userRef, dataForUser);
    }
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

  const addDocumentRequest = (request: Omit<DocumentRequest, 'id' | 'trackingNumber' | 'requestDate' | 'status' | 'referenceNumber'>) => {
    if (!firestore || !currentUser?.residentId || !currentUser.name) {
       toast({
          title: 'Error',
          description: 'Could not identify the current resident. Please log in again.',
          variant: 'destructive',
       });
       return;
    }

    const newId = doc(collection(firestore, 'documentRequests')).id;
    const newIdNumber = (documentRequests?.length ?? 0) + 1;
    const trackingNumber = `IBGY-${new Date().getFullYear().toString().slice(2)}${(new Date().getMonth() + 1).toString().padStart(2, '0')}${new Date().getDate().toString().padStart(2, '0')}${String(newIdNumber).padStart(3, '0')}`;
    const newRequest: DocumentRequest = {
        ...request,
        residentId: currentUser.residentId,
        residentName: currentUser.name,
        id: newId,
        requestDate: new Date().toISOString().split('T')[0], // YYYY-MM-DD
        status: 'Pending',
        trackingNumber: trackingNumber,
        referenceNumber: trackingNumber, // Use tracking number as reference number
    };
    const requestRef = doc(firestore, 'documentRequests', newId);
    setDocumentNonBlocking(requestRef, newRequest, { merge: true });
     toast({
      title: "Request Submitted!",
      description: `Your request for a ${newRequest.documentType} has been received.`,
    });
  };

  const updateDocumentRequestStatus = async (id: string, status: DocumentRequestStatus, paymentDetails?: DocumentRequest['paymentDetails']) => {
    if (!firestore) return;

    const requestRef = doc(firestore, 'documentRequests', id);
    const updateData: { [key: string]: any } = { status };

    // If status is 'Approved', snapshot the resident's current data
    if (status === 'Approved') {
        const requestSnap = await getDoc(requestRef);
        if (requestSnap.exists()) {
            const requestData = requestSnap.data() as DocumentRequest;
            const residentRef = doc(firestore, 'residents', requestData.residentId);
            const residentSnap = await getDoc(residentRef);
            if (residentSnap.exists()) {
                const residentData = residentSnap.data() as Resident;
                // Add a snapshot of resident data to the request document
                updateData.residentSnapshot = {
                    firstName: residentData.firstName,
                    lastName: residentData.lastName,
                    address: residentData.address,
                    birthdate: residentData.birthdate,
                };
            }
        }
        updateData.approvalDate = new Date().toISOString();
    }
    if (status === 'Released') {
      updateData.releaseDate = new Date().toISOString();
    }
    if (status === 'Paid' && paymentDetails) {
        updateData.paymentDetails = paymentDetails;
    }


    await updateDoc(requestRef, updateData);
};
  
  const deleteDocumentRequest = (id: string) => {
    if (!firestore) return;
    const requestRef = doc(firestore, 'documentRequests', id);
    deleteDocumentNonBlocking(requestRef);
  };

  const addUser = async (user: Omit<User, 'id' | 'avatarUrl' | 'residentId'>) => {
    if (!firestore || !auth) throw new Error("Firebase services are not available.");
    const adminUser = auth.currentUser;
    
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

        // After creating the user, sign them out and sign the admin back in.
        if (auth.currentUser?.uid === authUser.uid && adminUser) {
            await signOut(auth);
            if(adminCredentials) {
              await signInWithEmailAndPassword(auth, adminCredentials.email, adminCredentials.password);
            }
        }

    } catch (error: any) {
        if (adminCredentials && auth.currentUser?.email !== adminCredentials.email) {
          await reSignInAdmin();
        }

        if (error.code === 'auth/email-already-in-use') {
            throw new Error("An account for this email already exists.");
        }
        throw new Error("Failed to create user account.");
    }
  };

  const updateUser = async (dataToUpdate: Partial<User> & { id: string }) => {
    if (!firestore || !dataToUpdate.id) return;
    const { id, ...updateData } = dataToUpdate;
    const userRef = doc(firestore, 'users', id);
    await updateDoc(userRef, updateData);
  
    // If it's a resident user, update the resident doc too
    const userSnap = await getDoc(userRef);
    if (userSnap.exists() && userSnap.data().role === 'Resident' && userSnap.data().residentId) {
      const residentRef = doc(firestore, 'residents', userSnap.data().residentId);
      const dataForResident: Partial<Resident> = {};
      if (updateData.name) {
        // Attempt to split name, this is a bit fragile
        const nameParts = updateData.name.split(' ');
        dataForResident.firstName = nameParts[0];
        dataForResident.lastName = nameParts.slice(1).join(' ');
      }
      if (Object.keys(dataForResident).length > 0) {
        await updateDoc(residentRef, dataForResident);
      }
    }
  };
  

  const deleteUser = (userId: string) => {
    if (!firestore) return;
    console.warn("Warning: Deleting user from Firestore only. Auth user remains and should be deleted from the Firebase Console or via a backend function.");
    const userRef = doc(firestore, 'users', userId);
    deleteDocumentNonBlocking(userRef);
  };

  return (
    <AppContext.Provider value={{
      currentUser,
      setCurrentUser,
      barangayConfig,
      logout,
      residents,
      addResident,
      updateResident,
      deleteResident,
      documentRequests,
      addDocumentRequest,
      updateDocumentRequestStatus,
      deleteDocumentRequest,
      users,
      addUser,
      updateUser,
      deleteUser,
      isDataLoading,
      login,
      changePassword,
      sendPasswordReset,
      signInWithGoogle,
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
