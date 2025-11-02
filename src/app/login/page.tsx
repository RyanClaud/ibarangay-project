'use client';

import { FcGoogle } from 'react-icons/fc';
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { useAuth as useAppAuth } from '@/hooks/use-auth';
import { useAppContext } from '@/contexts/app-context';
import Image from 'next/image';

export default function LoginPage() {
  const router = useRouter();
  const { login, signInWithGoogle } = useAppContext();
  const { user: authenticatedUser, isLoading: isAuthLoading } = useAppAuth();
  const [credential, setCredential] = useState('');
  const [password, setPassword] = useState('');
  const [isProcessingLogin, setIsProcessingLogin] = useState(false);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsProcessingLogin(true);

    try {
      await login(credential, password);
    } catch (error: any) {
      let description = 'An unknown error occurred.';
      switch (error.code) {
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
          description = 'Invalid credentials. Please try again.';
          break;
        case 'auth/invalid-email':
          description = 'The email address is not valid.';
          break;
        default:
          description = error.message || 'Please check your credentials and try again.';
          break;
      }
      toast({
          title: 'Login Failed',
          description: description,
          variant: 'destructive',
      });
    } finally {
      setIsProcessingLogin(false);
    }
  };
  
  const handleGoogleSignIn = async () => {
    setIsProcessingLogin(true);
    try {
      await signInWithGoogle();
      // The context's useEffect will handle the redirect
    } catch (error) {
      setIsProcessingLogin(false);
    }
  };

  const isLoading = isAuthLoading || isProcessingLogin;
  
  if (isAuthLoading && !isProcessingLogin) {
    return (
        <div className="flex h-screen w-screen items-center justify-center bg-background">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
    );
  }

  if (authenticatedUser) {
     return (
        <div className="flex h-screen w-screen items-center justify-center bg-background">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
    );
  }

  return (
    <div className="relative w-full min-h-screen">
      <Image
          src="https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?q=80&w=2940&auto=format&fit=crop"
          alt="Community"
          fill
          className="opacity-90 object-cover"
        />
      <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--gradient-start))]/70 to-[hsl(var(--gradient-end))]/70"></div>

      <div className="absolute inset-0 flex items-center justify-center p-4 animate-fade-in">
        <div className="mx-auto w-full max-w-md space-y-6">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="bg-white/30 backdrop-blur-lg p-4 rounded-2xl border border-white/40 shadow-lg">
              <Image src="/icon.png" alt="iBarangay Logo" width={80} height={80} className="object-contain" />
            </div>
            <div className="space-y-2 text-center text-white drop-shadow-xl">
            <h1 className="text-3xl font-bold font-headline tracking-tight">iBarangay Login</h1>
            <p className="text-primary-foreground/80">Enter your credentials to access your dashboard</p>
          </div>
          </div>
          <Card className="bg-white/20 backdrop-blur-2xl border border-white/30 shadow-2xl">
            <form onSubmit={handleLogin}>
              <CardContent className="space-y-4 pt-6">
                <div className="space-y-2">
                  <Label htmlFor="credential">Email</Label>
                  <Input 
                    id="credential" 
                    placeholder="e.g., admin@ibarangay.com" 
                    required 
                    value={credential}
                    onChange={(e) => setCredential(e.target.value)}
                    disabled={isLoading}
                    className="bg-white/20 border-white/30 placeholder:text-foreground/70"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input 
                    id="password" 
                    type="password" 
                    placeholder="Enter your password" 
                    required 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    className="bg-white/20 border-white/30 placeholder:text-foreground/70"
                  />
                  <div className="text-right">
                    <Link href="/forgot-password" className="text-sm text-primary/90 hover:text-primary hover:underline">
                      Forgot password?
                    </Link>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-4">
                <Button type="submit" className="w-full bg-blue-600 text-white hover:bg-red-600 transition-colors" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isLoading ? 'Logging in...' : 'Login'}
                </Button>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-white/30" /></div>
                  <div className="relative flex justify-center text-xs uppercase"><span className="bg-card/80 px-2 text-muted-foreground">Or continue with</span></div>
                </div>
                <Button variant="outline" className="w-full bg-white/90 text-black hover:bg-white" onClick={handleGoogleSignIn} disabled={isLoading}>
                  <FcGoogle className="mr-2 h-5 w-5" /> Google
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
      </div>
    </div>
  );
}
