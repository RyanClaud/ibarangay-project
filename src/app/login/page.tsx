'use client';

import React, { useState, useEffect } from 'react';
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

  useEffect(() => {
    // This effect now ONLY handles redirecting an already-logged-in user away from the login page.
    if (authenticatedUser && !isAuthLoading) {
      router.push('/dashboard');
    }
  }, [authenticatedUser, isAuthLoading, router]);

  const handleLogin = (event: React.FormEvent) => {
    event.preventDefault();
    setIsProcessingLogin(true);

    try {
      // The login function initiates the Firebase sign-in process.
      // The redirect on success is handled by the useEffect above.
      login(credential, password);
    } catch (error) {
      // This will likely not catch async auth errors, but is good practice.
      console.error(error);
      toast({
        title: 'Login Failed',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      });
      setIsProcessingLogin(false);
    }
    
    // Set a timeout to reset the button if auth state change is slow or fails.
    // This prevents the button from getting stuck in a loading state.
    setTimeout(() => {
      setIsProcessingLogin(false);
      // We can also add a toast here for a failed login after a timeout
      // This is a simple way to give feedback without complex state management
      if (!authenticatedUser) {
        toast({
            title: 'Login Failed',
            description: 'Please check your credentials and try again.',
            variant: 'destructive',
        });
      }
    }, 5000);
  };
  
  const isLoading = isAuthLoading || isProcessingLogin;
  
  // Don't render the form if we know the user is authenticated and we're just waiting for the redirect.
  if (authenticatedUser && !isAuthLoading) {
    return (
        <div className="flex h-screen w-screen items-center justify-center bg-background">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
    );
  }

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
