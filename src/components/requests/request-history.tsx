"use client";

import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { DocumentRequest, DocumentRequestStatus } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import { FileSearch } from "lucide-react";
import { useAppContext } from "@/contexts/app-context";

interface RequestHistoryProps {
  data: DocumentRequest[];
}

const statusColors: Record<DocumentRequestStatus, string> = {
  Pending: "bg-amber-100 text-amber-800 border-amber-200",
  Approved: "bg-sky-100 text-sky-800 border-sky-200",
  Paid: "bg-blue-100 text-blue-800 border-blue-200",
  Released: "bg-green-100 text-green-800 border-green-200",
  Rejected: "bg-red-100 text-red-800 border-red-200",
};

export function RequestHistory({ data }: RequestHistoryProps) {
  const router = useRouter();
  const { currentUser } = useAppContext();
  const isResident = currentUser?.role === 'Resident';

  const handleViewCertificate = (requestId: string) => {
    router.push(`/documents/certificate/${requestId}`);
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tracking No.</TableHead>
            <TableHead>Document</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Status</TableHead>
            {isResident && <TableHead className="text-right">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length ? (
            data.map((request) => (
              <TableRow key={request.id}>
                <TableCell className="font-medium">{request.trackingNumber}</TableCell>
                <TableCell>{request.documentType}</TableCell>
                <TableCell>{request.requestDate}</TableCell>
                <TableCell>₱{request.amount.toFixed(2)}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={cn("font-semibold", statusColors[request.status])}>
                    {request.status}
                  </Badge>
                </TableCell>
                {isResident && (
                  <TableCell className="text-right">
                    {(request.status === 'Paid' || request.status === 'Released') && (
                      <Button variant="outline" size="sm" onClick={() => handleViewCertificate(request.id)}>
                        <FileSearch className="mr-2"/>
                        View Certificate
                      </Button>
                    )}
                  </TableCell>
                )}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={isResident ? 6 : 5} className="h-24 text-center">
                You have no document requests.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
