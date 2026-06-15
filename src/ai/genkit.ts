import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
  console.warn('⚠️ GEMINI_API_KEY not found in environment variables. AI features will not work.');
}

export const ai = genkit({
  plugins: [googleAI()],
  model: 'googleai/gemini-2.5-flash',
});

export function hasGeminiApiKey(): boolean {
  return !!API_KEY;
}
