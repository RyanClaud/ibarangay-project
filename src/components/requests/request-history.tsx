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
import { Badge } from "@/components/ui/badge";
import type { DocumentRequest, DocumentRequestStatus } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import { FileSearch, Banknote } from "lucide-react";
import { useAppContext } from "@/contexts/app-context";
import { PaymentDialog } from "./payment-dialog";

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
  
  const [paymentRequest, setPaymentRequest] = React.useState<DocumentRequest | null>(null);

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
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tracking No.</TableHead>
              <TableHead>Document</TableHead>
              <TableHead className="hidden sm:table-cell">Date</TableHead>
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
                  <TableCell className="hidden sm:table-cell">{request.requestDate}</TableCell>
                  <TableCell>₱{request.amount.toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn("font-semibold", statusColors[request.status])}>
                      {request.status}
                    </Badge>
                  </TableCell>
                  {isResident && (
                    <TableCell className="text-right space-x-2">
                       {request.status === 'Approved' && (
                        <Button variant="solid" size="sm" onClick={() => setPaymentRequest(request)}>
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
    </>
  );
}
