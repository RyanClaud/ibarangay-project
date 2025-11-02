'use client';

import { residents, documentRequests } from "@/lib/data";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { RequestHistory } from "@/components/requests/request-history";
import { notFound, useParams } from "next/navigation";
import { Cake, Home, User as UserIcon, Loader2 } from "lucide-react";
import { useAppContext } from "@/contexts/app-context";
import { useMemo } from "react";

export default function ResidentProfilePage() {
  const { id } = useParams();
  const { residents, documentRequests, isDataLoading } = useAppContext();

  const resident = useMemo(() => (residents || []).find(r => r.id === id), [residents, id]);
  const requests = useMemo(() => (documentRequests || []).filter(req => req.residentId === id), [documentRequests, id]);

  if (isDataLoading) {
    return (
        <div className="flex h-full w-full items-center justify-center p-8">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
    );
  }

  if (!resident) {
    return notFound();
  }

  const getAge = (birthdate: string) => {
    const today = new Date();
    const birthDate = new Date(birthdate);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
  }

  return (
    <div className="space-y-6">
       <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
        <Avatar className="h-24 w-24 border-4 border-background shadow-md">
            <AvatarImage src={resident.avatarUrl} alt={`${resident.firstName} ${resident.lastName}`} />
            <AvatarFallback className="text-3xl">
                {resident.firstName?.[0]}
                {resident.lastName?.[0]}
            </AvatarFallback>
        </Avatar>
        <div>
            <h1 className="text-4xl font-bold font-headline tracking-tight">{resident.firstName} {resident.lastName}</h1>
            <p className="text-muted-foreground text-lg">Resident Profile</p>
        </div>
      </div>
      
      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-1 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Personal Information</CardTitle>
                    <CardDescription>Details about the resident.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                     <div className="flex items-start gap-3">
                        <UserIcon className="size-5 text-muted-foreground mt-1"/>
                        <div>
                            <p className="font-semibold">{resident.userId}</p>
                            <p className="text-muted-foreground">User ID</p>
                        </div>
                    </div>
                    <Separator/>
                     <div className="flex items-start gap-3">
                        <Home className="size-5 text-muted-foreground mt-1"/>
                        <div>
                            <p className="font-semibold">{resident.address}</p>
                            <p className="text-muted-foreground">Address</p>
                        </div>
                    </div>
                    <Separator/>
                    <div className="flex items-start gap-3">
                        <Cake className="size-5 text-muted-foreground mt-1"/>
                         <div>
                            <p className="font-semibold">{new Date(resident.birthdate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} ({getAge(resident.birthdate)} years old)</p>
                            <p className="text-muted-foreground">Birthdate</p>
                        </div>
                    </div>
                     <Separator/>
                     <div className="flex items-start gap-3">
                        <UserIcon className="size-5 text-muted-foreground mt-1"/>
                         <div>
                            <p className="font-semibold">{resident.householdNumber}</p>
                            <p className="text-muted-foreground">Household No.</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
        <div className="md:col-span-2">
            <Card>
                <CardHeader>
                    <CardTitle>Document Request History</CardTitle>
                     <CardDescription>All document requests made by this resident.</CardDescription>
                </CardHeader>
                <CardContent>
                    <RequestHistory data={requests} />
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
