'use server';
/**
 * @fileOverview A Genkit flow for the Vasant AI Learning Assistant to answer student questions and provide navigation help.
 *
 * - assistStudentWithFAQAndNavigation - A function that handles student queries for the learning assistant.
 * - AssistStudentWithFAQAndNavigationInput - The input type for the assistStudentWithFAQAndNavigation function.
 * - AssistStudentWithFAQAndNavigationOutput - The return type for the assistStudentWithFAQAndNavigation function.
 */

import { ai, hasGeminiApiKey } from '@/ai/genkit';
import { z } from 'genkit';

const AssistStudentWithFAQAndNavigationInputSchema = z.object({
  query: z.string().describe('The student\'s question about the platform, courses, or common issues.'),
});
export type AssistStudentWithFAQAndNavigationInput = z.infer<typeof AssistStudentWithFAQAndNavigationInputSchema>;

const AssistStudentWithFAQAndNavigationOutputSchema = z.object({
  answer: z.string().describe('A clear, concise, and helpful answer to the student\'s question, guiding them efficiently.'),
});
export type AssistStudentWithFAQAndNavigationOutput = z.infer<typeof AssistStudentWithFAQAndNavigationOutputSchema>;

export async function assistStudentWithFAQAndNavigation(input: AssistStudentWithFAQAndNavigationInput): Promise<AssistStudentWithFAQAndNavigationOutput> {
  return assistStudentWithFAQAndNavigationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'assistStudentWithFAQAndNavigationPrompt',
  input: { schema: AssistStudentWithFAQAndNavigationInputSchema },
  output: { schema: AssistStudentWithFAQAndNavigationOutputSchema },
  prompt: `You are Vasant, the XmartyCreator AI Learning Assistant. Your role is to provide accurate, concise, and helpful answers to student questions about the XmartyCreator platform, available courses, and common technical or navigation issues.

Always aim to guide the student efficiently, providing clear instructions or direct answers.

Student's Question: {{{query}}}`,
});

const assistStudentWithFAQAndNavigationFlow = ai.defineFlow(
  {
    name: 'assistStudentWithFAQAndNavigationFlow',
    inputSchema: AssistStudentWithFAQAndNavigationInputSchema,
    outputSchema: AssistStudentWithFAQAndNavigationOutputSchema,
  },
  async (input) => {
    if (!hasGeminiApiKey()) {
      throw new Error('Gemini API not found - got it >>');
    }
    const { output } = await prompt(input);
    return output!;
  }
);
