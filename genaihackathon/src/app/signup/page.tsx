
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getAuth, GoogleAuthProvider, createUserWithEmailAndPassword, updateProfile, signInWithRedirect, onAuthStateChanged } from 'firebase/auth';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useState, useEffect } from 'react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormMessage,
  } from '@/components/ui/form';
import { app } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { createUserProfile } from '@/services/user-service';

const Logo = ({ className }: { className?: string }) => (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
      <path d="M6 12v5c0 1.66 4 3 6 3s6-1.34 6-3v-5"></path>
    </svg>
  );

  const formSchema = z.object({
    name: z.string().min(1, { message: 'Full name is required.' }),
    email: z.string().email({ message: 'Please enter a valid email address.' }),
    password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
  });

  type SignUpFormValues = z.infer<typeof formSchema>;

export default function SignUpPage() {
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();
  const auth = getAuth(app);


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
        if (user) {
            router.push('/dashboard');
        } else {
            setIsLoading(false);
        }
    });

    return () => unsubscribe();
  }, [auth, router]);

  const form = useForm<SignUpFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: '', email: '', password: '' },
  });

  const handleEmailSignUp = async (values: SignUpFormValues) => {
    setIsLoading(true);
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
        await updateProfile(userCredential.user, { displayName: values.name });
        
        await createUserProfile(userCredential.user.uid, {
            id: userCredential.user.uid,
            email: userCredential.user.email,
            name: values.name,
        });

        // onAuthStateChanged will handle the redirect
    } catch (error: any) {
        console.error("Error during email sign-up:", error);
        const description = error.code === 'auth/email-already-in-use' 
            ? "This email is already in use. Please try another or log in."
            : "An unknown error occurred during sign-up.";
        toast({
            variant: "destructive",
            title: "Sign-up Failed",
            description,
        });
        setIsLoading(false);
    }
  }

  const handleGoogleSignUp = async () => {
    const provider = new GoogleAuthProvider();
    setIsLoading(true);
    try {
        await signInWithRedirect(auth, provider);
    } catch (error) {
        console.error("Error during Google sign-up redirect:", error);
        toast({
            variant: "destructive",
            title: "Sign-up Failed",
            description: "Could not sign up with Google. Please try again.",
        });
        setIsLoading(false);
    }
  };
  
  if (isLoading) {
    return (
        <div className="flex h-screen w-full flex-col items-center justify-center space-y-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-lg text-muted-foreground">Loading...</p>
        </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background">
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(120,119,198,0.1),rgba(255,255,255,0)_50%,rgba(255,255,255,0)_100%)] opacity-30" />
        <div className="absolute inset-0 h-full w-full bg-background bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:36px_36px]"></div>
      </div>

      <Card className="z-10 w-full max-w-md border-border/50 bg-card/60 shadow-2xl backdrop-blur-lg">
        <CardHeader className="text-center">
          <div className="mb-4 flex justify-center">
            <div className="rounded-full bg-primary/10 p-3">
              <Logo className="h-10 w-10 text-primary" />
            </div>
          </div>
          <CardTitle className="bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-3xl font-bold tracking-tight text-transparent">
            Create an Account
          </CardTitle>
          <CardDescription>
            Join SkillSculptor and start your journey.
          </CardDescription>
        </CardHeader>
        <CardContent>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleEmailSignUp)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                        <Label>Full Name</Label>
                        <FormControl>
                            <Input placeholder="John Doe" className="bg-background/50" disabled={isLoading} {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                        <FormItem>
                        <Label>Email</Label>
                        <FormControl>
                            <Input
                            type="email"
                            placeholder="m@example.com"
                            className="bg-background/50"
                            disabled={isLoading}
                            {...field}
                            />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                        <FormItem>
                        <Label>Password</Label>
                        <FormControl>
                            <Input type="password" required className="bg-background/50" disabled={isLoading} {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />

                <Button type="submit" className="w-full font-semibold shadow-lg shadow-primary/20" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Sign Up
                </Button>
            </form>
        </Form>
        <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">
                Or continue with
            </span>
            </div>
        </div>
        <Button variant="outline" className="w-full font-semibold" onClick={handleGoogleSignUp} disabled={isLoading}>
             {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
             Sign up with Google
        </Button>
          <div className="mt-4 text-center text-sm">
            Already have an account?{' '}
            <Link href="/" className="font-semibold text-primary hover:underline">
              Login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
