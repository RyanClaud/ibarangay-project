"use client";

import * as React from "react";
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
import { CheckCircle, MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { DocumentRequest } from "@/lib/types";
import { toast } from "@/hooks/use-toast";

interface PaymentsClientPageProps {
  data: DocumentRequest[];
}

export function PaymentsClientPage({ data: initialData }: PaymentsClientPageProps) {
  const [data, setData] = React.useState(initialData);
  const [filter, setFilter] = React.useState("");

  const filteredData = data.filter(
    (request) =>
      request.residentName.toLowerCase().includes(filter.toLowerCase()) ||
      request.trackingNumber.toLowerCase().includes(filter.toLowerCase())
  );

  const handleConfirmPayment = (requestId: string) => {
    setData(prevData => prevData.filter(req => req.id !== requestId));
    toast({
      title: "Payment Confirmed",
      description: `Request ${requestId} has been marked as paid.`,
    });
  };

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
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tracking No.</TableHead>
              <TableHead>Resident Name</TableHead>
              <TableHead>Document</TableHead>
              <TableHead>Amount</TableHead>
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
                  <TableCell>₱{request.amount.toFixed(2)}</TableCell>
                  <TableCell className="text-right">
                     <Button size="sm" onClick={() => handleConfirmPayment(request.id)}>
                        <CheckCircle className="mr-2 h-4 w-4" /> Confirm Payment
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  No pending payments.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
