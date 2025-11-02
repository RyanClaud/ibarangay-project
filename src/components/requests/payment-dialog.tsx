'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { DocumentRequest, DocumentRequestStatus } from '@/lib/types';
import { Copy, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useAppContext } from '@/contexts/app-context';
import { useState } from 'react';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

interface PaymentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  request: DocumentRequest;
}

export function PaymentDialog({ isOpen, onClose, request }: PaymentDialogProps) {
  const { updateDocumentRequestStatus } = useAppContext();
  const [transactionId, setTransactionId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied!", description: "Reference number copied to clipboard." });
  }

  const handleSubmitPayment = async () => {
    if (!transactionId) {
        toast({ title: "Transaction ID required", description: "Please enter the transaction ID from your payment.", variant: "destructive" });
        return;
    }
    setIsSubmitting(true);
    try {
        const paymentDetails = {
            method: "GCash", // Assuming GCash or online payment
            transactionId: transactionId,
            paymentDate: new Date().toISOString(),
        };
        await updateDocumentRequestStatus(request.id, 'Paid', paymentDetails);
        toast({
            title: "Payment Submitted",
            description: "Your payment confirmation has been sent. A staff member will verify it shortly.",
        });
        onClose();
    } catch (error: any) {
        toast({ title: "Submission Failed", description: error.message || "An error occurred.", variant: "destructive" });
    } finally {
        setIsSubmitting(false);
    }
  }


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Complete Your Payment</DialogTitle>
          <DialogDescription>
            Use the details below to pay via GCash, then enter the transaction ID to confirm.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
            <div className="text-center">
                <p className="text-sm text-muted-foreground">Total Amount Due</p>
<<<<<<< HEAD
                <p className="text-4xl font-bold">{request.amount.toLocaleString('en-US', { style: 'currency', currency: 'PHP' })}</p>
=======
                <p className="text-4xl font-bold">₱{request.amount.toFixed(2)}</p>
>>>>>>> 6c232461fb2b050965cc4b24accfb5c51a747356
            </div>
            <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
                <p className="text-sm text-muted-foreground">1. Pay to this GCash Number:</p>
                <p className="font-mono text-lg font-semibold">0912-345-6789</p>
                <p className="text-sm text-muted-foreground">Account Name: Juan Dela Cruz</p>
            </div>
            <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
                <p className="text-sm text-muted-foreground">2. Use this as the Reference Number:</p>
                 <div className="flex items-center justify-between gap-4">
                    <p className="font-mono text-lg font-semibold">{request.referenceNumber}</p>
                    <Button variant="ghost" size="icon" onClick={() => handleCopy(request.referenceNumber)}>
                        <Copy className="size-5" />
                    </Button>
                </div>
                 <p className="text-xs text-primary/80">
                    Important: Make sure to include this reference number in the message/notes section of your transaction.
                </p>
            </div>
             <div className="space-y-2">
                <Label htmlFor="transactionId" className="text-sm text-muted-foreground">3. Enter Payment Transaction ID:</Label>
                <Input 
                    id="transactionId"
                    placeholder="e.g., APF12345XYZ"
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    disabled={isSubmitting}
                />
             </div>
        </div>

        <DialogFooter>
          <Button onClick={onClose} variant="outline" disabled={isSubmitting}>Cancel</Button>
<<<<<<< HEAD
           <Button onClick={handleSubmitPayment} disabled={isSubmitting || !transactionId} className="bg-gradient-to-r from-[hsl(var(--gradient-start))] to-[hsl(var(--gradient-end))] text-primary-foreground hover:opacity-90 transition-opacity">
=======
           <Button onClick={handleSubmitPayment} disabled={isSubmitting || !transactionId}>
>>>>>>> 6c232461fb2b050965cc4b24accfb5c51a747356
                {isSubmitting && <Loader2 className="animate-spin" />}
                {isSubmitting ? 'Submitting...' : 'Submit Payment'}
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
