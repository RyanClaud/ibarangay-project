'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { toast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft } from 'lucide-react';
import { useAppContext } from '@/contexts/app-context';
import Image from 'next/image';

export default function ForgotPasswordPage() {
  const { sendPasswordReset } = useAppContext();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleResetRequest = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);

    try {
      await sendPasswordReset(email);
      setIsSubmitted(true); // Show success message
    } catch (error: any) {
      let description = 'An unknown error occurred. Please try again.';
      if (error.code === 'auth/invalid-email') {
        description = 'The email address you entered is not valid.';
      }
      toast({
          title: 'Request Failed',
          description: description,
          variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

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
        <div className="mx-auto w-[420px] space-y-6">
          <Card className="bg-white/20 backdrop-blur-2xl border border-white/30 shadow-2xl">
            <CardHeader>
              <CardTitle>Forgot Password</CardTitle>
              <CardDescription>
                {isSubmitted 
                  ? "Check your inbox for the next steps." 
                  : "Enter your email and we'll send you a link to reset your password."
                }
              </CardDescription>
            </CardHeader>
            {isSubmitted ? (
              <CardContent>
                <div className="text-center p-4 bg-green-500/20 rounded-lg">
                  <p className="font-medium text-green-800 dark:text-green-200">If an account with that email exists, a password reset link has been sent.</p>
                </div>
              </CardContent>
            ) : (
              <form onSubmit={handleResetRequest}>
                <CardContent>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input 
                      id="email" 
                      type="email"
                      placeholder="e.g., juan@ibarangay.com" 
                      required 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isLoading}
                      className="bg-white/20 border-white/30 placeholder:text-foreground/70"
                    />
                  </div>
                </CardContent>
                <CardFooter className="flex-col gap-4">
                  <Button type="submit" className="w-full bg-gradient-to-r from-[hsl(var(--gradient-start))] to-[hsl(var(--gradient-end))] text-primary-foreground hover:opacity-90 transition-opacity" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isLoading ? 'Sending...' : 'Send Reset Link'}
                  </Button>
                </CardFooter>
              </form>
            )}
            <CardFooter>
              <Button variant="link" className="text-sm text-muted-foreground" asChild>
                <Link href="/login"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Login</Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}