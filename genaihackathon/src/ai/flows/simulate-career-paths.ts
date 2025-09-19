'use server';

/**
 * @fileOverview Simulates different career paths based on skill development.
 *
 * - simulateCareerPaths - A function that simulates career paths based on user input.
 * - SimulateCareerPathsInput - The input type for the simulateCareerPaths function.
 * - SimulateCareerPathsOutput - The return type for the simulateCareerPaths function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SimulateCareerPathsInputSchema = z.object({
  userSkills: z
    .array(z.string())
    .describe('A list of the user\u2019s current skills.'),
  careerGoals: z
    .string()
    .describe('The user\u2019s career goals and aspirations.'),
});
export type SimulateCareerPathsInput = z.infer<typeof SimulateCareerPathsInputSchema>;

const SimulateCareerPathsOutputSchema = z.object({
  suggestedRoles: z
    .array(z.string())
    .describe('A list of roles suggested to the user based on goals.'),
  careerPathSimulations: z
    .array(z.string())
    .describe('Simulations of different career paths based on skill development.'),
});
export type SimulateCareerPathsOutput = z.infer<typeof SimulateCareerPathsOutputSchema>;

export async function simulateCareerPaths(
  input: SimulateCareerPathsInput
): Promise<SimulateCareerPathsOutput> {
  return simulateCareerPathsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'simulateCareerPathsPrompt',
  input: {schema: SimulateCareerPathsInputSchema},
  output: {schema: SimulateCareerPathsOutputSchema},
  prompt: `You are a career advisor who will take in a user's current skills and career goals and create a few potential career path simulations and suggest roles.

User Skills: {{{userSkills}}}
Career Goals: {{{careerGoals}}}

Consider possible roles based on the user's goals and skills.
Create a simulation of different career paths based on skill development and predict potential outcomes.
Suggest resources for the user to achieve their goals.
`,
});

const simulateCareerPathsFlow = ai.defineFlow(
  {
    name: 'simulateCareerPathsFlow',
    inputSchema: SimulateCareerPathsInputSchema,
    outputSchema: SimulateCareerPathsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
