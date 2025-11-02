'use client';

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { DocumentRequestStatus } from "@/lib/types";
import { useAppContext } from "@/contexts/app-context";
import { useMemo } from "react";

const statusColors: Record<DocumentRequestStatus, string> = {
  Pending: "bg-amber-500",
  Approved: "bg-sky-500",
  Paid: "bg-blue-500",
  Released: "bg-green-500",
  Rejected: "bg-red-500",
};

export function RecentActivity() {
  const { documentRequests } = useAppContext();

  const recentRequests = useMemo(() => {
    return (documentRequests || [])
      .sort((a,b) => new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime())
      .slice(0, 5);
  }, [documentRequests]);

  return (
    <Card className="fade-in transition-all hover:shadow-lg h-full">
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>An overview of the latest document requests.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recentRequests.map((request, index) => (
            <div key={request.id} className="flex items-center gap-4">
              <Avatar className="h-9 w-9">
                <AvatarImage src={`https://picsum.photos/seed/${index + 5}/100/100`} alt="Avatar" />
                <AvatarFallback>{request.residentName.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium leading-none">{request.residentName}</p>
                <p className="text-sm text-muted-foreground">{request.documentType}</p>
              </div>
              <div className="flex flex-col items-end">
                <p className="text-sm font-medium">₱{request.amount.toFixed(2)}</p>
                <Badge
                  variant="secondary"
                  className={cn("text-xs text-white", statusColors[request.status])}
                >
                  {request.status}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
