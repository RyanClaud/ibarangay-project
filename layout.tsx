'use client';

import Image from "next/image";
import { Input } from "@/components/ui/input";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { UserNav } from "@/user-nav";
import { useAppContext } from "@/contexts/app-context";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Users,
  FileText,
  BarChart3,
  Settings,
  CreditCard,
  FileSignature,
  Search,
  Loader2,
} from "lucide-react";

const navItems = {
  Admin: [
    { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/users", icon: Users, label: "Users" },
    { href: "/residents", icon: Users, label: "Residents" },
    { href: "/requests", icon: FileSignature, label: "Requests" },
    { href: "/payments", icon: CreditCard, label: "Payments" },
    { href: "/reports", icon: BarChart3, label: "Reports" },
    { href: "/insights", icon: Sparkles, label: "AI Insights" },
    { href: "/settings", icon: Settings, label: "Settings" },
  ],
  "Barangay Captain": [
    { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/residents", icon: Users, label: "Residents" },
    { href: "/requests", icon: FileSignature, label: "Requests" },
    { href: "/reports", icon: BarChart3, label: "Reports" },
    { href: "/insights", icon: Sparkles, label: "AI Insights" },
  ],
  Secretary: [
    { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/residents", icon: Users, label: "Residents" },
    { href: "/requests", icon: FileSignature, label: "Requests" },
  ],
  Treasurer: [
    { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/payments", icon: CreditCard, label: "Payments" },
    { href: "/reports", icon: BarChart3, label: "Reports" },
  ],
  Resident: [
    { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/requests/history", icon: FileText, label: "My Requests" },
  ],
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { currentUser, barangayConfig, isDataLoading } = useAppContext();
  const pathname = usePathname();

  const userRole = currentUser?.role || "Resident";
  const currentNavItems = navItems[userRole] || navItems.Resident;

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-2">
            <Image src="/icon.png" alt="iBarangay Logo" width={40} height={40} />
            <div className="flex flex-col">
              <span className="text-lg font-semibold text-sidebar-foreground">iBarangay</span>
              <span className="text-xs text-sidebar-foreground/70">{barangayConfig?.name || 'Community Portal'}</span>
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {currentNavItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <Link href={item.href} legacyBehavior passHref>
                  <SidebarMenuButton
                    isActive={pathname === item.href}
                    tooltip={item.label}
                  >
                    <item.icon />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background px-4 sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
          <SidebarTrigger className="sm:hidden" />
          <div className="relative ml-auto flex-1 md:grow-0" style={{ minWidth: '250px' }}>
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search..."
              className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[320px]"
            />
          </div>
          <div className="flex items-center gap-4">
            {currentUser && isDataLoading && (
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            )}
            <UserNav />
          </div>
        </header>
        <main className="flex-1 p-4 sm:px-6 sm:py-0">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}

function Sparkles(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg
        {...props}
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        >
        <path d="m12 3-1.9 4.8-4.8 1.9 4.8 1.9L12 16l1.9-4.8 4.8-1.9-4.8-1.9Z" />
        </svg>
    );
}