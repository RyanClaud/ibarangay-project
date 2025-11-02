"use client";

import * as React from "react";
import type { DocumentRequest } from "@/lib/types";
import { useAppContext } from "@/contexts/app-context";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "../ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function PaymentsClientPage() {
  const { documentRequests } = useAppContext();
  
  const recentPayments = (documentRequests || [])
    .filter(req => req.status === 'Paid' || req.status === 'Released')
    .sort((a,b) => new Date(b.paymentDetails?.paymentDate || 0).getTime() - new Date(a.paymentDetails?.paymentDate || 0).getTime())
    .slice(0, 10);

  return (
    <div className="grid gap-8">
       <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>
            A log of the most recently paid and released documents.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Resident</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentPayments.length > 0 ? (
                recentPayments.map((req) => (
                  <TableRow key={req.id}>
                    <TableCell>
                      <div className="font-medium">{req.residentName}</div>
                      <div className="text-sm text-muted-foreground">{req.documentType}</div>
                    </TableCell>
                    <TableCell>₱{req.amount.toFixed(2)}</TableCell>
                    <TableCell>
                      {req.status === 'Paid' && <Badge variant="secondary" className="bg-blue-100 text-blue-800">Paid</Badge>}
                      {req.status === 'Released' && <Badge variant="secondary" className="bg-green-100 text-green-800">Released</Badge>}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="text-center h-24">
                    No recent transactions.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
