'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAppContext } from '@/contexts/app-context';
import { useUser } from '@/firebase/provider';

export function useAuth() {
  const { users, isDataLoading: isContextLoading, setCurrentUser } = useAppContext();
  const { user: firebaseUser, isUserLoading: isAuthLoading } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const isLoginPage = pathname === '/login';

    // If Firebase auth is still loading, or the app's data is still loading, we wait.
    if (isAuthLoading || isContextLoading) {
      setIsLoading(true);
      return;
    }

    // If there's no authenticated user from Firebase...
    if (!firebaseUser) {
      setCurrentUser(null); // Clear any stale user profile
      if (!isLoginPage) {
        // And we are not on the login page, redirect there.
        router.push('/login');
      } else {
        // If we are on the login page, we are done loading.
        setIsLoading(false);
      }
      return;
    }

    // If we have a Firebase user, but the list of users from Firestore isn't ready yet,
    // we continue to wait.
    if (!users) {
      setIsLoading(true);
      return;
    }

    // We have a Firebase user and the list of users from Firestore.
    // Find the full user profile from our database.
    const appUser = users.find(u => u.id === firebaseUser.uid);

    if (appUser) {
      // We found the user profile. Set it globally.
      setCurrentUser(appUser);
      if (isLoginPage) {
        // If we're on the login page, redirect to the dashboard.
        router.push('/dashboard');
      } else {
        // Otherwise, we're done loading.
        setIsLoading(false);
      }
    } else {
      // This is a critical state: authenticated with Firebase, but no profile in our DB.
      // This could happen if the user was deleted from Firestore but not Auth.
      console.error(`Auth user ${firebaseUser.uid} has no matching document in Firestore.`);
      setCurrentUser(null);
      if (!isLoginPage) {
        // If not on the login page, send them there to be safe.
        router.push('/login');
      } else {
        setIsLoading(false);
      }
    }
  }, [firebaseUser, users, isAuthLoading, isContextLoading, pathname, router, setCurrentUser]);

  const { currentUser } = useAppContext();
  return { user: currentUser, isLoading };
}
