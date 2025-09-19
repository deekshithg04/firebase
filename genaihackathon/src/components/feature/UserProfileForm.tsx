
'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2 } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { getAuth, onAuthStateChanged, User, updateProfile } from 'firebase/auth';
import { app } from '@/lib/firebase';
import { getUserProfile, createUserProfile } from '@/services/user-service';

const profileFormSchema = z.object({
  name: z.string().min(2, {
    message: 'Name must be at least 2 characters.',
  }),
  email: z.string().email(),
  learningPreference: z.enum(['visual', 'auditory', 'reading', 'kinesthetic']).optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export function UserProfileForm() {
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const auth = getAuth(app);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: '',
      email: '',
      learningPreference: 'visual',
    },
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        try {
            const profile = await getUserProfile(currentUser.uid);
            form.reset({
                name: currentUser.displayName || profile?.name || '',
                email: currentUser.email || '',
                learningPreference: profile?.learningPreference || 'visual',
            });
        } catch (error) {
            console.error("Failed to fetch user profile:", error);
            form.reset({
                name: currentUser.displayName || '',
                email: currentUser.email || '',
            });
        }
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [auth, form]);


  async function onSubmit(data: ProfileFormValues) {
    if (!user) return;
    setIsSaving(true);
    try {
        if(user.displayName !== data.name) {
            await updateProfile(user, { displayName: data.name });
        }
        
        const profileData = {
          name: data.name,
          learningPreference: data.learningPreference,
        };

        await createUserProfile(user.uid, profileData);

        toast({
            title: 'Profile Updated',
            description: 'Your profile information has been successfully updated.',
        });
    } catch (error) {
        console.error("Error updating profile:", error);
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Failed to update profile. Please try again.',
        });
    } finally {
        setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
        <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>
    )
  }

  if (!user) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Error</CardTitle>
                <CardDescription>You must be logged in to view your profile.</CardDescription>
            </CardHeader>
        </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Profile</CardTitle>
        <CardDescription>
          Manage your account information and preferences.
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-8">
            <div className="flex items-center gap-4">
              <div className="relative h-20 w-20">
                <Image
                  src={user.photoURL || `https://i.pravatar.cc/150?u=${user.uid}`}
                  alt="User Avatar"
                  width={80}
                  height={80}
                  className="rounded-full"
                />
              </div>
              <Button type="button" variant="outline" disabled>Change Photo</Button>
            </div>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Your name" {...field} />
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
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="Your email" {...field} readOnly />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="learningPreference"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Learning Preference</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your preferred learning style" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="visual">Visual (demos, videos)</SelectItem>
                      <SelectItem value="auditory">Auditory (lectures, podcasts)</SelectItem>
                      <SelectItem value="reading">Reading (articles, books)</SelectItem>
                      <SelectItem value="kinesthetic">Kinesthetic (hands-on projects)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    This helps us tailor learning recommendations for you.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
