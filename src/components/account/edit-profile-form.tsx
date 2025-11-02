'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { useAppContext } from '@/contexts/app-context';
import { useMemo } from 'react';
import { Loader2 } from 'lucide-react';
import type { Resident } from '@/lib/types';


const profileSchema = z.object({
  purok: z.string().min(1, 'Purok / Sitio is required'),
  householdNumber: z.string().min(1, 'Household number is required'),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export function EditProfileForm() {
  const { currentUser, residents, updateResident } = useAppContext();
  const [isSaving, setIsSaving] = useState(false);

  const resident = useMemo(() => {
    if (currentUser?.residentId && residents) {
      return residents.find(res => res.id === currentUser.residentId);
    }
    return null;
  }, [currentUser, residents]);

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      purok: '',
      householdNumber: '',
    },
  });

  useEffect(() => {
    if (resident) {
      form.reset({
        purok: resident.purok,
        householdNumber: resident.householdNumber,
      });
    }
  }, [resident, form]);

  const onSubmit = async (data: ProfileFormData) => {
    if (!resident) {
        toast({ title: "Error", description: "Resident profile not found.", variant: "destructive" });
        return;
    }
    setIsSaving(true);
    try {
      const dataToUpdate: Partial<Resident> = { 
        ...data,
        address: `${data.purok}, Brgy. Mina De Oro, Bongabong, Oriental Mindoro`,
      };

      await updateResident(resident.id, dataToUpdate);
      toast({
        title: 'Profile Updated',
        description: 'Your personal information has been saved.',
      });
    } catch (error: any) {
      toast({
        title: 'Failed to Update Profile',
        description: error.message || 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } finally {
        setIsSaving(false);
    }
  };
  
  if (!resident) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Edit Profile</CardTitle>
            </CardHeader>
            <CardContent>
                <Loader2 className="animate-spin" />
            </CardContent>
        </Card>
    )
  }

  return (
    <Card>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardHeader>
            <CardTitle>Edit Profile</CardTitle>
            <CardDescription>
              Update your personal information here.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <FormField
                  control={form.control}
                  name="purok"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Purok / Sitio</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Purok 1" {...field} />
                      </FormControl>
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
            <div className="space-y-1 rounded-md bg-muted p-3 text-sm">
                <p><span className="font-semibold">Name:</span> {resident.firstName} {resident.lastName}</p>
                <p><span className="font-semibold">Email:</span> {resident.email}</p>
                <p className="text-xs text-muted-foreground pt-1">Your name and email cannot be changed here. Please contact an administrator for assistance.</p>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
