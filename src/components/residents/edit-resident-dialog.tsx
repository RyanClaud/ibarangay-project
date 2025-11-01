'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import type { Resident } from '@/lib/types';
import { toast } from '@/hooks/use-toast';

const residentSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  purok: z.string().min(1, 'Purok / Sitio is required'),
  birthdate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid date format. Please use MM-dd-yyyy.',
  }),
  householdNumber: z.string().min(1, 'Household number is required'),
});

type ResidentFormData = z.infer<typeof residentSchema>;

interface EditResidentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdateResident: (resident: Resident) => void;
  resident: Resident;
}

export function EditResidentDialog({ isOpen, onClose, onUpdateResident, resident }: EditResidentDialogProps) {
  const form = useForm<ResidentFormData>({
    resolver: zodResolver(residentSchema),
  });

  useEffect(() => {
    if (resident) {
      form.reset({
        firstName: resident.firstName,
        lastName: resident.lastName,
        email: resident.email,
        purok: resident.purok,
        birthdate: resident.birthdate,
        householdNumber: resident.householdNumber,
      });
    }
  }, [resident, form]);

  const onSubmit = (data: ResidentFormData) => {
    onUpdateResident({
      ...resident,
      ...data,
      address: `${data.purok}, Brgy. Mina De Oro, Bongabong, Oriental Mindoro`,
    });
    toast({
        title: 'Resident Updated',
        description: `${data.firstName} ${data.lastName}'s information has been updated.`,
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Edit Resident</DialogTitle>
          <DialogDescription>
            Update the details of the resident. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
                <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                        <Input placeholder="Juan" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl>
                        <Input placeholder="Dela Cruz" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>
             <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="juan.cruz@example.com" {...field} disabled />
                  </FormControl>
                   <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="purok"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Purok / Sitio</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Purok 1 or Sitio Centro" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <div className="grid grid-cols-2 gap-4">
                <FormField
                control={form.control}
                name="birthdate"
                render={({ field }) => (
                    <FormItem className="flex flex-col">
                    <FormLabel>Date of Birth</FormLabel>
                     <div className="relative">
                        <FormControl>
                            <Input placeholder="MM-dd-yyyy" {...field} />
                        </FormControl>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="ghost" size="icon" className="absolute right-0 top-0 h-full">
                                    <CalendarIcon className="h-4 w-4 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    mode="single"
                                    captionLayout="dropdown-nav"
                                    fromYear={new Date().getFullYear() - 100}
                                    toYear={new Date().getFullYear()}
                                    selected={field.value ? new Date(field.value) : undefined}
                                    onSelect={(date) => field.onChange(date ? format(date, 'MM-dd-yyyy') : '')}
                                    disabled={(date) => date > new Date() || date < new Date('1900-01-01')}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                    </div>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="householdNumber"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Household No.</FormLabel>
                    <FormControl>
                        <Input placeholder="HH-001" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>
            <DialogFooter>
                <DialogClose asChild>
                    <Button type="button" variant="ghost">Cancel</Button>
                </DialogClose>
                <Button type="submit">Save Changes</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
