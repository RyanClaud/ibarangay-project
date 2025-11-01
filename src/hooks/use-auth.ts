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
 * If the document doesn't exist, it creates one.
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

    // If no document exists, create a default one.
    // This handles users created via the UI or other methods who don't have a pre-defined static entry.
    const newUserDoc: User = {
        id: authUser.uid, // CRITICAL: Use the actual Auth UID as the document ID
        email: authUser.email || '',
        name: authUser.displayName || authUser.email?.split('@')[0] || 'New User',
        avatarUrl: authUser.photoURL || `https://picsum.photos/seed/${authUser.uid}/100/100`,
        role: 'Resident', // Default to the most restrictive role.
        residentId: authUser.uid, // Assume the residentId is the same as the userId for new residents.
    };

    try {
        await setDoc(userRef, newUserDoc);
        console.log(`Successfully created default user document for ${authUser.email}`);
        return newUserDoc;
    } catch (error) {
        console.error("Error creating user document:", error);
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
