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
import { DocumentRequest } from '@/lib/types';
import { Copy } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface PaymentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  request: DocumentRequest;
}

export function PaymentDialog({ isOpen, onClose, request }: PaymentDialogProps) {

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied!", description: "Reference number copied to clipboard." });
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Complete Your Payment</DialogTitle>
          <DialogDescription>
            Use the following details to pay for your <span className="font-semibold">{request.documentType}</span> request via GCash or other online payment platforms.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
            <div className="text-center">
                <p className="text-sm text-muted-foreground">Total Amount Due</p>
                <p className="text-4xl font-bold">₱{request.amount.toFixed(2)}</p>
            </div>
            <div className="rounded-lg border bg-muted p-4 space-y-2">
                <p className="text-sm text-muted-foreground">Pay to this GCash Number:</p>
                <p className="font-mono text-lg font-semibold">0912-345-6789</p>
                <p className="text-sm text-muted-foreground">Account Name: Juan Dela Cruz</p>
            </div>
            <div className="rounded-lg border bg-muted p-4 space-y-2">
                <p className="text-sm text-muted-foreground">Your Reference Number:</p>
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
             <p className="text-sm text-muted-foreground text-center pt-2">
                After payment, a barangay official will confirm the transaction and update the status of your request.
            </p>
        </div>

        <DialogFooter>
          <Button onClick={onClose} variant="outline">Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
