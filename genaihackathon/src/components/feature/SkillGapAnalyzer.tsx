'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Target, Loader2, Lightbulb, BookOpen } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
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
import { analyzeSkillGaps } from '@/ai/flows/analyze-skill-gaps';
import { getPersonalizedLearningRecommendations } from '@/ai/flows/get-personalized-learning-recommendations';
import { Skeleton } from '../ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';

const formSchema = z.object({
  targetRole: z.string().min(1, 'Please enter a target role.'),
});

type SkillGapFormValues = z.infer<typeof formSchema>;

type SkillGapAnalyzerProps = {
  digitalTwinDescription: string | null | undefined;
  onAnalysisComplete: (result: {
    skillGaps: string;
    recommendations: string;
  }) => void;
};

export function SkillGapAnalyzer({
  digitalTwinDescription,
  onAnalysisComplete,
}: SkillGapAnalyzerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isRecommendationLoading, setIsRecommendationLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<{
    skillGaps: string;
    recommendations: string;
  } | null>(null);
  const [learningRecs, setLearningRecs] = useState<string[] | null>(null);
  const { toast } = useToast();

  const form = useForm<SkillGapFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      targetRole: '',
    },
  });

  async function onSubmit(values: SkillGapFormValues) {
    if (!digitalTwinDescription) {
      toast({
        variant: 'destructive',
        title: 'Digital Twin required',
        description: 'Please generate your Digital Twin first.',
      });
      return;
    }
    setIsLoading(true);
    setAnalysisResult(null);
    setLearningRecs(null);

    try {
      const result = await analyzeSkillGaps({
        digitalTwin: digitalTwinDescription,
        targetRole: values.targetRole,
      });
      setAnalysisResult(result);
      onAnalysisComplete(result);
      toast({
        title: 'Analysis Complete',
        description: 'Skill gaps and recommendations are ready.',
      });
    } catch (error) {
      console.error('Error analyzing skill gaps:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description:
          'Failed to analyze skill gaps. Please try again later.',
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleGetRecommendations() {
    if (!analysisResult) return;
    setIsRecommendationLoading(true);
    try {
      const result = await getPersonalizedLearningRecommendations({
        skillGaps: analysisResult.skillGaps,
        careerPathSimulations: analysisResult.recommendations,
      });
      setLearningRecs(result.recommendations);
    } catch (error) {
      console.error('Error getting recommendations:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to get learning recommendations.',
      });
    } finally {
      setIsRecommendationLoading(false);
    }
  }

  const isFormDisabled = !digitalTwinDescription;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Target className="h-6 w-6 text-primary" />
          <CardTitle>Skill Gap Analysis</CardTitle>
        </div>
        <CardDescription>
          Identify the skills you need to achieve your career goals.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="targetRole"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Target Role or Skill</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Full Stack Developer, UX Designer"
                      {...field}
                      disabled={isFormDisabled || isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              disabled={isFormDisabled || isLoading}
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Target className="mr-2 h-4 w-4" />
              )}
              Analyze Gaps
            </Button>
          </form>
        </Form>
        {isLoading && (
          <div className="space-y-4 pt-4">
            <Skeleton className="h-6 w-1/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-6 w-1/3 mt-4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        )}
        {analysisResult && (
          <div className="space-y-6 pt-4">
            <Alert>
              <Lightbulb className="h-4 w-4" />
              <AlertTitle>Skill Gap Analysis</AlertTitle>
              <AlertDescription>{analysisResult.skillGaps}</AlertDescription>
            </Alert>
            <Alert>
              <Lightbulb className="h-4 w-4" />
              <AlertTitle>Recommendations</AlertTitle>
              <AlertDescription>
                {analysisResult.recommendations}
              </AlertDescription>
            </Alert>

            {learningRecs ? (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <BookOpen />
                  Personalized Learning Path
                </h3>
                <ul className="list-disc space-y-2 pl-5 text-muted-foreground">
                  {learningRecs.map((rec, index) => (
                    <li key={index}>{rec}</li>
                  ))}
                </ul>
              </div>
            ) : (
              <Button
                onClick={handleGetRecommendations}
                disabled={isRecommendationLoading}
              >
                {isRecommendationLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <BookOpen className="mr-2 h-4 w-4" />
                )}
                Get Learning Recommendations
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
