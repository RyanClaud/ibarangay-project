'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from '@/hooks/use-toast';
import { Logo } from '@/components/logo';
import { Loader2 } from 'lucide-react';
import { useAuth as useAppAuth } from '@/hooks/use-auth';
import { initiateEmailSignIn } from '@/firebase';
import { useFirebase } from '@/firebase/provider';

export default function LoginPage() {
  const router = useRouter();
  const { auth } = useFirebase();
  const { user: authenticatedUser, isLoading: isAuthLoading } = useAppAuth();
  const [credential, setCredential] = useState('');
  const [password, setPassword] = useState('');
  const [isProcessingLogin, setIsProcessingLogin] = useState(false);

  useEffect(() => {
    // This effect redirects an already-logged-in user away from the login page.
    if (authenticatedUser && !isAuthLoading) {
      router.push('/dashboard');
    }
  }, [authenticatedUser, isAuthLoading, router]);

  const handleLogin = (event: React.FormEvent) => {
    event.preventDefault();
    if (!auth) {
        toast({
            title: 'Login Service Error',
            description: 'Authentication service is not ready. Please try again in a moment.',
            variant: 'destructive',
        });
        return;
    }
    setIsProcessingLogin(true);

    // We call initiateEmailSignIn directly.
    // The onAuthStateChanged listener in the AppContext will handle success,
    // and the .catch() here will handle failure.
    initiateEmailSignIn(auth, credential, password)
      .catch((error) => {
        // If Firebase returns an error, show it to the user.
        let description = 'An unknown error occurred.';
        switch (error.code) {
          case 'auth/user-not-found':
          case 'auth/wrong-password':
          case 'auth/invalid-credential':
            description = 'Invalid email or password. Please try again.';
            break;
          case 'auth/invalid-email':
            description = 'The email address is not valid.';
            break;
          default:
            description = 'Please check your credentials and try again.';
            break;
        }
        toast({
            title: 'Login Failed',
            description: description,
            variant: 'destructive',
        });
      })
      .finally(() => {
        // Always reset the loading state
        setIsProcessingLogin(false);
      });
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
