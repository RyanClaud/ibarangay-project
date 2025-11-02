'use client';

<<<<<<< HEAD
import { FcGoogle } from 'react-icons/fc';
=======
>>>>>>> 6c232461fb2b050965cc4b24accfb5c51a747356
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from '@/hooks/use-toast';
<<<<<<< HEAD
=======
import { Logo } from '@/components/logo';
>>>>>>> 6c232461fb2b050965cc4b24accfb5c51a747356
import { Loader2 } from 'lucide-react';
import { useAuth as useAppAuth } from '@/hooks/use-auth';
import { useAppContext } from '@/contexts/app-context';
import Image from 'next/image';

export default function LoginPage() {
  const router = useRouter();
<<<<<<< HEAD
  const { login, signInWithGoogle } = useAppContext();
=======
  const { login } = useAppContext();
>>>>>>> 6c232461fb2b050965cc4b24accfb5c51a747356
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
  
<<<<<<< HEAD
  const handleGoogleSignIn = async () => {
    setIsProcessingLogin(true);
    try {
      await signInWithGoogle();
      // The context's useEffect will handle the redirect
    } catch (error) {
      setIsProcessingLogin(false);
    }
  };

=======
>>>>>>> 6c232461fb2b050965cc4b24accfb5c51a747356
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
<<<<<<< HEAD
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
=======
    <div className="w-full lg:grid lg:min-h-screen lg:grid-cols-2">
      <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto w-[400px] space-y-6">
          <div className="space-y-2 text-center">
            <Logo className="mx-auto size-16" />
            <h1 className="text-3xl font-bold font-headline tracking-tight">iBarangay Login</h1>
            <p className="text-muted-foreground">Enter your credentials to access your dashboard</p>
          </div>
          <Card className="border-none shadow-none">
            <form onSubmit={handleLogin}>
              <CardContent className="space-y-4">
>>>>>>> 6c232461fb2b050965cc4b24accfb5c51a747356
                <div className="space-y-2">
                  <Label htmlFor="credential">Email</Label>
                  <Input 
                    id="credential" 
                    placeholder="e.g., admin@ibarangay.com" 
                    required 
                    value={credential}
                    onChange={(e) => setCredential(e.target.value)}
                    disabled={isLoading}
<<<<<<< HEAD
                    className="bg-white/20 border-white/30 placeholder:text-foreground/70"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
=======
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <Link href="#" className="text-sm text-primary/80 hover:text-primary hover:underline">
                      Forgot password?
                    </Link>
                  </div>
>>>>>>> 6c232461fb2b050965cc4b24accfb5c51a747356
                  <Input 
                    id="password" 
                    type="password" 
                    placeholder="Enter your password" 
                    required 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
<<<<<<< HEAD
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
=======
                  />
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-4">
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isLoading ? 'Logging in...' : 'Login'}
                </Button>
>>>>>>> 6c232461fb2b050965cc4b24accfb5c51a747356
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
<<<<<<< HEAD
=======
      <div className="hidden bg-muted lg:block relative">
        <Image
          src="https://images.unsplash.com/photo-1618005198919-d3d4b5a92ead?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2874&q=80"
          alt="Abstract background"
          layout="fill"
          objectFit="cover"
          className="opacity-50"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent"></div>
         <div className="relative flex h-full flex-col items-center justify-center p-10 text-white">
            <div className="absolute inset-0 bg-primary/40" />
            <div className="relative z-20">
                <div className="mx-auto w-full max-w-md space-y-4 text-center">
                    <h2 className="text-4xl font-bold font-headline text-white">iBarangay</h2>
                    <p className="text-lg text-primary-foreground/80">
                        Modernizing Community Management. Efficiently. Effectively.
                    </p>
                </div>
            </div>
        </div>
      </div>
>>>>>>> 6c232461fb2b050965cc4b24accfb5c51a747356
    </div>
  );
}
