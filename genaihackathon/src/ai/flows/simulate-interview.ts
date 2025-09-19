'use server';

/**
 * @fileOverview Simulates an oral interview and provides an evaluation.
 *
 * - simulateInterview - A function that handles the interview simulation.
 * - SimulateInterviewInput - The input type for the simulateInterview function.
 * - SimulateInterviewOutput - The return type for the simulateInterview function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SimulateInterviewInputSchema = z.object({
  digitalTwin: z.string().describe("A JSON string representing the user's full profile, including skills, experience, and digital twin description."),
  targetJob: z.string().describe('The target job role for the interview.'),
  skill: z.string().describe('The specific skill to be tested in the interview.'),
  question: z.string().optional().describe('An existing question, if the user is providing an answer.'),
  answer: z.string().optional().describe("The user's spoken answer to the interview question."),
});

export type SimulateInterviewInput = z.infer<typeof SimulateInterviewInputSchema>;

const SimulateInterviewOutputSchema = z.object({
  question: z.string().describe('The generated interview question for the user.'),
  evaluation: z.string().optional().describe("The AI's evaluation of the user's answer."),
});

export type SimulateInterviewOutput = z.infer<typeof SimulateInterviewOutputSchema>;


export async function simulateInterview(
  input: SimulateInterviewInput
): Promise<SimulateInterviewOutput> {
  return simulateInterviewFlow(input);
}


const interviewPrompt = ai.definePrompt({
    name: 'interviewPrompt',
    input: { schema: SimulateInterviewInputSchema },
    output: { schema: SimulateInterviewOutputSchema },
    prompt: `
        You are an expert technical interviewer. Your task is to conduct a simulated oral interview.

        USER PROFILE (Digital Twin & Full Profile):
        {{digitalTwin}}

        TARGET JOB: {{targetJob}}
        SKILL TO TEST: {{skill}}

        {{#if answer}}
        You previously asked this question:
        QUESTION: {{question}}

        The user provided this answer:
        ANSWER: {{answer}}

        Now, your task is to evaluate the user's answer. Provide constructive feedback on the clarity, accuracy, and depth of their response. Be encouraging but also point out areas for improvement. Keep the evaluation concise and actionable (3-5 sentences). Respond only with the evaluation.
        {{else}}
        Your task is to generate a single, relevant, open-ended interview question based on the user's profile, target job, and the skill to be tested. The question should be designed to be answered verbally. Respond only with the question.
        {{/if}}
    `,
});


const simulateInterviewFlow = ai.defineFlow(
  {
    name: 'simulateInterviewFlow',
    inputSchema: SimulateInterviewInputSchema,
    outputSchema: SimulateInterviewOutputSchema,
  },
  async (input) => {
    const { output } = await interviewPrompt(input);
    return output!;
  }
);
