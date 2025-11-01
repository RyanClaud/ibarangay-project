'use client';

import { SidebarTrigger } from "@/components/ui/sidebar";
import { UserNav } from "@/components/layout/user-nav";
import { useAppContext } from "@/contexts/app-context";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

export function Header() {
  const { currentUser } = useAppContext();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-card px-4 md:px-6">
      <div className="md:hidden">
        <SidebarTrigger />
      </div>
      <div className="flex w-full items-center justify-end gap-4">
        {!isClient || !currentUser ? (
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground"/>
        ) : (
          <UserNav user={currentUser} />
        )}
      </div>
    </header>
  );
}
