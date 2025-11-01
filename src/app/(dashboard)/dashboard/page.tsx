'use client';

import { RequestForm } from "@/components/requests/request-form";
import { RequestHistory } from "@/components/requests/request-history";
import { StatCard } from "@/components/dashboard/stat-card";
import { RequestsChart } from "@/components/dashboard/requests-chart";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { CircleDollarSign, FileText, Users, CheckCircle, Loader2, Hourglass, Banknote } from "lucide-react";
import { useMemo } from "react";
import { useAppContext } from "@/contexts/app-context";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  const { currentUser, residents, documentRequests, isDataLoading } = useAppContext();
  
  const user = currentUser;

  const residentInfo = useMemo(() => {
    if (user?.role === 'Resident' && user.residentId && residents) {
      return residents.find(res => res.id === user.residentId);
    }
    return undefined;
  }, [user, residents]);
  
  const residentRequests = useMemo(() => {
    if (user?.role === 'Resident' && documentRequests) {
      // The query in app-context already filters for the current resident,
      // so we can just use the data as is.
      return documentRequests;
    }
    return [];
  }, [user, documentRequests]);

  // Common stats
  const safeDocumentRequests = documentRequests || [];
  const safeResidents = residents || [];

  const totalRevenue = safeDocumentRequests
    .filter(req => req.status === 'Released' || req.status === 'Paid')
    .reduce((sum, req) => sum + (req.amount || 0), 0);
  const approvedRequests = safeDocumentRequests.filter(req => ['Approved', 'Paid', 'Released'].includes(req.status)).length;
  const pendingRequests = safeDocumentRequests.filter(req => req.status === 'Pending').length;
  const pendingPayments = safeDocumentRequests.filter(req => req.status === 'Approved').length;


  if (!user || isDataLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  // Resident Dashboard
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
        <RequestForm />
  
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

  // Barangay Captain Dashboard
  if (user.role === "Barangay Captain") {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold font-headline tracking-tight">Captain's Dashboard</h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <StatCard
            title="Total Residents"
            value={safeResidents.length.toString()}
            icon={Users}
            description="The total number of registered residents."
          />
          <StatCard
            title="Pending Requests"
            value={pendingRequests.toString()}
            icon={Hourglass}
            description="Documents awaiting approval."
          />
           <StatCard
            title="Approved Requests"
            value={approvedRequests.toString()}
            icon={FileText}
            description="Total documents approved."
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

  // Secretary Dashboard
  if (user.role === "Secretary") {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold font-headline tracking-tight">Secretary's Dashboard</h1>
        <div className="grid gap-4 md:grid-cols-2">
           <StatCard
            title="Total Residents"
            value={safeResidents.length.toString()}
            icon={Users}
            description="The total number of registered residents."
          />
          <StatCard
            title="Pending Requests"
            value={pendingRequests.toString()}
            icon={Hourglass}
            description="New document requests to verify."
          />
        </div>
        <div className="grid gap-4">
            <div className="col-span-full">
                <RecentActivity />
            </div>
        </div>
      </div>
    );
  }

  // Treasurer Dashboard
  if (user.role === "Treasurer") {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold font-headline tracking-tight">Treasurer's Dashboard</h1>
        <div className="grid gap-4 md:grid-cols-2">
          <StatCard
            title="Total Revenue"
            value={`₱${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            icon={CircleDollarSign}
            description="Total revenue collected from documents."
          />
          <StatCard
            title="Pending Payments"
            value={pendingPayments.toString()}
            icon={Banknote}
            description="Approved requests awaiting payment."
          />
        </div>
        <div className="text-center py-4">
            <Link href="/payments">
                <Button>
                    Go to Payments
                </Button>
            </Link>
        </div>
      </div>
    );
  }
  
  // Admin Dashboard (Fallback)
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold font-headline tracking-tight">Admin Dashboard</h1>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Total Residents"
          value={safeResidents.length.toString()}
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
