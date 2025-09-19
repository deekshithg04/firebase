'use server';

/**
 * @fileOverview A flow to generate a random oral fluency prompt.
 * 
 * - getOralFluencyPrompt - A function that returns a random prompt.
 * - GetOralFluencyPromptOutput - The return type for the getOralFluencyPrompt function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GetOralFluencyPromptOutputSchema = z.object({
  prompt: z.string().describe('A question to test oral fluency.'),
});

export type GetOralFluencyPromptOutput = z.infer<typeof GetOralFluencyPromptOutputSchema>;

export async function getOralFluencyPrompt(): Promise<GetOralFluencyPromptOutput> {
  return getOralFluencyPromptFlow();
}

const promptFlow = ai.definePrompt({
    name: 'oralFluencyPromptGenerator',
    output: { schema: GetOralFluencyPromptOutputSchema },
    prompt: `Generate a single, random, simple, and short question to test a user's oral fluency and communication skills. The question should be open-ended, under 15 words, and require a descriptive answer.
    
    Example topics:
    - Describe a recent challenge.
    - What are your career goals?
    - What is a book that influenced you?
    - Explain a complex topic you know well.
    `,
});

const getOralFluencyPromptFlow = ai.defineFlow(
  {
    name: 'getOralFluencyPromptFlow',
    outputSchema: GetOralFluencyPromptOutputSchema,
  },
  async () => {
    const { output } = await promptFlow();
    return output!;
  }
);
