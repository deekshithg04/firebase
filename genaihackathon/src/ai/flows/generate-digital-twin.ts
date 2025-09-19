
'use server';

/**
 * @fileOverview A flow to generate a digital twin representing the user's current skills and career status.
 *
 * - generateDigitalTwin - A function that handles the generation of the digital twin.
 * - GenerateDigitalTwinInput - The input type for the generateDigitalTwin function.
 * - GenerateDigitalTwinOutput - The return type for the generateDigitalTwin function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateDigitalTwinInputSchema = z.object({
  skills: z
    .string()
    .describe("A comma-separated list of the user's current skills."),
  careerStatus: z
    .string()
    .describe("A description of the user's current career status, including education and job preferences."),
  userId: z.string().describe('The ID of the user.'),
});

export type GenerateDigitalTwinInput = z.infer<
  typeof GenerateDigitalTwinInputSchema
>;

const GenerateDigitalTwinOutputSchema = z.object({
  digitalTwinDescription: z
    .string()
    .describe("A comprehensive, AI-analyzed textual summary of the user's professional profile."),
});

export type GenerateDigitalTwinOutput = z.infer<
  typeof GenerateDigitalTwinOutputSchema
>;

export async function generateDigitalTwin(
  input: GenerateDigitalTwinInput
): Promise<GenerateDigitalTwinOutput> {
  return generateDigitalTwinFlow(input);
}

const prompt = ai.definePrompt({
    name: 'generateDigitalTwinPrompt',
    input: { schema: GenerateDigitalTwinInputSchema },
    output: { schema: GenerateDigitalTwinOutputSchema },
    prompt: `You are an expert career analyst AI. Your task is to create a "Digital Twin" for a user by analyzing their professional data. This twin is a structured, analytical summary, not a simple paragraph.

    Analyze the following user data:
    - User's Skills: {{{skills}}}
    - User's Career Status (including education and job preferences): {{{careerStatus}}}
    
    Based on your analysis, generate a concise, structured summary. The summary should be insightful and highlight key aspects of their professional identity. It should be formatted as a single block of text, using markdown for clarity.
    
    Example format:
    "**Professional Synopsis:** A [adjective] professional with a foundation in [Education Field] and a strong focus on [Primary Skill Area].
    **Core Competencies:** [Skill 1], [Skill 2], [Skill 3].
    **Career Trajectory:** Currently seeking opportunities in [Job Preference] roles, leveraging expertise in [Key Skill/Technology]. Well-suited for environments that value [inferred value, e.g., collaboration, innovation]."

    Generate the digital twin description now.`
});


const generateDigitalTwinFlow = ai.defineFlow(
  {
    name: 'generateDigitalTwinFlow',
    inputSchema: GenerateDigitalTwinInputSchema,
    outputSchema: GenerateDigitalTwinOutputSchema,
  },
  async input => {
    const { output } = await prompt(input);
    return output!;
  }
);

    