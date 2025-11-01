"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, CheckCircle, XCircle, FileSearch, Check } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import type { DocumentRequest, DocumentRequestStatus } from "@/lib/types";
import { Badge } from "../ui/badge";
import { cn } from "@/lib/utils";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAppContext } from "@/contexts/app-context";
import { toast } from "@/hooks/use-toast";

const statusColors: Record<DocumentRequestStatus, string> = {
  Pending: "bg-amber-100 text-amber-800 border-amber-200",
  Approved: "bg-sky-100 text-sky-800 border-sky-200",
  Paid: "bg-blue-100 text-blue-800 border-blue-200",
  Released: "bg-green-100 text-green-800 border-green-200",
  Rejected: "bg-red-100 text-red-800 border-red-200",
};

const TABS: DocumentRequestStatus[] = ["Pending", "Approved", "Paid", "Released", "Rejected"];

export function DocumentRequestClientPage({ data }: { data: DocumentRequest[] }) {
  const { documentRequests, updateDocumentRequestStatus, currentUser } = useAppContext();
  const [filter, setFilter] = React.useState("");
  const [activeTab, setActiveTab] = React.useState<DocumentRequestStatus | 'All'>('Pending');
  const router = useRouter();

  const handleStatusChange = (id: string, status: DocumentRequestStatus) => {
    updateDocumentRequestStatus(id, status);
    toast({
      title: "Request Updated",
      description: `Request status has been changed to ${status}.`,
    });
  };

  const handleViewCertificate = (requestId: string) => {
    router.push(`/documents/certificate/${requestId}`);
  };

  const filteredData = documentRequests.filter(
    (request) =>
      (request.residentName.toLowerCase().includes(filter.toLowerCase()) ||
      request.trackingNumber.toLowerCase().includes(filter.toLowerCase())) &&
      (activeTab === 'All' || request.status === activeTab)
  ).sort((a,b) => new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime());

  const canApprove = currentUser?.role === 'Admin' || currentUser?.role === 'Barangay Captain' || currentUser?.role === 'Secretary';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <Input
          placeholder="Filter by name or tracking no..."
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
          className="max-w-sm"
        />
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
        <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6">
            <TabsTrigger value="All">All</TabsTrigger>
          {TABS.map(tab => (
            <TabsTrigger key={tab} value={tab}>{tab}</TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tracking No.</TableHead>
              <TableHead>Resident Name</TableHead>
              <TableHead>Document</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length ? (
              filteredData.map((request) => (
                <TableRow key={request.id}>
                  <TableCell className="font-medium">{request.trackingNumber}</TableCell>
                  <TableCell>{request.residentName}</TableCell>
                  <TableCell>{request.documentType}</TableCell>
                  <TableCell>{request.requestDate}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn("font-semibold", statusColors[request.status])}>
                      {request.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button aria-haspopup="true" size="icon" variant="ghost">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Toggle menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => router.push(`/residents/${request.residentId}`)}>
                          <FileSearch /> View Resident
                        </DropdownMenuItem>

                        {(request.status === 'Paid' || request.status === 'Released') && (
                          <DropdownMenuItem onClick={() => handleViewCertificate(request.id)}>
                            <FileSearch /> View Certificate
                          </DropdownMenuItem>
                        )}
                        
                        {canApprove && (
                          <>
                            <DropdownMenuSeparator />
                            {request.status === 'Pending' && (
                              <DropdownMenuItem onClick={() => handleStatusChange(request.id, 'Approved')}>
                                <CheckCircle /> Approve
                              </DropdownMenuItem>
                            )}
                             {request.status === 'Approved' && currentUser?.role === 'Treasurer' && (
                                <DropdownMenuItem onClick={() => handleStatusChange(request.id, 'Paid')}>
                                    <Check /> Mark as Paid
                                </DropdownMenuItem>
                            )}
                            {request.status !== 'Rejected' && request.status !== 'Released' &&(
                              <DropdownMenuItem className="text-destructive" onClick={() => handleStatusChange(request.id, 'Rejected')}>
                                <XCircle /> Reject
                              </DropdownMenuItem>
                            )}
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No requests found for this status.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
