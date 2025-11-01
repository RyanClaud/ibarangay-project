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
import Image from 'next/image';
import { useFirebase } from '@/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';


const profileSchema = z.object({
  purok: z.string().min(1, 'Purok / Sitio is required'),
  householdNumber: z.string().min(1, 'Household number is required'),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export function EditProfileForm() {
  const { currentUser, residents, updateResident } = useAppContext();
  const { storage } = useFirebase();
  const [isSaving, setIsSaving] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

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
      setAvatarPreview(resident.avatarUrl);
    }
  }, [resident, form]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const onSubmit = async (data: ProfileFormData) => {
    if (!resident || !storage) {
        toast({ title: "Error", description: "Resident profile not found or storage not available.", variant: "destructive" });
        return;
    }
    setIsSaving(true);
    try {
      let avatarUrl = resident.avatarUrl;

      if (avatarFile) {
        const storageRef = ref(storage, `profile-pictures/${resident.id}/${avatarFile.name}`);
        const uploadResult = await uploadBytes(storageRef, avatarFile);
        avatarUrl = await getDownloadURL(uploadResult.ref);
      }
      
      const updatedResident: Resident = {
        ...resident,
        ...data,
        avatarUrl,
        address: `${data.purok}, Brgy. Mina De Oro, Bongabong, Oriental Mindoro`,
      };

      await updateResident(updatedResident);
      toast({
        title: 'Profile Updated',
        description: 'Your personal information has been saved.',
      });
      setAvatarFile(null);
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
            <div className="space-y-2">
                <FormLabel>Profile Picture</FormLabel>
                <div className="flex items-center gap-4">
                    {avatarPreview && (
                        <Image src={avatarPreview} alt="Avatar Preview" width={64} height={64} className="rounded-full bg-muted object-cover" unoptimized/>
                    )}
                    <Input type="file" accept="image/*" onChange={handleAvatarChange} />
                </div>
            </div>

             <div className="grid grid-cols-2 gap-4">
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
