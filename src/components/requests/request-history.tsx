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
import { Badge } from "@/components/ui/badge";
import type { DocumentRequest, DocumentRequestStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

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

  return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow className="bg-gradient-to-r from-[hsl(var(--gradient-start))] to-[hsl(var(--gradient-end))]">
              <TableHead>Tracking No.</TableHead>
              <TableHead>Document</TableHead>
              <TableHead className="hidden sm:table-cell">Date</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
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
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  You have no document requests.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
  );
}
