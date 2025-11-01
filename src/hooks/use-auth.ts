'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAppContext } from '@/contexts/app-context';

export function useAuth() {
  const { currentUser, isDataLoading } = useAppContext();
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Don't run authentication checks on the login page itself
    if (pathname === '/login') {
      setIsLoading(false);
      return;
    }

    // While the context is loading user data, we are in a loading state.
    if (isDataLoading) {
      setIsLoading(true);
      return;
    }

    // After loading, if there's no user, redirect to login.
    if (!currentUser) {
      router.push('/login');
      // No need to setIsLoading(false) here because the redirect will unmount this component.
      return;
    }

    // If we've finished loading and there is a user, we are no longer loading.
    setIsLoading(false);

  }, [currentUser, isDataLoading, router, pathname]);

  return { user: currentUser, isLoading };
}
