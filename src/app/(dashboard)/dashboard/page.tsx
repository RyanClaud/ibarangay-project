import { StatCard } from "@/components/dashboard/stat-card";
import { RequestsChart } from "@/components/dashboard/requests-chart";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { documentRequests, residents } from "@/lib/data";
import { CircleDollarSign, FileText, Users } from "lucide-react";

export default function DashboardPage() {
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
