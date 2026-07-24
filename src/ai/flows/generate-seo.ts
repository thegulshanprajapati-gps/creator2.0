'use server';

import { ai, hasGeminiApiKey } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateSeoInputSchema = z.object({
  pageSlug: z.string().describe('The page slug to generate SEO metadata for.'),
  sectionsContext: z.string().optional().describe('Text content gathered from the page to help customize the SEO suggestions.'),
});

const GenerateSeoOutputSchema = z.object({
  title: z.string().describe('Catchy, SEO-optimized title for search engines (max 60 chars).'),
  description: z.string().describe('Engaging meta description under 160 characters.'),
  keywords: z.string().describe('Comma-separated list of 5-8 relevant search keywords.')
});

export type GenerateSeoOutput = z.infer<typeof GenerateSeoOutputSchema>;

export async function generateSeoAction(pageSlug: string, sectionsContext?: string): Promise<GenerateSeoOutput> {
  if (!hasGeminiApiKey()) {
    throw new Error('Gemini API not found - got it >>');
  }

  const promptText = `You are a professional SEO copywriter. Generate search engine optimization metadata for the webpage: "${pageSlug}" on the Xmarty Creator platform. 
Use the following page context if provided to customize the suggestions:
"${sectionsContext || ''}"

Return a catchy, click-worthy Meta Title (under 60 characters), a Meta Description (under 160 characters), and a comma-separated list of 5-8 relevant keywords.`;

  try {
    const { output } = await ai.generate({
      prompt: promptText,
      output: { schema: GenerateSeoOutputSchema }
    });

    if (!output) throw new Error('AI returned an empty response.');
    return output;
  } catch (err: any) {
    console.error('Genkit SEO generate flow failed:', err);
    if (err.message && err.message.includes('Gemini API not found')) {
      throw err;
    }
    throw new Error(err.message || 'AI Generation failed');
  }
}
