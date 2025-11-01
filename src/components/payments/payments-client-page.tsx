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

const searchSchema = z.object({
  referenceNumber: z.string().min(1, "Reference number is required."),
});

type SearchFormData = z.infer<typeof searchSchema>;

export function PaymentsClientPage() {
  const { documentRequests, updateDocumentRequestStatus } = useAppContext();
  const [isLoading, setIsLoading] = React.useState(false);
  const [foundRequest, setFoundRequest] = React.useState<DocumentRequest | null>(null);
  const [transactionId, setTransactionId] = React.useState('');

  const searchForm = useForm<SearchFormData>({
    resolver: zodResolver(searchSchema),
    defaultValues: { referenceNumber: "" },
  });

  const onSearchSubmit = (data: SearchFormData) => {
    setIsLoading(true);
    setFoundRequest(null);
    const request = (documentRequests || []).find(
      (req) =>
        req.referenceNumber === data.referenceNumber && req.status === "Approved"
    );

    if (request) {
      setFoundRequest(request);
    } else {
      toast({
        title: "Request Not Found",
        description:
          "No approved, unpaid request found with that reference number.",
        variant: "destructive",
      });
    }
    setIsLoading(false);
  };

  const handleConfirmPayment = () => {
    if (!foundRequest || !transactionId) {
        toast({
            title: "Missing Information",
            description: "Please enter a transaction ID.",
            variant: "destructive"
        });
        return;
    }
    
    updateDocumentRequestStatus(foundRequest.id, 'Paid', {
        method: "GCash", // Assuming GCash for now
        transactionId: transactionId,
        paymentDate: new Date().toISOString(),
    });

    toast({
      title: "Payment Confirmed",
      description: `Request for ${foundRequest.residentName} has been marked as paid.`,
    });

    // Reset the state
    setFoundRequest(null);
    setTransactionId('');
    searchForm.reset();
  };
  
  const recentPayments = (documentRequests || [])
    .filter(req => req.status === 'Paid' || req.status === 'Released')
    .sort((a,b) => new Date(b.paymentDetails?.paymentDate || 0).getTime() - new Date(a.paymentDetails?.paymentDate || 0).getTime())
    .slice(0, 5);

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Confirm Online Payment</CardTitle>
          <CardDescription>
            Enter the resident's reference number to find their request and confirm payment.
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
                    <FormLabel>Reference Number</FormLabel>
                    <div className="flex gap-2">
                      <FormControl>
                        <Input
                          placeholder="IBGY-XXXX-XXXX"
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
                    <CardTitle>Request Found</CardTitle>
                    <CardDescription>Verify the details and enter the transaction ID from the payment provider (e.g., GCash).</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                     <div className="space-y-2 rounded-md border bg-muted p-4">
                        <p><span className="font-semibold">Resident:</span> {foundRequest.residentName}</p>
                        <p><span className="font-semibold">Document:</span> {foundRequest.documentType}</p>
                        <p className="text-lg font-bold"><span className="font-semibold">Amount:</span> ₱{foundRequest.amount.toFixed(2)}</p>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="transactionId">Payment Transaction ID</Label>
                        <Input 
                            id="transactionId"
                            placeholder="Enter transaction ID from GCash"
                            value={transactionId}
                            onChange={(e) => setTransactionId(e.target.value)}
                        />
                    </div>
                </CardContent>
                <CardFooter>
                    <Button onClick={handleConfirmPayment} disabled={!transactionId}>
                        <CheckCircle className="mr-2"/> Confirm Payment
                    </Button>
                </CardFooter>
            </div>
        )}
      </Card>
      
       <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>
            A log of the most recently confirmed payments.
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
                    <TableCell><Badge variant="secondary" className="bg-green-100 text-green-800">Paid</Badge></TableCell>
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
