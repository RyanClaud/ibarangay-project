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
  Loader2
} from 'lucide-react';
import { useAppContext } from '@/contexts/app-context';
import { useEffect, useState } from 'react';
import { Logo } from '../logo';

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
    { href: '/documents', icon: FileSignature, label: 'Documents' },
    { href: '/reports', icon: BarChart3, label: 'Reports' },
    { href: '/settings', icon: Settings, label: 'Settings' },
  ],
  Secretary: [
    { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/residents', icon: Users, label: 'Residents' },
    { href: '/documents', icon: FileSignature, label: 'Documents' },
    { href: '/settings', icon: Settings, label: 'Settings' },
  ],
  Treasurer: [
    { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/payments', icon: CircleDollarSign, label: 'Payments' },
    { href: '/reports', icon: BarChart3, label: 'Reports' },
    { href: '/settings', icon: Settings, label: 'Settings' },
  ],
  Resident: [
    { href: '/dashboard', icon: LayoutDashboard, label: 'My Dashboard' },
    { href: '/settings', icon: Settings, label: 'Settings' },
  ],
};

export function SidebarNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, logout } = useAppContext();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);
  
  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const userNavItems = currentUser ? navItems[currentUser.role] : [];

  return (
    <>
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-3 p-1">
          <Logo className="size-12" />
          <div className="flex flex-col">
            <h2 className="font-headline text-lg font-semibold text-sidebar-foreground">iBarangay</h2>
            <p className="text-xs text-sidebar-foreground/80">Barangay Mina de Oro</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarMenu>
          {!isClient || !currentUser ? (
             <div className="flex justify-center p-4">
               <Loader2 className="animate-spin text-sidebar-foreground" />
             </div>
          ) : (
            userNavItems.map((item) => (
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
            ))
          )}
        </SidebarMenu>
      </SidebarContent>

      <SidebarSeparator />

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton 
              onClick={handleLogout}
              disabled={!isClient || !currentUser}
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
