'use client';

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserManagementClientPage } from "@/components/users/user-management-client-page";
import { useFirebase } from "@/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import { ChangePasswordForm } from "@/components/account/change-password-form";
import { useAppContext } from "@/contexts/app-context";
import { ResidentSettings } from "@/components/account/resident-settings";


function AdminSettings() {
  const { firestore, storage, areServicesAvailable } = useFirebase();
  const [barangayName, setBarangayName] = useState("Barangay Mina De Oro");
  const [address, setAddress] = useState("Bongabong, Oriental Mindoro, Philippines");
  const [sealLogoUrl, setSealLogoUrl] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchConfig = async () => {
      if (!firestore) return;
      setIsLoading(true);
      try {
        const configRef = doc(firestore, 'barangayConfig', 'main');
        const configSnap = await getDoc(configRef);
        if (configSnap.exists()) {
          const configData = configSnap.data();
          setBarangayName(configData.name);
          setAddress(configData.address);
          setSealLogoUrl(configData.sealLogoUrl);
        }
      } catch (e) {
        console.error("Failed to fetch barangay config:", e);
        toast({ title: "Error", description: "Could not fetch barangay settings.", variant: "destructive"});
      } finally {
        setIsLoading(false);
      }
    };
    if (areServicesAvailable) {
        fetchConfig();
    } else {
        setIsLoading(false);
    }
  }, [firestore, areServicesAvailable]);

  const handleSaveChanges = async () => {
    if (!firestore || !storage) {
        toast({ title: "Firebase not initialized.", description: "Please try again later.", variant: "destructive"});
        return;
    };
    setIsSaving(true);
    
    try {
      const configRef = doc(firestore, 'barangayConfig', 'main');
      await setDoc(configRef, {
        id: 'main',
        name: barangayName,
        address,
        sealLogoUrl,
      }, { merge: true });

      toast({ title: "Settings Saved", description: "Barangay details have been updated." });
    } catch (error: any) {
      console.error("Error saving settings: ", error);
      toast({ title: "Save Failed", description: error.message || "Could not save settings.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Tabs defaultValue="barangay" className="w-full">
      <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2 md:grid-cols-4">
        <TabsTrigger value="barangay">Barangay Details</TabsTrigger>
        <TabsTrigger value="account">Account</TabsTrigger>
        <TabsTrigger value="users">User Management</TabsTrigger>
        <TabsTrigger value="system">System</TabsTrigger>
      </TabsList>
      <TabsContent value="barangay">
        <Card>
          <CardHeader>
            <CardTitle>Barangay Information</CardTitle>
            <CardDescription>Update the official details of your barangay.</CardDescription>
          </CardHeader>
          {isLoading ? (
            <CardContent>
              <div className="flex justify-center items-center p-8">
                <Loader2 className="animate-spin h-8 w-8 text-primary" />
              </div>
            </CardContent>
          ) : (
            <>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="barangayName">Barangay Name</Label>
                  <Input id="barangayName" value={barangayName} onChange={(e) => setBarangayName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="logo">Barangay Seal/Logo URL</Label>
                  <div className="flex items-center gap-4">
                    {sealLogoUrl && <Image src={sealLogoUrl} alt="Barangay Seal" width={64} height={64} className="rounded-full bg-muted object-cover" unoptimized />}
                    <Input id="logo" type="url" value={sealLogoUrl || ""} onChange={(e) => setSealLogoUrl(e.target.value)} placeholder="https://example.com/logo.png" />
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={handleSaveChanges} disabled={isSaving || !areServicesAvailable}>
                  {isSaving && <Loader2 className="mr-2 animate-spin" />}
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
              </CardFooter>
            </>
          )}
        </Card>
      </TabsContent>
      <TabsContent value="account">
          <div className="grid gap-6">
            <ChangePasswordForm />
          </div>
      </TabsContent>
      <TabsContent value="users">
          <UserManagementClientPage />
      </TabsContent>
      <TabsContent value="system">
          <Card>
              <CardHeader>
                  <CardTitle>System Maintenance</CardTitle>
                  <CardDescription>Manage system logs, backups, and restores.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                  <div className="space-y-2">
                      <h4 className="font-semibold">Database</h4>
                      <div className="flex flex-col sm:flex-row gap-2">
                          <Button variant="outline">Backup Database</Button>
                          <Button variant="destructive">Restore Database</Button>
                      </div>
                  </div>
                   <Separator />
                  <div className="space-y-2">
                      <h4 className="font-semibold">System Logs</h4>
                      <p className="text-sm text-muted-foreground">View transaction logs, login attempts, and system errors.</p>
                      <Button>View Logs</Button>
                  </div>
              </CardContent>
          </Card>
      </TabsContent>
    </Tabs>
  );
}


export default function SettingsPage() {
    const { currentUser, isDataLoading } = useAppContext();

    if (isDataLoading) {
        return (
            <div className="flex justify-center items-center h-full">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    const isResident = currentUser?.role === 'Resident';

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold font-headline tracking-tight">Settings</h1>
                <p className="text-muted-foreground">
                    {isResident 
                        ? "Manage your personal information and account settings." 
                        : "Manage your barangay's information and system settings."
                    }
                </p>
            </div>
            {isResident ? <ResidentSettings /> : <AdminSettings />}
        </div>
    );
}
