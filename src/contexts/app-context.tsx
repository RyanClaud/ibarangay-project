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
import { collection, doc, writeBatch, getDoc, setDoc, query, where, getDocs, limit } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth';
import { toast } from '@/hooks/use-toast';

interface AppContextType {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  logout: () => void;
  residents: Resident[] | null;
  addResident: (resident: Omit<Resident, 'id' | 'userId' | 'avatarUrl' | 'address'> & { email: string }) => Promise<void>;
  updateResident: (resident: Resident, newAvatarFile?: File | null) => Promise<void>;
  deleteResident: (residentId: string) => void;
  documentRequests: DocumentRequest[] | null;
  addDocumentRequest: (request: Omit<DocumentRequest, 'id' | 'trackingNumber' | 'requestDate' | 'status'>) => void;
  updateDocumentRequestStatus: (id: string, status: DocumentRequestStatus) => void;
  users: User[] | null;
  addUser: (user: Omit<User, 'id' | 'avatarUrl' | 'residentId'>) => Promise<void>;
  updateUser: (user: User, newAvatarFile?: File | null) => Promise<void>;
  deleteUser: (userId: string) => void;
  isDataLoading: boolean;
  login: (credential: string, password: string) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

function AppProviderContent({ children }: { children: ReactNode }) {
  const { firestore, auth, storage } = useFirebase();
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // --- Staff-specific Queries ---
  const allUsersQuery = useMemoFirebase(() => {
    if (!firestore || !currentUser || currentUser.role === 'Resident') return null;
    return collection(firestore, 'users');
  }, [firestore, currentUser]);
  const { data: allUsers, isLoading: isAllUsersLoading } = useCollection<User>(allUsersQuery);

  const allResidentsQuery = useMemoFirebase(() => {
    if (!firestore || !currentUser || currentUser.role === 'Resident') return null;
    return collection(firestore, 'residents');
  }, [firestore, currentUser]);
  const { data: allResidents, isLoading: isAllResidentsLoading } = useCollection<Resident>(allResidentsQuery);

  // --- Resident-specific Queries ---
  const singleUserDocRef = useMemoFirebase(() => {
    if (!firestore || !currentUser?.id || currentUser.role !== 'Resident') return null;
    return doc(firestore, 'users', currentUser.id);
  }, [firestore, currentUser]);
  const { data: singleUser, isLoading: isSingleUserLoading } = useDoc<User>(singleUserDocRef);
  
  const singleResidentDocRef = useMemoFirebase(() => {
    if (!firestore || !currentUser?.residentId || currentUser.role !== 'Resident') return null;
    return doc(firestore, 'residents', currentUser.residentId);
  }, [firestore, currentUser]);
  const { data: singleResident, isLoading: isSingleResidentLoading } = useDoc<Resident>(singleResidentDocRef);
  
  // --- Combined Data Logic ---
  const users = useMemo(() => {
    if (!currentUser) return null;
    if (currentUser.role === 'Resident') {
      return singleUser ? [singleUser] : [];
    }
    return allUsers;
  }, [currentUser, allUsers, singleUser]);

  const residents = useMemo(() => {
    if (!currentUser) return null;
    if (currentUser.role === 'Resident') {
      return singleResident ? [singleResident] : [];
    }
    return allResidents;
  }, [currentUser, allResidents, singleResident]);


  // --- Document Requests Query (works for both roles) ---
  const documentRequestsQuery = useMemoFirebase(() => {
    if (!firestore || !currentUser) return null;
    if (currentUser.role !== 'Resident') {
      return collection(firestore, 'documentRequests');
    }
    return query(collection(firestore, 'documentRequests'), where('residentId', '==', currentUser.id));
  }, [firestore, currentUser]);
  const { data: documentRequests, isLoading: isRequestsLoading } = useCollection<DocumentRequest>(documentRequestsQuery);

  const isDataLoading = !currentUser || isAllUsersLoading || isSingleUserLoading || isAllResidentsLoading || isSingleResidentLoading || isRequestsLoading;

  const login = async (credential: string, password: string) => {
    if (!auth || !firestore) throw new Error("Auth/Firestore service not available.");
  
    const email = credential;
    // Attempt to sign in with the determined email
    await signInWithEmailAndPassword(auth, email, password);
  };

  const logout = () => {
    if (!auth) return;
    initiateSignOut(auth);
    setCurrentUser(null);
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    if (!auth?.currentUser) throw new Error("You must be logged in to change your password.");

    const user = auth.currentUser;
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

  const addResident = async (newResidentData: Omit<Resident, 'id' | 'userId' | 'avatarUrl' | 'address'> & { email: string }) => {
    if (!firestore || !auth) throw new Error("Firebase services are not available.");
    
    const defaultPassword = 'password';

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
    } catch (error: any) {
        if (error.code === 'auth/email-already-in-use') {
            throw new Error("An account for this email already exists.");
        }
        throw error;
    }
  };

  const updateResident = async (updatedResident: Resident, newAvatarFile?: File | null) => {
    if (!firestore || !storage) return;

    let updatedData = { ...updatedResident };

    if (newAvatarFile) {
        const storageRef = ref(storage, `profile-pictures/${updatedResident.id}/${newAvatarFile.name}`);
        const uploadResult = await uploadBytes(storageRef, newAvatarFile);
        const avatarUrl = await getDownloadURL(uploadResult.ref);
        updatedData.avatarUrl = avatarUrl;
    }
    
    const residentRef = doc(firestore, 'residents', updatedData.id);
    updateDocumentNonBlocking(residentRef, updatedData);
  
    const userRef = doc(firestore, 'users', updatedData.id);
    updateDocumentNonBlocking(userRef, { 
      name: `${updatedData.firstName} ${updatedData.lastName}`,
      avatarUrl: updatedData.avatarUrl, // Also update user doc
    });
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
    const newRequest: DocumentRequest = {
        ...request,
        residentId: currentUser.residentId,
        residentName: currentUser.name,
        id: newId,
        requestDate: new Date().toISOString().split('T')[0], // YYYY-MM-DD
        status: 'Pending',
        trackingNumber: `IBGY-${new Date().getFullYear().toString().slice(2)}${(new Date().getMonth() + 1).toString().padStart(2, '0')}${new Date().getDate().toString().padStart(2, '0')}${String(newIdNumber).padStart(3, '0')}`,
    };
    const requestRef = doc(firestore, 'documentRequests', newId);
    setDocumentNonBlocking(requestRef, newRequest, { merge: true });
     toast({
      title: "Request Submitted!",
      description: `Your request for a ${newRequest.documentType} has been received.`,
    });
  };

  const updateDocumentRequestStatus = (id: string, status: DocumentRequestStatus) => {
    if (!firestore) return;
    const requestRef = doc(firestore, 'documentRequests', id);
    updateDocumentNonBlocking(requestRef, { status });
  };

  const addUser = async (user: Omit<User, 'id' | 'avatarUrl' | 'residentId'>) => {
    if (!firestore || !auth) throw new Error("Firebase services are not available.");
    
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
        if (error.code === 'auth/email-already-in-use') {
            throw new Error("An account for this email already exists.");
        }
        throw error;
    }
  };

  const updateUser = async (updatedUser: User, newAvatarFile?: File | null) => {
    if (!firestore || !storage) return;

    let updatedData = { ...updatedUser };
    const { id, email, ...rest } = updatedData; // email and id cannot be changed

    if (newAvatarFile) {
        const storageRef = ref(storage, `profile-pictures/${id}/${newAvatarFile.name}`);
        const uploadResult = await uploadBytes(storageRef, newAvatarFile);
        const avatarUrl = await getDownloadURL(uploadResult.ref);
        rest.avatarUrl = avatarUrl;
    }
    
    const userRef = doc(firestore, updatedUser.id);
    updateDocumentNonBlocking(userRef, rest);
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
      changePassword,
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
