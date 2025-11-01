'use client';

import { RequestForm } from "@/components/requests/request-form";
import { RequestHistory } from "@/components/requests/request-history";
import { documentRequests, residents, getLoggedInUser } from "@/lib/data";
import { StatCard } from "@/components/dashboard/stat-card";
import { RequestsChart } from "@/components/dashboard/requests-chart";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { CircleDollarSign, FileText, Users, FileClock, CheckCircle } from "lucide-react";
import type { User, DocumentRequest } from "@/lib/types";
import { useMemo } from "react";

export default function DashboardPage() {
  // In a real app, user would be from an auth context.
  const user: User = getLoggedInUser("Resident"); 
  
  const residentId = 'RES001'; // Simulating a logged-in resident
  const residentInfo = useMemo(() => residents.find(res => res.id === residentId), [residentId]);
  const residentRequests = useMemo(() => documentRequests.filter(req => req.residentId === residentId), [residentId]);

  if (user.role === "Resident") {
    const totalRequests = residentRequests.length;
    const completedRequests = residentRequests.filter(r => r.status === 'Released').length;

    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold font-headline tracking-tight">My Dashboard</h1>
        
        <div className="grid gap-4 md:grid-cols-2">
            <StatCard
                title="Total Requests"
                value={totalRequests.toString()}
                icon={FileText}
                description="All document requests you have made."
            />
            <StatCard
                title="Completed Requests"
                value={completedRequests.toString()}
                icon={CheckCircle}
                description="Documents that have been released to you."
            />
        </div>

        <div>
            <h2 className="text-2xl font-bold font-headline tracking-tight">Request a New Document</h2>
            <p className="text-muted-foreground">
              Fill out the form below. Your information will be auto-filled.
            </p>
        </div>
        <RequestForm resident={residentInfo} />
  
        <div className="pt-4">
          <h2 className="text-2xl font-bold font-headline tracking-tight">My Request History</h2>
          <p className="text-muted-foreground">
            Track the status of your current and past document requests.
          </p>
        </div>
        
        <RequestHistory data={residentRequests} />
      </div>
    );
  }

  // Admin and other roles dashboard
  const totalRevenue = documentRequests
    .filter(req => req.status === 'Released' || req.status === 'Paid')
    .reduce((sum, req) => sum + req.amount, 0);

  const approvedRequests = documentRequests.filter(req => ['Approved', 'Paid', 'Released'].includes(req.status)).length;
  
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold font-headline tracking-tight">Dashboard</h1>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Total Residents"
          value={residents.length.toString()}
          icon={Users}
          description="The total number of registered residents."
        />
        <StatCard
          title="Approved Requests"
          value={approvedRequests.toString()}
          icon={FileText}
          description="Total documents approved this month."
        />
        <StatCard
          title="Total Revenue"
          value={`₱${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon={CircleDollarSign}
          description="Total revenue collected this month."
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="col-span-full lg:col-span-4">
          <RequestsChart />
        </div>
        <div className="col-span-full lg:col-span-3">
          <RecentActivity />
        </div>
      </div>
    </div>
  );
}
