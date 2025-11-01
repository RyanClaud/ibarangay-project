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
 */
export const ensureUserDocument = async (firestore: any, authUser: AuthUser): Promise<void> => {
    if (!firestore || !authUser) return;

    const userRef = doc(firestore, 'users', authUser.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
        console.log(`User document for UID ${authUser.uid} not found. Creating one...`);
        // Find the matching user from the initial hardcoded data by email
        const initialUser = initialUsersData.find(u => u.email === authUser.email);

        if (initialUser) {
            const newUserDoc: User = {
                ...initialUser,
                id: authUser.uid, // CRITICAL: Use the actual Auth UID as the document ID
            };
            try {
                await setDoc(userRef, newUserDoc);
                console.log(`Successfully created user document for ${authUser.email}`);
            } catch (error) {
                console.error("Error creating user document:", error);
            }
        } else {
             console.warn(`No initial user data found for email: ${authUser.email}. Cannot create user document.`);
        }
    }
};


export function useAuth() {
  const { users, isDataLoading: isContextLoading, setCurrentUser, currentUser } = useAppContext();
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
      } else {
        setIsLoading(false); // On login page and logged out, so loading is finished.
      }
      return;
    }

    // Auth is settled and we have a firebaseUser.
    // Now, ensure the corresponding Firestore document exists.
    ensureUserDocument(firestore, firebaseUser).then(() => {
        // After ensuring the doc exists, wait for the main user list to load.
        if (isContextLoading) {
            setIsLoading(true);
            return;
        }

        if (users) {
            const appUser = users.find(u => u.id === firebaseUser.uid);

            if (appUser) {
                setCurrentUser(appUser);
                if (isLoginPage) {
                    router.push('/dashboard');
                } else {
                    setIsLoading(false);
                }
            } else {
                // This state is now less likely but could happen if the user list is stale.
                console.error(`Auth user ${firebaseUser.uid} has no matching document in Firestore.`);
                setCurrentUser(null);
                if (!isLoginPage) {
                    router.push('/login');
                } else {
                    setIsLoading(false);
                }
            }
        }
    });

  }, [firebaseUser, isAuthLoading, users, isContextLoading, firestore, pathname, router, setCurrentUser]);
  
  return { user: currentUser, isLoading };
}
