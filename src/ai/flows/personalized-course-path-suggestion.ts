'use server';
/**
 * @fileOverview A Genkit flow for the Vasant AI Learning Assistant to suggest personalized course paths.
 *
 * - personalizedCoursePathSuggestion - A function that handles the personalized course path suggestion process.
 * - PersonalizedCoursePathSuggestionInput - The input type for the personalizedCoursePathSuggestion function.
 * - PersonalizedCoursePathSuggestionOutput - The return type for the personalizedCoursePathSuggestion function.
 */

import { ai, hasGeminiApiKey } from '@/ai/genkit';
import { z } from 'genkit';

const PersonalizedCoursePathSuggestionInputSchema = z.object({
  learningGoals: z
    .string()
    .describe("A detailed description of the student's learning goals."),
  interests: z
    .string()
    .describe("A detailed description of the student's interests."),
  currentKnowledge: z
    .string()
    .describe("A detailed description of the student's current knowledge and skills."),
});
export type PersonalizedCoursePathSuggestionInput = z.infer<
  typeof PersonalizedCoursePathSuggestionInputSchema
>;

const PersonalizedCoursePathSuggestionOutputSchema = z.object({
  suggestedCoursePath: z
    .string()
    .describe(
      "A personalized course path suggestion based on the student's input, formatted as a clear and actionable plan."
    ),
});
export type PersonalizedCoursePathSuggestionOutput = z.infer<
  typeof PersonalizedCoursePathSuggestionOutputSchema
>;

export async function personalizedCoursePathSuggestion(
  input: PersonalizedCoursePathSuggestionInput
): Promise<PersonalizedCoursePathSuggestionOutput> {
  return personalizedCoursePathSuggestionFlow(input);
}

const personalizedCoursePathSuggestionPrompt = ai.definePrompt({
  name: 'personalizedCoursePathSuggestionPrompt',
  input: { schema: PersonalizedCoursePathSuggestionInputSchema },
  output: { schema: PersonalizedCoursePathSuggestionOutputSchema },
  prompt: `You are Vasant, an intelligent AI Learning Assistant for XmartyCreator. Your goal is to help students by suggesting a personalized course path based on their input.

Consider the student's learning goals, interests, and current knowledge to recommend a suitable and engaging course path.
Provide a clear, actionable, and encouraging course path suggestion. Do not include any introductory or concluding remarks, just the suggested course path.

Student's Learning Goals: {{{learningGoals}}}
Student's Interests: {{{interests}}}
Student's Current Knowledge: {{{currentKnowledge}}}`,
});

const personalizedCoursePathSuggestionFlow = ai.defineFlow(
  {
    name: 'personalizedCoursePathSuggestionFlow',
    inputSchema: PersonalizedCoursePathSuggestionInputSchema,
    outputSchema: PersonalizedCoursePathSuggestionOutputSchema,
  },
  async (input) => {
    if (!hasGeminiApiKey()) {
      throw new Error('Gemini API not found - got it >>');
    }
    const { output } = await personalizedCoursePathSuggestionPrompt(input);
    return output!;
  }
);
