'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAppContext } from '@/contexts/app-context';
import { useUser, useFirebase } from '@/firebase/provider';
import { users as initialUsersData } from '@/lib/data';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import type { User as AuthUser } from 'firebase/auth';
import type { User } from '@/lib/types';


/**
 * Ensures a user document exists in Firestore for a given authenticated user.
 * If the document doesn't exist, it creates one based on the initial staff data.
 * This is crucial for linking Firebase Auth users to their roles and profiles in Firestore.
 * @param firestore - The Firestore instance.
 * @param authUser - The user object from Firebase Authentication.
 * @returns The user document from Firestore.
 */
export const ensureUserDocument = async (firestore: any, authUser: AuthUser): Promise<User | null> => {
    if (!firestore || !authUser) return null;

    const userRef = doc(firestore, 'users', authUser.uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
        return userSnap.data() as User;
    }

    console.log(`User document for UID ${authUser.uid} not found. Attempting to create one...`);
    const initialUser = initialUsersData.find(u => u.email === authUser.email);

    if (initialUser) {
        const newUserDoc: User = {
            ...initialUser,
            id: authUser.uid, // CRITICAL: Use the actual Auth UID as the document ID
        };
        try {
            await setDoc(userRef, newUserDoc);
            console.log(`Successfully created user document for ${authUser.email}`);
            return newUserDoc;
        } catch (error) {
            console.error("Error creating user document:", error);
            return null;
        }
    } else {
         console.warn(`No initial user data found for email: ${authUser.email}. Cannot create user document.`);
         return null;
    }
};


export function useAuth() {
  const { setCurrentUser, currentUser } = useAppContext();
  const { user: firebaseUser, isUserLoading: isAuthLoading } = useUser();
  const { firestore } = useFirebase();
  const router = useRouter();
  const pathname = usePathname();

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const isLoginPage = pathname === '/login';

    // Primary loading state: wait for Firebase Auth to settle.
    if (isAuthLoading) {
      setIsLoading(true);
      return;
    }

    // After Auth settles, if there's no firebaseUser, they are logged out.
    if (!firebaseUser) {
      setCurrentUser(null);
      if (!isLoginPage) {
        router.push('/login');
      }
      setIsLoading(false);
      return;
    }

    // Auth is settled and we have a firebaseUser.
    // Ensure the corresponding Firestore document exists and get it.
    ensureUserDocument(firestore, firebaseUser).then((appUser) => {
        if (appUser) {
            setCurrentUser(appUser);
            if (isLoginPage) {
                router.push('/dashboard');
            }
        } else {
            // This case happens if ensureUserDocument fails or returns null
            console.error(`Auth user ${firebaseUser.uid} has no matching document in Firestore.`);
            setCurrentUser(null);
            if (!isLoginPage) {
                router.push('/login');
            }
        }
        setIsLoading(false);
    });

  }, [firebaseUser, isAuthLoading, firestore, pathname, router, setCurrentUser]);
  
  return { user: currentUser, isLoading };
}
