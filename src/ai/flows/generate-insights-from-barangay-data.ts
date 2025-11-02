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
  prompt: `You are an AI data analyst for a local government unit. Your task is to provide a clear, professional analysis of barangay data for the administrator.

  Analyze the following resident data and document request patterns to identify trends, potential issues, and actionable recommendations.

  Resident Data: {{{residentData}}}
  Document Request Data: {{{documentRequestData}}}
  Parameters: {{{parameters}}}

  Please format your response as a professional report:
  1.  Start with a concise summary paragraph that gives an overview of the key findings.
  2.  Follow the summary with a bulleted or numbered list detailing specific insights, trends, or potential issues you have identified.
  3.  For each point, provide a brief, actionable recommendation.
  4.  Write in clear, well-formed paragraphs. Do not use markdown formatting like asterisks for bolding (e.g., **text**). The structure of your response (paragraphs and lists) should provide the necessary emphasis.
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
