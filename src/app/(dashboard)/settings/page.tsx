import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-headline tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your barangay&apos;s information and system settings.
        </p>
      </div>
      
      <Tabs defaultValue="barangay" className="w-full">
        <TabsList>
          <TabsTrigger value="barangay">Barangay Details</TabsTrigger>
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
        </TabsList>
        <TabsContent value="barangay">
          <Card>
            <CardHeader>
              <CardTitle>Barangay Information</CardTitle>
              <CardDescription>Update the official details of your barangay.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="barangayName">Barangay Name</Label>
                <Input id="barangayName" defaultValue="Barangay 1, District 1" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input id="address" defaultValue="City of Manila, Philippines" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="logo">Barangay Seal/Logo</Label>
                <Input id="logo" type="file" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="users">
            <Card>
                <CardHeader>
                    <CardTitle>User Management</CardTitle>
                    <CardDescription>Add, edit, or remove staff and officials.</CardDescription>
                </CardHeader>
                <CardContent>
                    {/* User management table would go here */}
                    <p className="text-muted-foreground">User management interface coming soon.</p>
                </CardContent>
            </Card>
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
                        <div className="flex gap-2">
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
    </div>
  );
}
