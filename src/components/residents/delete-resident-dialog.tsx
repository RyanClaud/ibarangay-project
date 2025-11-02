'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";

interface DeleteResidentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  residentName: string;
}

export function DeleteResidentDialog({ isOpen, onClose, onConfirm, residentName }: DeleteResidentDialogProps) {
  
  const handleConfirm = () => {
    onConfirm();
    toast({
      title: "Resident Deleted",
      description: `${residentName} has been removed from the masterlist.`,
      variant: "destructive",
    });
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the resident profile for{' '}
            <span className="font-semibold text-foreground">{residentName}</span> and remove their data from our servers.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} className="bg-destructive hover:bg-destructive/90">
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
