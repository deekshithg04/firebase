'use server';

/**
 * @fileOverview Flow for analyzing skill gaps between a user's digital twin and target roles/skills.
 *
 * - analyzeSkillGaps - Analyzes the skill gaps.
 * - AnalyzeSkillGapsInput - The input type for the analyzeSkillGaps function.
 * - AnalyzeSkillGapsOutput - The return type for the analyzeSkillGaps function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeSkillGapsInputSchema = z.object({
  digitalTwin: z
    .string()
    .describe("A description of the user's current skills and experience."),
  targetRole: z
    .string()
    .describe('The target role or skills the user is interested in.'),
});
export type AnalyzeSkillGapsInput = z.infer<typeof AnalyzeSkillGapsInputSchema>;

const AnalyzeSkillGapsOutputSchema = z.object({
  skillGaps: z
    .string()
    .describe('A description of the skill gaps between the digital twin and the target role.'),
  recommendations: z
    .string()
    .describe('Recommendations for how to close the skill gaps.'),
});
export type AnalyzeSkillGapsOutput = z.infer<typeof AnalyzeSkillGapsOutputSchema>;

export async function analyzeSkillGaps(input: AnalyzeSkillGapsInput): Promise<AnalyzeSkillGapsOutput> {
  return analyzeSkillGapsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeSkillGapsPrompt',
  input: {schema: AnalyzeSkillGapsInputSchema},
  output: {schema: AnalyzeSkillGapsOutputSchema},
  prompt: `You are a career coach. Analyze the user's current skills and experience (digital twin) and compare it to the target role or skills the user is interested in. Identify the skill gaps and provide recommendations for how to close the skill gaps.

Digital Twin: {{{digitalTwin}}}
Target Role: {{{targetRole}}}

Skill Gaps and Recommendations:`,
});

const analyzeSkillGapsFlow = ai.defineFlow(
  {
    name: 'analyzeSkillGapsFlow',
    inputSchema: AnalyzeSkillGapsInputSchema,
    outputSchema: AnalyzeSkillGapsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
