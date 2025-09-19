
'use client';
import { useState, useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, Briefcase, Sparkles, Wand } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import { app } from '@/lib/firebase';
import { onUserProfileChange, UserProfile } from '@/services/user-service';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { simulateInterview } from '@/ai/flows/simulate-interview';
import { OralInterview } from '@/components/feature/OralInterview';

const formSchema = z.object({
  targetJob: z.string().min(1, 'Please enter a target job.'),
  skillsToTest: z.string().min(1, 'Please enter skills to test.'),
  simulationType: z.enum(['interview', 'technical', 'aptitude']),
});

type SimulationFormValues = z.infer<typeof formSchema>;


export default function CareerPathPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [simulationResult, setSimulationResult] = useState<string | null>(null);
  const [interviewQuestion, setInterviewQuestion] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isFetchingProfile, setIsFetchingProfile] = useState(true);
  const [user, setUser] = useState<User|null>(null);
  const [transcript, setTranscript] = useState('');
  
  const { toast } = useToast();
  const auth = getAuth(app);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        setUser(null);
        setUserProfile(null);
        setIsFetchingProfile(false);
      }
    });

    return () => unsubscribeAuth();
  }, [auth]);

  useEffect(() => {
    if (user) {
      const unsubscribeProfile = onUserProfileChange(user.uid, (profile) => {
        setUserProfile(profile);
        setIsFetchingProfile(false);
      });
      return () => unsubscribeProfile();
    }
  }, [user]);


  const methods = useForm<SimulationFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      targetJob: '',
      skillsToTest: '',
      simulationType: 'interview',
    },
  });
  
  const { control, getValues } = methods;

  const startSimulation = async (values: SimulationFormValues) => {
    if (!userProfile?.digitalTwin) {
        toast({ title: 'Digital Twin not found.', variant: 'destructive', description: 'Please complete onboarding from the dashboard.' });
        return;
    }
    
    setIsStarting(true);
    setInterviewQuestion(null);
    setSimulationResult(null);

    try {
        if (values.simulationType === 'interview') {
            const result = await simulateInterview({
                digitalTwin: JSON.stringify(userProfile),
                targetJob: values.targetJob,
                skill: values.skillsToTest,
            });
            setInterviewQuestion(result.question);
        } else {
            toast({ title: 'This simulation type is not yet available.'})
        }
    } catch (error) {
        console.error('Error starting simulation:', error);
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to start simulation.' });
    } finally {
        setIsStarting(false);
    }
  }

  const handleEvaluate = async () => {
    if (!transcript) {
        toast({ title: 'Please provide an answer first.', variant: 'destructive' });
        return;
    }
    setIsLoading(true);
    setSimulationResult(null);
    try {
        const result = await simulateInterview({
            digitalTwin: JSON.stringify(userProfile),
            targetJob: getValues('targetJob'),
            skill: getValues('skillsToTest'),
            question: interviewQuestion!,
            answer: transcript,
        });
        setSimulationResult(result.evaluation!);
    } catch (error) {
        console.error('Error evaluating answer:', error);
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to evaluate your answer.' });
    } finally {
        setIsLoading(false);
    }
  }
  
  if (isFetchingProfile) {
    return (
        <div className="flex h-[calc(100vh-10rem)] items-center justify-center">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
    );
  }

  if (!user || !userProfile?.digitalTwin) {
    return (
         <Alert>
            <Wand className="h-4 w-4" />
            <AlertTitle>Create Your Digital Twin First!</AlertTitle>
            <AlertDescription>
              You need a Digital Twin to use the Career Path Simulator. Please
              complete the onboarding from the Dashboard.
            </AlertDescription>
        </Alert>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Interactive Career Simulation</CardTitle>
        <CardDescription>
          Test your skills in a real-world scenario simulated by AI.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!interviewQuestion ? (
             <FormProvider {...methods}>
                <form onSubmit={methods.handleSubmit(startSimulation)} className="space-y-4">
                    <FormField
                    control={control}
                    name="targetJob"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Target Job</FormLabel>
                        <FormControl>
                            <Input placeholder="e.g., Senior Product Manager" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={control}
                    name="skillsToTest"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Skills to Test (comma-separated)</FormLabel>
                        <FormControl>
                            <Input placeholder="e.g., System Design, Leadership" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                        control={control}
                        name="simulationType"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Simulation Type</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a simulation type" />
                                </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="interview">Oral Interview</SelectItem>
                                    <SelectItem value="technical" disabled>Technical Challenge (soon)</SelectItem>
                                    <SelectItem value="aptitude" disabled>Aptitude Test (soon)</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    <Button type="submit" disabled={isStarting}>
                    {isStarting ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <Sparkles className="mr-2 h-4 w-4" />
                    )}
                    Start Simulation
                    </Button>
                </form>
            </FormProvider>
        ) : (
            <div className="space-y-6">
                <Alert>
                    <Briefcase className="h-4 w-4" />
                    <AlertTitle>AI Interviewer</AlertTitle>
                    <AlertDescription className="text-lg">
                        {interviewQuestion}
                    </AlertDescription>
                </Alert>

                <OralInterview onTranscriptChange={setTranscript} prompt="" />

                <div className='flex justify-between items-center'>
                    <Button onClick={handleEvaluate} disabled={isLoading}>
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Evaluate My Answer
                    </Button>
                    <Button variant="outline" onClick={() => setInterviewQuestion(null)}>
                        Start Over
                    </Button>
                </div>

                {isLoading && (
                    <div className="space-y-2">
                        <Skeleton className="h-6 w-1/3" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-4/5" />
                    </div>
                )}
                {simulationResult && (
                    <Alert>
                        <Wand className="h-4 w-4" />
                        <AlertTitle>Evaluation Feedback</AlertTitle>
                        <AlertDescription className="prose prose-sm dark:prose-invert">
                           <p>{simulationResult}</p>
                        </AlertDescription>
                    </Alert>
                )}
            </div>
        )}
      </CardContent>
    </Card>
  );
}
