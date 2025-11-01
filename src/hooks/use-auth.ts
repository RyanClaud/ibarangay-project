'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAppContext } from '@/contexts/app-context';
import { useUser, useFirebase } from '@/firebase/provider';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import type { User as AuthUser } from 'firebase/auth';
import type { User } from '@/lib/types';


/**
 * Ensures a user document exists in Firestore for a given authenticated user.
 * If the document doesn't exist, it returns null, signaling a potential deleted user.
 * This function NO LONGER creates user documents on the fly during login.
 * @param firestore - The Firestore instance.
 * @param authUser - The user object from Firebase Authentication.
 * @returns The user document from Firestore or null if it doesn't exist.
 */
export const ensureUserDocument = async (firestore: any, authUser: AuthUser): Promise<User | null> => {
    if (!firestore || !authUser) return null;

    const userRef = doc(firestore, 'users', authUser.uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
        return userSnap.data() as User;
    }

    // If the user document does not exist, return null.
    // This will cause the useAuth hook to treat the user as logged out.
    return null;
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
            // This case happens if ensureUserDocument returns null (e.g., deleted user).
            console.error(`Auth user ${firebaseUser.uid} has no matching document in Firestore. Forcing logout.`);
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
