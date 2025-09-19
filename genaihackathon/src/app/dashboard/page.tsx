
'use client';

import { useEffect, useState } from 'react';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { app } from '@/lib/firebase';
import { onUserProfileChange, UserProfile } from '@/services/user-service';
import { OnboardingStepper } from '@/components/feature/OnboardingStepper';

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [recentActivities, setRecentActivities] = useState<string[]>([]);

  const auth = getAuth(app);
  const router = useRouter();

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        // User is logged in, now listen for their profile
        const unsubscribeProfile = onUserProfileChange(currentUser.uid, (userProfile) => {
          setProfile(userProfile);
          if (userProfile) {
              const activities: string[] = [];
              if (userProfile.resumeUrl) activities.push('Resume uploaded');
              if (userProfile.psychometricTestAnswer) activities.push('Psychometric Test completed');
              if (userProfile.oralFluencyAnswer) activities.push('Oral Fluency Test completed');
              setRecentActivities(activities);
          }
          setIsLoading(false); // Profile loaded (or confirmed not to exist)
        });
        return () => {
          unsubscribeProfile();
        };
      } else {
        // No user is logged in
        setUser(null);
        setProfile(null);
        setIsLoading(false);
        router.push('/');
      }
    });

    return () => unsubscribeAuth();
  }, [auth, router]);
  

  const handleOnboardingComplete = () => {
    // The onUserProfileChange listener will handle the UI update automatically
    // We can set loading to true to show a spinner while the profile updates
    setIsLoading(true);
  };

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile || !profile.digitalTwin) {
    return (
      <div className="container mx-auto py-8">
        <OnboardingStepper onOnboardingComplete={handleOnboardingComplete} />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Welcome Card */}
      <Card>
        <CardHeader>
          <CardTitle>Welcome back, {profile.name || user?.displayName || 'User'}!</CardTitle>
          <CardDescription>Here's a summary of your professional landscape.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <h3 className="font-semibold text-lg">Digital Twin Synopsis</h3>
            <p
              className="text-muted-foreground prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{
                __html: profile.digitalTwin?.description?.replace(/\n/g, '<br />') || '',
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Cards Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Profile Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p><strong>Education:</strong> {profile.education || 'N/A'}</p>
            <p><strong>Preferences:</strong> {profile.jobPreferences || 'N/A'}</p>
            <p><strong>Skills:</strong> {profile.skills?.join(', ') || 'N/A'}</p>
            {profile.resumeUrl && (
              <p>
                <strong>Resume:</strong>{' '}
                <a href={profile.resumeUrl} target="_blank" rel="noopener noreferrer" className="text-primary underline">
                  View
                </a>
              </p>
            )}
          </CardContent>
        </Card>

        {/* Recent Activities */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activities</CardTitle>
          </CardHeader>
          <CardContent>
            {recentActivities.length === 0 ? (
              <p className="text-muted-foreground">No recent activities</p>
            ) : (
              <ul className="list-disc pl-5 space-y-1">
                {recentActivities.map((activity, idx) => (
                  <li key={idx}>{activity}</li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Trending Skills */}
        <Card>
          <CardHeader>
            <CardTitle>Trending Skills</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-5 space-y-1">
              {[
                'AI & ML Engineering',
                'Advanced Data Analytics',
                'Cybersecurity Strategy',
                'Cloud-Native Development',
              ].map((skill, idx) => (
                <li
                  key={idx}
                  className={profile.skills?.includes(skill) ? 'text-green-500' : ''}
                >
                  {skill} {profile.skills?.includes(skill) && '(Mastered)'}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex space-x-4">
        <Button onClick={() => router.push('/dashboard/profile')}>Update Profile</Button>
        <Button variant="secondary" onClick={() => router.push('/dashboard/career-path')}>Launch Simulator</Button>
      </div>
    </div>
  );
}

    