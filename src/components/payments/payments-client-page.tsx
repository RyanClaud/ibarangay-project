"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { CheckCircle, Loader2, Search } from "lucide-react";
import type { DocumentRequest } from "@/lib/types";
import { toast } from "@/hooks/use-toast";
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
import { format } from "date-fns";

const searchSchema = z.object({
  referenceNumber: z.string().min(1, "Reference number is required."),
});

type SearchFormData = z.infer<typeof searchSchema>;

export function PaymentsClientPage() {
  const { documentRequests, updateDocumentRequestStatus } = useAppContext();
  const [isLoading, setIsLoading] = React.useState(false);
  const [foundRequest, setFoundRequest] = React.useState<DocumentRequest | null>(null);

  const searchForm = useForm<SearchFormData>({
    resolver: zodResolver(searchSchema),
    defaultValues: { referenceNumber: "" },
  });

  const onSearchSubmit = (data: SearchFormData) => {
    setIsLoading(true);
    setFoundRequest(null);
    const request = (documentRequests || []).find(
      (req) =>
        req.referenceNumber === data.referenceNumber && req.status === "Paid"
    );

    if (request) {
      setFoundRequest(request);
    } else {
      toast({
        title: "Request Not Found",
        description:
          "No paid, unreleased request found with that reference number.",
        variant: "destructive",
      });
    }
    setIsLoading(false);
  };

  const handleReleaseDocument = () => {
    if (!foundRequest) return;
    
    updateDocumentRequestStatus(foundRequest.id, 'Released');

    toast({
      title: "Document Released",
      description: `Request for ${foundRequest.residentName} has been marked as released.`,
    });

    // Reset the state
    setFoundRequest(null);
    searchForm.reset();
  };
  
  const recentPayments = (documentRequests || [])
    .filter(req => req.status === 'Paid' || req.status === 'Released')
    .sort((a,b) => new Date(b.paymentDetails?.paymentDate || 0).getTime() - new Date(a.paymentDetails?.paymentDate || 0).getTime())
    .slice(0, 10);

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Verify Submitted Payments</CardTitle>
          <CardDescription>
            Use the resident's reference number to find their request and verify the submitted payment details.
          </CardDescription>
        </CardHeader>
        <Form {...searchForm}>
          <form onSubmit={searchForm.handleSubmit(onSearchSubmit)}>
            <CardContent>
              <FormField
                control={searchForm.control}
                name="referenceNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Search Reference Number</FormLabel>
                    <div className="flex gap-2">
                      <FormControl>
                        <Input
                          placeholder="e.g., IBGY-240723001"
                          {...field}
                          disabled={isLoading}
                        />
                      </FormControl>
                      <Button type="submit" disabled={isLoading}>
                        {isLoading ? <Loader2 className="animate-spin" /> : <Search />}
                        Search
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </form>
        </Form>
        {foundRequest && (
            <div className="fade-in">
                <CardHeader>
                    <CardTitle>Payment Verification</CardTitle>
                    <CardDescription>A resident has submitted the following payment details. Please verify them with your records.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                     <div className="space-y-3 rounded-md border bg-muted p-4 text-sm">
                        <p><span className="font-semibold text-muted-foreground">Resident:</span> {foundRequest.residentName}</p>
                        <p><span className="font-semibold text-muted-foreground">Document:</span> {foundRequest.documentType}</p>
                        <p><span className="font-semibold text-muted-foreground">Amount:</span> <span className="font-bold text-base text-foreground">₱{foundRequest.amount.toFixed(2)}</span></p>
                        <p className="border-t pt-3"><span className="font-semibold text-muted-foreground">Payment Method:</span> {foundRequest.paymentDetails?.method}</p>
                        <p><span className="font-semibold text-muted-foreground">Transaction ID:</span> {foundRequest.paymentDetails?.transactionId}</p>
                         <p><span className="font-semibold text-muted-foreground">Payment Date:</span> {foundRequest.paymentDetails ? format(new Date(foundRequest.paymentDetails.paymentDate), 'PPP p') : 'N/A'}</p>
                    </div>
                </CardContent>
                <CardFooter>
                    <Button onClick={handleReleaseDocument}>
                        <CheckCircle className="mr-2"/> Verify & Release Document
                    </Button>
                </CardFooter>
            </div>
        )}
      </Card>
      
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
