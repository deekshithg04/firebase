'use server';
/**
 * @fileOverview A flow that provides personalized learning recommendations based on skill gap analysis and career path simulations.
 *
 * - getPersonalizedLearningRecommendations - A function that returns personalized learning recommendations.
 * - GetPersonalizedLearningRecommendationsInput - The input type for the getPersonalizedLearningRecommendations function.
 * - GetPersonalizedLearningRecommendationsOutput - The return type for the getPersonalizedLearningRecommendations function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GetPersonalizedLearningRecommendationsInputSchema = z.object({
  skillGaps: z
    .string()
    .describe('A description of the skill gaps identified for the user.'),
  careerPathSimulations: z
    .string()
    .describe('A description of the career path simulations the user is interested in.'),
  userPreferences: z
    .string()
    .optional()
    .describe('Any specific user preferences to take into account.'),
});
export type GetPersonalizedLearningRecommendationsInput = z.infer<
  typeof GetPersonalizedLearningRecommendationsInputSchema
>;

const GetPersonalizedLearningRecommendationsOutputSchema = z.object({
  recommendations: z.array(z.string()).describe('A list of personalized learning recommendations.'),
});
export type GetPersonalizedLearningRecommendationsOutput = z.infer<
  typeof GetPersonalizedLearningRecommendationsOutputSchema
>;

export async function getPersonalizedLearningRecommendations(
  input: GetPersonalizedLearningRecommendationsInput
): Promise<GetPersonalizedLearningRecommendationsOutput> {
  return getPersonalizedLearningRecommendationsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'getPersonalizedLearningRecommendationsPrompt',
  input: {schema: GetPersonalizedLearningRecommendationsInputSchema},
  output: {schema: GetPersonalizedLearningRecommendationsOutputSchema},
  prompt: `You are a personalized learning recommendation expert. You will use the skill gap analysis, career path simulations and user preferences to generate a list of personalized learning recommendations. Use the user preferences to filter results and change the tone of the output.

Skill Gaps: {{{skillGaps}}}
Career Path Simulations: {{{careerPathSimulations}}}
User Preferences: {{{userPreferences}}}

Generate a list of personalized learning recommendations. Return the results as a numbered list.
`,
});

const getPersonalizedLearningRecommendationsFlow = ai.defineFlow(
  {
    name: 'getPersonalizedLearningRecommendationsFlow',
    inputSchema: GetPersonalizedLearningRecommendationsInputSchema,
    outputSchema: GetPersonalizedLearningRecommendationsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
