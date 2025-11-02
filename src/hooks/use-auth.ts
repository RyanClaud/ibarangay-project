'use client';

<<<<<<< HEAD
import { useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAppContext } from '@/contexts/app-context';
import { useUser, useFirebase } from '@/firebase/provider';
import { doc, getDoc, setDoc } from 'firebase/firestore';
=======
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAppContext } from '@/contexts/app-context';
import { useUser, useFirebase } from '@/firebase/provider';
import { doc, getDoc } from 'firebase/firestore';
>>>>>>> 6c232461fb2b050965cc4b24accfb5c51a747356
import type { User as AuthUser } from 'firebase/auth';
import type { User } from '@/lib/types';


/**
 * Ensures a user document exists in Firestore for a given authenticated user.
<<<<<<< HEAD
 * If the document doesn't exist, it creates a default 'Resident' user document.
=======
 * If the document doesn't exist, it returns null, signaling a potentially deleted user.
 * This function NO LONGER creates user documents on the fly during login.
>>>>>>> 6c232461fb2b050965cc4b24accfb5c51a747356
 * @param firestore - The Firestore instance.
 * @param authUser - The user object from Firebase Authentication.
 * @returns The user document from Firestore or null if it doesn't exist.
 */
<<<<<<< HEAD
export const ensureUserDocument = async (firestore: any, authUser: AuthUser, logout: () => void): Promise<User | null> => {
=======
export const ensureUserDocument = async (firestore: any, authUser: AuthUser): Promise<User | null> => {
>>>>>>> 6c232461fb2b050965cc4b24accfb5c51a747356
    if (!firestore || !authUser) return null;

    const userRef = doc(firestore, 'users', authUser.uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
<<<<<<< HEAD
        const userData = userSnap.data() as User;
        // Data consistency check: if role is missing, it's a broken user doc.
        if (!userData.role) {
            console.error(`User document for ${authUser.uid} is missing a role. Forcing logout.`);
            logout();
            return null;
        }
        return userData;
    }

    // If the user document does not exist, create a default one.
    // This handles users created manually in the Firebase Auth console.
    console.warn(`No user document found for ${authUser.uid}. Creating a default 'Resident' user document.`);
    const newUser: User = {
        id: authUser.uid,
        name: authUser.displayName || authUser.email || 'New User',
        email: authUser.email || '',
        avatarUrl: authUser.photoURL || `https://picsum.photos/seed/${authUser.uid}/100/100`,
        role: 'Resident', // Default to 'Resident'
        residentId: authUser.uid, // Assume residentId is the same as userId for this default case
    };
    await setDoc(userRef, newUser);
    return newUser;
=======
        return userSnap.data() as User;
    }

    // If the user document does not exist, return null.
    // This will cause the useAuth hook to treat the user as logged out.
    return null;
>>>>>>> 6c232461fb2b050965cc4b24accfb5c51a747356
};


export function useAuth() {
<<<<<<< HEAD
  const { setCurrentUser, currentUser, logout: mainAppLogout } = useAppContext();
=======
  const { setCurrentUser, currentUser } = useAppContext();
>>>>>>> 6c232461fb2b050965cc4b24accfb5c51a747356
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
<<<<<<< HEAD
    ensureUserDocument(firestore, firebaseUser, mainAppLogout).then((appUser) => {
=======
    ensureUserDocument(firestore, firebaseUser).then((appUser) => {
>>>>>>> 6c232461fb2b050965cc4b24accfb5c51a747356
        if (appUser) {
            setCurrentUser(appUser);
            if (isLoginPage) {
                router.push('/dashboard');
            }
        } else {
<<<<<<< HEAD
            // This case now only happens if ensureUserDocument itself calls logout.
            // No need to duplicate the logic here.
=======
            // This case happens if ensureUserDocument returns null (e.g., deleted user).
            console.error(`Auth user ${firebaseUser.uid} has no matching document in Firestore. Forcing logout.`);
            setCurrentUser(null);
            if (!isLoginPage) {
                router.push('/login');
            }
>>>>>>> 6c232461fb2b050965cc4b24accfb5c51a747356
        }
        setIsLoading(false);
    });

<<<<<<< HEAD
  }, [firebaseUser, isAuthLoading, firestore, pathname, router, setCurrentUser, mainAppLogout]);
=======
  }, [firebaseUser, isAuthLoading, firestore, pathname, router, setCurrentUser]);
>>>>>>> 6c232461fb2b050965cc4b24accfb5c51a747356
  
  return { user: currentUser, isLoading };
}

    