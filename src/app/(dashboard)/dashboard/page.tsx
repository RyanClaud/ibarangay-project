'use client';

import { RequestForm } from "@/components/requests/request-form";
import { RequestHistory } from "@/components/requests/request-history";
import { StatCard } from "@/components/dashboard/stat-card";
import { RequestsChart } from "@/components/dashboard/requests-chart";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { CircleDollarSign, FileText, Users, CheckCircle, Loader2, Hourglass, Banknote, FileSearch } from "lucide-react";
import { useMemo, useState } from "react";
import { useAppContext } from "@/contexts/app-context";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { DocumentRequest, DocumentRequestStatus } from "@/lib/types";
import { PaymentDialog } from "@/components/requests/payment-dialog";
import { useRouter } from "next/navigation";

const statusColors: Record<DocumentRequestStatus, string> = {
  Pending: "bg-amber-100 text-amber-800 border-amber-200",
  Approved: "bg-sky-100 text-sky-800 border-sky-200",
  Paid: "bg-blue-100 text-blue-800 border-blue-200",
  Released: "bg-green-100 text-green-800 border-green-200",
  Rejected: "bg-red-100 text-red-800 border-red-200",
};


export default function DashboardPage() {
  const { currentUser, residents, documentRequests, isDataLoading } = useAppContext();
  const [paymentRequest, setPaymentRequest] = useState<DocumentRequest | null>(null);
  const router = useRouter();

  const user = currentUser;

  const residentInfo = useMemo(() => {
    if (user?.role === 'Resident' && user.residentId && residents) {
      return residents.find(res => res.id === user.residentId);
    }
    return undefined;
  }, [user, residents]);
  
  const residentRequests = useMemo(() => {
    if (user?.role === 'Resident' && documentRequests) {
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

    const handleViewCertificate = (requestId: string) => {
        router.push(`/documents/certificate/${requestId}`);
    };

    return (
      <>
        {paymentRequest && (
            <PaymentDialog
            isOpen={!!paymentRequest}
            onClose={() => setPaymentRequest(null)}
            request={paymentRequest}
            />
        )}
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
            
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead>Tracking No.</TableHead>
                        <TableHead>Document</TableHead>
                        <TableHead className="hidden sm:table-cell">Date</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {residentRequests.length ? (
                        residentRequests.map((request) => (
                            <TableRow key={request.id}>
                            <TableCell className="font-medium">{request.trackingNumber}</TableCell>
                            <TableCell>{request.documentType}</TableCell>
                            <TableCell className="hidden sm:table-cell">{request.requestDate}</TableCell>
                            <TableCell>₱{request.amount.toFixed(2)}</TableCell>
                            <TableCell>
                                <Badge variant="outline" className={cn("font-semibold", statusColors[request.status])}>
                                {request.status}
                                </Badge>
                            </TableCell>
                             <TableCell className="text-right space-x-2">
                                {request.status === 'Approved' && (
                                <Button size="sm" onClick={() => setPaymentRequest(request)}>
                                    <Banknote className="mr-2"/>
                                    Pay Now
                                </Button>
                                )}
                                {(request.status === 'Paid' || request.status === 'Released') && (
                                <Button variant="outline" size="sm" onClick={() => handleViewCertificate(request.id)}>
                                    <FileSearch className="mr-2"/>
                                    View Certificate
                                </Button>
                                )}
                            </TableCell>
                            </TableRow>
                        ))
                        ) : (
                        <TableRow>
                            <TableCell colSpan={6} className="h-24 text-center">
                            You have no document requests.
                            </TableCell>
                        </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
      </>
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
