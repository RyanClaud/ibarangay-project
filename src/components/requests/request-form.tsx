"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { DocumentType, Resident } from "@/lib/types";
import { toast } from "@/hooks/use-toast";
import { useAppContext } from "@/contexts/app-context";
import { useEffect } from "react";

const formSchema = z.object({
  userId: z.string().min(1, "User ID is required."),
  documentType: z.enum(["Barangay Clearance", "Certificate of Residency", "Certificate of Indigency", "Business Permit", "Good Moral Character Certificate", "Solo Parent Certificate"]),
});

interface RequestFormProps {
  resident?: Resident;
}

export function RequestForm({ resident }: RequestFormProps) {
  const { addDocumentRequest } = useAppContext();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      userId: resident?.userId || "",
      documentType: "Barangay Clearance",
    },
  });

  useEffect(() => {
    if (resident) {
      form.setValue('userId', resident.userId);
    }
  }, [resident, form]);


  function onSubmit(values: z.infer<typeof formSchema>) {
    if (!resident) {
        toast({
            title: "Error",
            description: "Resident information not found.",
            variant: "destructive",
        });
        return;
    }

    let amount = 50.00;
    switch (values.documentType) {
        case 'Barangay Clearance':
            amount = 50.00;
            break;
        case 'Certificate of Residency':
            amount = 75.00;
            break;
        case 'Certificate of Indigency':
            amount = 0.00;
            break;
        case 'Business Permit':
            amount = 250.00;
            break;
        case 'Good Moral Character Certificate':
            amount = 100.00;
            break;
        case 'Solo Parent Certificate':
            amount = 0.00;
            break;
    }

    addDocumentRequest({
        residentId: resident.id,
        residentName: `${resident.firstName} ${resident.lastName}`,
        documentType: values.documentType,
        amount: amount,
    });
    
    toast({
      title: "Request Submitted!",
      description: `Your request for a ${values.documentType} has been received.`,
    });
    form.reset({ userId: resident.userId, documentType: "Barangay Clearance" });
  }

  return (
    <Card className="fade-in transition-all hover:shadow-lg">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardHeader>
            <CardTitle>New Document Request</CardTitle>
            <CardDescription>Select a document to request.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-2">
            <FormField
              control={form.control}
              name="userId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your User ID</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., R-1001" {...field} disabled />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="documentType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Document Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a document to request" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Barangay Clearance">Barangay Clearance</SelectItem>
                      <SelectItem value="Certificate of Residency">Certificate of Residency</SelectItem>
                      <SelectItem value="Certificate of Indigency">Certificate of Indigency</SelectItem>
                      <SelectItem value="Business Permit">Business Permit</SelectItem>
                      <SelectItem value="Good Moral Character Certificate">Good Moral Character Certificate</SelectItem>
                      <SelectItem value="Solo Parent Certificate">Solo Parent Certificate</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            {resident && (
              <div className="md:col-span-2 bg-muted p-4 rounded-lg space-y-2 border">
                <h4 className="font-semibold">Resident Information (Auto-filled)</h4>
                <p className="text-sm"><span className="font-medium">Name:</span> {resident.firstName} {resident.lastName}</p>
                <p className="text-sm"><span className="font-medium">Address:</span> {resident.address}</p>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button type="submit">Submit Request</Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
