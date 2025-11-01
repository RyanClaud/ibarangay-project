'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/contexts/app-context';
import { toast } from '@/hooks/use-toast';
import { Logo } from '@/components/logo';
import { Loader2 } from 'lucide-react';
import { useAuth as useAppAuth } from '@/hooks/use-auth';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAppContext();
  const { user: authenticatedUser, isLoading: isAuthLoading } = useAppAuth();
  const [credential, setCredential] = useState('');
  const [password, setPassword] = useState('');
  const [isProcessingLogin, setIsProcessingLogin] = useState(false);

  React.useEffect(() => {
    // If the useAuth hook determines we have a user, redirect to the dashboard.
    if (authenticatedUser && !isAuthLoading) {
      toast({
        title: 'Login Successful',
        description: `Welcome back, ${authenticatedUser.name}!`,
      });
      router.push('/dashboard');
    }
  }, [authenticatedUser, isAuthLoading, router]);


  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsProcessingLogin(true);
    
    try {
      // The login function in the context now handles the sign-in process.
      // We don't need to check for a returned user here anymore.
      await login(credential, password);
      // The useEffect above will handle the redirect on successful auth state change.
    } catch (error: any) {
      console.error(error); // Log the actual error for debugging
      toast({
        title: 'Login Failed',
        description: 'Invalid credentials. Please check your User ID/Email and password.',
        variant: 'destructive',
      });
       setIsProcessingLogin(false);
    }
    // Don't set isProcessingLogin to false here if login is successful,
    // as the page will redirect. Only set it on failure.
  };

  const isLoading = isAuthLoading || isProcessingLogin;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm shadow-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <Logo className='size-24' />
          </div>
          <CardTitle className="text-3xl font-headline">iBarangay</CardTitle>
          <CardDescription>Digital Barangay Management</CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="credential">User ID / Email</Label>
              <Input 
                id="credential" 
                placeholder="e.g., R-1001 or admin@ibarangay.com" 
                required 
                value={credential}
                onChange={(e) => setCredential(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link href="#" className="text-sm text-primary/80 hover:text-primary hover:underline">
                  Forgot password?
                </Link>
              </div>
              <Input 
                id="password" 
                type="password" 
                placeholder="Enter your password" 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? 'Logging in...' : 'Login'}
            </Button>
            <p className="text-sm text-center text-muted-foreground">
              Don't have an account?{' '}
              <Link href="#" className="font-semibold text-primary hover:underline">
                Register
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
