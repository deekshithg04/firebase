'use server';

/**
 * @fileOverview An AI assistant that provides personalized career guidance, answers questions, offers insights,
 * clears doubts, and suggests future-proof skills and careers.
 *
 * - getAIGuidance - A function that handles the AI guidance process.
 * - GetAIGuidanceInput - The input type for the getAIGuidance function.
 * - GetAIGuidanceOutput - The return type for the getAIGuidance function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GetAIGuidanceInputSchema = z.object({
  query: z.string().describe('The user query or question about career guidance.'),
  digitalTwin: z.string().optional().describe("A description of the user's current skills and experience."),
});

export type GetAIGuidanceInput = z.infer<typeof GetAIGuidanceInputSchema>;

const GetAIGuidanceOutputSchema = z.object({
  response: z.string().describe('The AI assistant\'s response to the user query.'),
});

export type GetAIGuidanceOutput = z.infer<typeof GetAIGuidanceOutputSchema>;

export async function getAIGuidance(input: GetAIGuidanceInput): Promise<GetAIGuidanceOutput> {
  return getAIGuidanceFlow(input);
}

const prompt = ai.definePrompt({
  name: 'getAIGuidancePrompt',
  input: {schema: GetAIGuidanceInputSchema},
  output: {schema: GetAIGuidanceOutputSchema},
  prompt: `You are a career guidance expert. Provide personalized guidance, answer questions, offer insights into career development strategies, clear doubts, and suggest skills and careers that will be more used in upcoming years.

{{#if digitalTwin}}
You have access to the user's digital twin. Use this information to make your advice highly personalized.
USER'S DIGITAL TWIN:
---
{{digitalTwin}}
---
{{/if}}

IMPORTANT: Your response must be in simple, clear, and user-friendly language. Avoid jargon and complex terminology. Make your advice easy for anyone to understand.
Your answer must be short, simple, and presented in point form. Do NOT use long paragraphs.

User Query: {{{query}}}`,
});

const getAIGuidanceFlow = ai.defineFlow(
  {
    name: 'getAIGuidanceFlow',
    inputSchema: GetAIGuidanceInputSchema,
    outputSchema: GetAIGuidanceOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
