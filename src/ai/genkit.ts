import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

<<<<<<< HEAD
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  throw new Error('GEMINI_API_KEY environment variable not set');
}

export const ai = genkit({
  plugins: [googleAI({ apiKey })],
=======
export const ai = genkit({
  plugins: [googleAI()],
>>>>>>> 6c232461fb2b050965cc4b24accfb5c51a747356
  model: 'googleai/gemini-2.5-flash',
});
