'use server';

/**
 * @fileOverview AI-powered insights generation for barangay data.
 *
 * This file defines a Genkit flow that leverages AI to analyze barangay data, providing insights into resident demographics,
 * document request patterns, and potential issues. It allows administrators to make data-driven decisions.
 *
 * @requires genkit
 * @requires z
 *
 * @exports generateInsights - An async function to trigger the insights generation flow.
 * @exports GenerateInsightsInput - The input type for the generateInsights function.
 * @exports GenerateInsightsOutput - The output type for the generateInsights function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Define the input schema for the insights generation flow
const GenerateInsightsInputSchema = z.object({
  residentData: z.string().describe('JSON string containing an array of resident profiles, including demographic information.'),
  documentRequestData: z.string().describe('JSON string containing an array of document requests, including request details and status.'),
  parameters: z.string().optional().describe('Optional parameters to customize the generated insights, such as specific trends to analyze.'),
});

export type GenerateInsightsInput = z.infer<typeof GenerateInsightsInputSchema>;

// Define the output schema for the insights generation flow
const GenerateInsightsOutputSchema = z.object({
  insights: z.string().describe('A comprehensive analysis of the barangay data, including trends, potential issues, and actionable recommendations.'),
});

export type GenerateInsightsOutput = z.infer<typeof GenerateInsightsOutputSchema>;

// Define the main function to trigger the insights generation flow
export async function generateInsights(input: GenerateInsightsInput): Promise<GenerateInsightsOutput> {
  return generateInsightsFlow(input);
}

// Define the prompt for the AI model
const insightsPrompt = ai.definePrompt({
  name: 'insightsPrompt',
  input: {schema: GenerateInsightsInputSchema},
  output: {schema: GenerateInsightsOutputSchema},
  prompt: `You are an AI assistant tasked with analyzing barangay data to provide valuable insights to the administrator.

  Analyze the following resident data and document request patterns to identify trends, potential issues, and actionable recommendations.

  Resident Data: {{{residentData}}}
  Document Request Data: {{{documentRequestData}}}

  Parameters: {{{parameters}}}

  Provide a comprehensive analysis that can help the administrator make data-driven decisions.
  The insights should include potential issues and actionable recommendations for the barangay.
  Ensure the output is well-structured and easy to understand.
`,
});

// Define the Genkit flow for generating insights from barangay data
const generateInsightsFlow = ai.defineFlow(
  {
    name: 'generateInsightsFlow',
    inputSchema: GenerateInsightsInputSchema,
    outputSchema: GenerateInsightsOutputSchema,
  },
  async input => {
    const {output} = await insightsPrompt(input);
    return output!;
  }
);
