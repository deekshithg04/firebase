
'use client';
import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import { app } from '@/lib/firebase';
import { onUserProfileChange, UserProfile } from '@/services/user-service';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';


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


export default function DigitalTwinPage() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const auth = getAuth(app);
  const router = useRouter();

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        setIsLoading(false);
        router.push('/');
      }
    });
    return () => unsubscribeAuth();
  }, [auth, router]);

  useEffect(() => {
    if (user) {
      const unsubscribeProfile = onUserProfileChange(user.uid, (profile) => {
        setUserProfile(profile);
        setIsLoading(false);
      });
      return () => unsubscribeProfile();
    }
  }, [user]);

  if (isLoading) {
    return (
        <div className="flex h-[calc(100vh-10rem)] items-center justify-center">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
    );
  }
  
  if (!userProfile?.digitalTwin?.description) {
    return (
      <div className="flex h-[calc(100vh-10rem)] flex-col items-center justify-center space-y-4">
        <CardTitle>No Digital Twin Found</CardTitle>
        <CardDescription>
          You need to create your Digital Twin first.
        </CardDescription>
        <Button onClick={() => router.push('/dashboard')}>
          Go to Dashboard to get started
        </Button>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Logo className="h-6 w-6 text-primary" />
          <CardTitle>Your Digital Twin</CardTitle>
        </div>
        <CardDescription>
          An AI-generated analysis of your professional profile.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground" dangerouslySetInnerHTML={{ __html: userProfile.digitalTwin.description.replace(/\n/g, '<br />') }} />
      </CardContent>
    </Card>
  );
}
