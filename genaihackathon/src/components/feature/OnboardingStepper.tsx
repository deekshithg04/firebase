
'use client';

import { useState, useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  ArrowRight,
  Loader2,
  Upload,
  FileText,
  Briefcase,
  Type,
  GraduationCap,
  ClipboardCheck,
  Mic
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { generateDigitalTwin } from '@/ai/flows/generate-digital-twin';
import { Skeleton } from '../ui/skeleton';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { createUserProfile, uploadFile, UserProfile } from '@/services/user-service';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import { app } from '@/lib/firebase';
import { OralInterview } from './OralInterview';


const step1Schema = z.object({
  resume: z.any().optional(),
  education: z.string().min(1, 'Education details are required.'),
  jobPreferences: z.string().min(1, 'Job preferences are required.'),
  skills: z.string().min(1, 'Please list at least one skill.'),
});

const step2Schema = z.object({
  psychometricTestAnswer: z.string().min(1, 'Please select an answer.'),
});

const step3Schema = z.object({
    oralFluencyAnswer: z.string().optional(),
});


const onboardingSchema = step1Schema.merge(step2Schema).merge(step3Schema);

type OnboardingFormValues = z.infer<typeof onboardingSchema>;

const steps = [
  { id: '01', name: 'Personal Details', fields: ['resume', 'education', 'jobPreferences', 'skills'], icon: FileText },
  { id: '02', name: 'Psychometric Test', fields: ['psychometricTestAnswer'], icon: ClipboardCheck },
  { id: '03', name: 'Oral Fluency Test', fields: ['oralFluencyAnswer'], icon: Mic },
];

type OnboardingStepperProps = {
    onOnboardingComplete: () => void;
}

export function OnboardingStepper({ onOnboardingComplete }: OnboardingStepperProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  const { toast } = useToast();
  const auth = getAuth(app);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
        if (currentUser) {
            setUser(currentUser);
        }
        setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, [auth]);


  const methods = useForm<OnboardingFormValues>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      education: '',
      jobPreferences: '',
      skills: '',
    },
  });

  const { handleSubmit, trigger, control } = methods;

  const handleNext = async () => {
    const fields = steps[currentStep].fields;
    const output = await trigger(fields as any, { shouldFocus: true });

    if (!output) return;

    if (currentStep < steps.length - 1) {
      setCurrentStep((step) => step + 1);
    } else {
      await handleSubmit(processForm)();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep((step) => step - 1);
    }
  };

  const processForm = async (data: OnboardingFormValues) => {
    setIsLoading(true);
  
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Not Authenticated',
        description: 'You must be logged in to create a profile. Please wait or try logging in again.',
      });
      setIsLoading(false);
      return;
    }
    
    let resumeUrl = '';
  
    try {
      if (data.resume && data.resume.length > 0) {
        const file = data.resume[0];
        if (file) {
          toast({ title: 'Uploading resume...' });
          try {
            resumeUrl = await uploadFile(file, `resumes/${user.uid}/${file.name}`);
            toast({ title: 'Resume uploaded!' });
          } catch (uploadError) {
            console.error('Resume upload failed:', uploadError);
            toast({ variant: 'destructive', title: 'Resume Upload Failed', description: 'Could not upload your resume file.' });
            setIsLoading(false);
            return;
          }
        }
      }
  
      toast({ title: 'Generating your Digital Twin...', description: 'This may take a moment.' });
      let twinResult;
      try {
        twinResult = await generateDigitalTwin({
          skills: data.skills,
          careerStatus: `Education: ${data.education}. Job Preferences: ${data.jobPreferences}.`,
          userId: user.uid,
        });
      } catch (twinError) {
        console.error('Digital twin generation failed:', twinError);
        toast({ variant: 'destructive', title: 'Twin Generation Failed', description: 'The AI could not generate your digital twin. Please try again.' });
        setIsLoading(false);
        return;
      }
  
      const userProfileData: Partial<UserProfile> = {
        id: user.uid,
        email: user.email || '',
        name: user.displayName || '',
        education: data.education,
        jobPreferences: data.jobPreferences,
        skills: data.skills.split(',').map(s => s.trim()),
        psychometricTestAnswer: data.psychometricTestAnswer,
        oralFluencyAnswer: data.oralFluencyAnswer || '',
        resumeUrl: resumeUrl || '',
        digitalTwin: {
          description: twinResult.digitalTwinDescription,
        },
      };
  
      try {
        await createUserProfile(user.uid, userProfileData);
      } catch (saveError) {
        console.error('Firestore save failed:', saveError);
        toast({ variant: 'destructive', title: 'Profile Save Failed', description: 'Could not save your profile to the database.' });
        setIsLoading(false);
        return;
      }
  
      toast({
        title: 'Success!',
        description: 'Your Digital Twin and profile have been created.',
      });
  
      onOnboardingComplete();
  
    } catch(error) {
      console.error("An unexpected error occurred during onboarding:", error);
      toast({ variant: 'destructive', title: 'Onboarding Failed', description: 'An unexpected error occurred. Please try again.'});
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && currentStep === steps.length -1) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Generating Your Digital Twin...</CardTitle>
                <CardDescription>The AI is sculpting your profile. Please wait a moment.</CardDescription>
            </CardHeader>
            <CardContent>
                 <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    <div className="md:col-span-1">
                    <Skeleton className="aspect-square w-full rounded-lg" />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                    <Skeleton className="h-6 w-1/3" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Your Digital Twin</CardTitle>
        <CardDescription>
          Complete the following steps to build your professional profile.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <nav aria-label="Progress">
          <ol role="list" className="space-y-4 md:flex md:space-x-8 md:space-y-0">
            {steps.map((step, index) => (
              <li key={step.name} className="md:flex-1">
                {currentStep > index ? (
                  <div className="group flex w-full flex-col border-l-4 border-primary py-2 pl-4 transition-colors md:border-l-0 md:border-t-4 md:pb-0 md:pl-0 md:pt-4">
                    <span className="text-sm font-medium text-primary transition-colors ">
                      {step.id}
                    </span>
                    <span className="text-sm font-medium">{step.name}</span>
                  </div>
                ) : currentStep === index ? (
                  <div
                    className="flex w-full flex-col border-l-4 border-primary py-2 pl-4 md:border-l-0 md:border-t-4 md:pb-0 md:pl-0 md:pt-4"
                    aria-current="step"
                  >
                    <span className="text-sm font-medium text-primary">
                      {step.id}
                    </span>
                    <span className="text-sm font-medium">{step.name}</span>
                  </div>
                ) : (
                  <div className="group flex w-full flex-col border-l-4 border-border py-2 pl-4 transition-colors md:border-l-0 md:border-t-4 md:pb-0 md:pl-0 md:pt-4">
                    <span className="text-sm font-medium text-muted-foreground transition-colors">
                      {step.id}
                    </span>
                    <span className="text-sm font-medium">{step.name}</span>
                  </div>
                )}
              </li>
            ))}
          </ol>
        </nav>
        <div className="mt-8">
            <FormProvider {...methods}>
                <form onSubmit={handleSubmit(processForm)}>
                    {currentStep === 0 && (
                        <div className="space-y-4">
                            <FormField
                                control={control}
                                name="resume"
                                render={({ field: { onChange, value, ...props} }) => (
                                    <FormItem>
                                        <FormLabel>CV / Resume (Optional)</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Upload className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                                <Input type="file" accept=".pdf,.doc,.docx,.txt" className="pl-10" onChange={(e) => onChange(e.target.files)} {...props} />
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                             <FormField
                                control={control}
                                name="education"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Education Details</FormLabel>
                                     <div className="relative">
                                        <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                        <Input placeholder="e.g., B.Tech in Computer Science" className="pl-10" {...field} />
                                    </div>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                            <FormField
                                control={control}
                                name="jobPreferences"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Job Preferences</FormLabel>
                                     <div className="relative">
                                        <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                        <Input placeholder="e.g., Frontend Developer, Remote" className="pl-10" {...field} />
                                    </div>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                             <FormField
                                control={control}
                                name="skills"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Skills (comma-separated)</FormLabel>
                                    <div className="relative">
                                        <Type className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                        <Textarea placeholder="e.g., React, TypeScript, Node.js" className="pl-10" {...field} />
                                    </div>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                        </div>
                    )}
                     {currentStep === 1 && (
                        <FormField
                            control={control}
                            name="psychometricTestAnswer"
                            render={({ field }) => (
                                <FormItem className="space-y-3">
                                <FormLabel>When working on a team project, you prefer to:</FormLabel>
                                <FormControl>
                                    <RadioGroup
                                        onValueChange={field.onChange}
                                        defaultValue={field.value}
                                        className="flex flex-col space-y-1"
                                    >
                                        <FormItem className="flex items-center space-x-3 space-y-0">
                                            <FormControl>
                                            <RadioGroupItem value="lead" />
                                            </FormControl>
                                            <FormLabel className="font-normal">
                                            Take the lead and organize the tasks.
                                            </FormLabel>
                                        </FormItem>
                                        <FormItem className="flex items-center space-x-3 space-y-0">
                                            <FormControl>
                                            <RadioGroupItem value="collaborate" />
                                            </FormControl>
                                            <FormLabel className="font-normal">
                                            Collaborate closely with everyone on all aspects.
                                            </FormLabel>
                                        </FormItem>
                                        <FormItem className="flex items-center space-x-3 space-y-0">
                                            <FormControl>
                                            <RadioGroupItem value="focus" />
                                            </FormControl>
                                            <FormLabel className="font-normal">
                                            Focus on your assigned part and deliver quality work.
                                            </FormLabel>
                                        </FormItem>
                                         <FormItem className="flex items-center space-x-3 space-y-0">
                                            <FormControl>
                                            <RadioGroupItem value="support" />
                                            </FormControl>
                                            <FormLabel className="font-normal">
                                            Support teammates and help where needed.
                                            </FormLabel>
                                        </FormItem>
                                    </RadioGroup>
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                    )}
                     {currentStep === 2 && (
                        <FormField
                            control={control}
                            name="oralFluencyAnswer"
                            render={({ field }) => (
                                <FormItem>
                                    <OralInterview 
                                        onTranscriptChange={(transcript) => {
                                            field.onChange(transcript);
                                        }}
                                    />
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                     )}
                </form>
            </FormProvider>
        </div>
      </CardContent>
      <CardFooter>
        <div className="flex justify-between w-full">
            <Button onClick={handlePrev} disabled={currentStep === 0 || isLoading} variant="outline">
                Previous
            </Button>
            <Button onClick={handleNext} disabled={isLoading || !isAuthReady}>
                {isLoading && currentStep === steps.length -1 ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                    <>
                    {currentStep === steps.length - 1 ? 'Generate Twin' : 'Next'}
                    <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                )}
            </Button>
        </div>
      </CardFooter>
    </Card>
  );
}

    