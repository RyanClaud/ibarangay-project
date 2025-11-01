import { SidebarTrigger } from "@/components/ui/sidebar";
import { UserNav } from "@/components/layout/user-nav";
import { getLoggedInUser } from "@/lib/data";

export function Header() {
  // We can pass a role here to simulate different users
  const user = getLoggedInUser("Admin");

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
