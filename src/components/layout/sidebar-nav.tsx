'use client';

import {
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  Users,
  FileText,
  CircleDollarSign,
  BarChart3,
  Sparkles,
  Settings,
  LogOut,
  FileSignature,
} from 'lucide-react';
import { Logo } from '@/components/logo';
import type { Role } from '@/lib/types';
import { useAppContext } from '@/contexts/app-context';
import { getLoggedInUser } from '@/lib/data';

const navItems = {
  Admin: [
    { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/residents', icon: Users, label: 'Residents' },
    { href: '/documents', icon: FileSignature, label: 'Documents' },
    { href: '/payments', icon: CircleDollarSign, label: 'Payments' },
    { href: '/reports', icon: BarChart3, label: 'Reports' },
    { href: '/insights', icon: Sparkles, label: 'AI Insights' },
    { href: '/settings', icon: Settings, label: 'Settings' },
  ],
  'Barangay Captain': [
    { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/residents', icon: Users, label: 'Residents' },
    { href: '/documents', icon: FileSignature, label: 'Approval' },
    { href: '/reports', icon: BarChart3, label: 'Reports' },
  ],
  Secretary: [
    { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/residents', icon: Users, label: 'Residents' },
    { href: '/documents', icon: FileSignature, label: 'Verification' },
  ],
  Treasurer: [
    { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/payments', icon: CircleDollarSign, label: 'Payments' },
    { href: '/reports', icon: BarChart3, label: 'Reports' },
  ],
  Resident: [
    { href: '/dashboard', icon: LayoutDashboard, label: 'My Dashboard' },
  ],
};

export function SidebarNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, logout } = useAppContext();
  
  // Default to a mock user if not logged in, to prevent UI crashes.
  // In a real app, unauthenticated users would be redirected.
  const user = currentUser || getLoggedInUser('Admin'); 
  const userNavItems = navItems[user.role] || navItems.Resident;

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <>
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-3 p-1">
          <Logo className="size-10 bg-sidebar-primary text-sidebar-primary-foreground" />
          <div className="flex flex-col">
            <h2 className="font-headline text-lg font-semibold text-sidebar-foreground">iBarangay</h2>
            <p className="text-xs text-sidebar-foreground/80">Barangay Mgt.</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarMenu>
          {userNavItems.map((item) => (
            <SidebarMenuItem key={item.label}>
              <SidebarMenuButton
                asChild
                isActive={pathname === item.href}
                className="font-body"
                tooltip={{
                  children: item.label,
                  className: 'bg-primary text-primary-foreground',
                }}
              >
                <Link href={item.href}>
                  <item.icon />
                  <span>{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>

      <SidebarSeparator />

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton 
              onClick={handleLogout}
              tooltip={{
                children: 'Logout',
                className: 'bg-primary text-primary-foreground',
            }}>
                <LogOut />
                <span>Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </>
  );
}
