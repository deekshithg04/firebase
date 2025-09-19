'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, Briefcase, Sparkles } from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { simulateCareerPaths } from '@/ai/flows/simulate-career-paths';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '../ui/skeleton';

const formSchema = z.object({
  userSkills: z.string().min(1, 'Please enter at least one skill.'),
  careerGoals: z.string().min(1, 'Please describe your career goals.'),
});

type CareerPathFormValues = z.infer<typeof formSchema>;

export function CareerPathSimulator() {
  const [isLoading, setIsLoading] = useState(false);
  const [simulationResult, setSimulationResult] = useState<{
    suggestedRoles: string[];
    careerPathSimulations: string[];
  } | null>(null);
  const { toast } = useToast();

  const form = useForm<CareerPathFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      userSkills: '',
      careerGoals: '',
    },
  });

  async function onSubmit(values: CareerPathFormValues) {
    setIsLoading(true);
    setSimulationResult(null);

    try {
      const result = await simulateCareerPaths({
        userSkills: values.userSkills.split(',').map((s) => s.trim()),
        careerGoals: values.careerGoals,
      });
      setSimulationResult(result);
      toast({
        title: 'Simulation Complete',
        description: 'Potential career paths are ready for you to explore.',
      });
    } catch (error) {
      console.error('Error simulating career paths:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to simulate career paths. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Career Path Simulation</CardTitle>
        <CardDescription>
          Explore potential career trajectories based on your skills and
          ambitions.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="userSkills"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your Skills (comma-separated)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Python, Data Analysis, Machine Learning"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="careerGoals"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your Career Goals</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="e.g., Become a lead data scientist in a tech company, specializing in AI ethics."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-4 w-4" />
              )}
              Simulate Paths
            </Button>
          </form>
        </Form>

        {isLoading && (
          <div className="mt-6 space-y-4">
            <Skeleton className="h-8 w-1/3" />
            <div className="flex flex-wrap gap-2">
              <Skeleton className="h-6 w-24 rounded-full" />
              <Skeleton className="h-6 w-32 rounded-full" />
              <Skeleton className="h-6 w-28 rounded-full" />
            </div>
            <Skeleton className="h-8 w-1/4 mt-4" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        )}

        {simulationResult && (
          <div className="mt-6 space-y-6">
            <div>
              <h3 className="mb-2 text-lg font-semibold flex items-center gap-2">
                <Briefcase />
                Suggested Roles
              </h3>
              <div className="flex flex-wrap gap-2">
                {simulationResult.suggestedRoles.map((role, index) => (
                  <Badge key={index} variant="secondary">
                    {role}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <h3 className="mb-2 text-lg font-semibold">
                Career Path Simulations
              </h3>
              <Accordion type="single" collapsible className="w-full">
                {simulationResult.careerPathSimulations.map((sim, index) => (
                  <AccordionItem value={`item-${index}`} key={index}>
                    <AccordionTrigger>Path Simulation {index + 1}</AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      {sim}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
