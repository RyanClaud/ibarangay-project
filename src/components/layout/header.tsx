'use client';

import { SidebarTrigger } from "@/components/ui/sidebar";
import { UserNav } from "@/components/layout/user-nav";
import { useAppContext } from "@/contexts/app-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { getLoggedInUser } from "@/lib/data";

export function Header() {
  const { currentUser } = useAppContext();
  const router = useRouter();

  useEffect(() => {
    if (!currentUser) {
      // For simulation, if no user is logged in (e.g. page refresh),
      // default to an Admin user. In a real app, you'd redirect to login.
      // Or, better, your AppProvider would persist auth state.
      // router.push('/login');
    }
  }, [currentUser, router]);

  // If there's no logged-in user, we can show a loading state or nothing.
  // Or for now, just default to a mock user to prevent crashes.
  const user = currentUser || getLoggedInUser("Admin");

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-card px-4 md:px-6">
      <div className="md:hidden">
        <SidebarTrigger />
      </div>
      <div className="flex w-full items-center justify-end gap-4">
        <UserNav user={user} />
      </div>
    </header>
  );
}
