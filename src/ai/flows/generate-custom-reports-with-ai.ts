'use server';
/**
 * @fileOverview An AI agent to generate custom reports based on specific parameters.
 *
 * - generateCustomReport - A function that generates a custom report based on parameters.
 * - GenerateCustomReportInput - The input type for the generateCustomReport function.
 * - GenerateCustomReportOutput - The return type for the generateCustomReport function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateCustomReportInputSchema = z.object({
  reportTitle: z.string().describe('The title of the report.'),
  reportParameters: z.string().describe('Specific parameters to include in the report, such as date ranges, resident demographics, document types, payment status, etc.  Should be a well-formed JSON object.'),
  reportDescription: z.string().describe('A detailed description of the report requirements and data to be analyzed.'),
  reportFormat: z.enum(['PDF', 'Excel']).describe('The desired format for the report (PDF or Excel).'),
});
export type GenerateCustomReportInput = z.infer<typeof GenerateCustomReportInputSchema>;

const GenerateCustomReportOutputSchema = z.object({
  report: z.string().describe('The generated report in the specified format, as a base64 encoded string.'),
  reportSummary: z.string().describe('A brief summary of the report contents and key findings.'),
});
export type GenerateCustomReportOutput = z.infer<typeof GenerateCustomReportOutputSchema>;

export async function generateCustomReport(input: GenerateCustomReportInput): Promise<GenerateCustomReportOutput> {
  return generateCustomReportFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateCustomReportPrompt',
  input: {schema: GenerateCustomReportInputSchema},
  output: {schema: GenerateCustomReportOutputSchema},
  prompt: `You are an AI-powered report generator. Based on the provided parameters and description, create a comprehensive report in the specified format.

  Report Title: {{{reportTitle}}}
  Report Parameters: {{{reportParameters}}}
  Report Description: {{{reportDescription}}}
  Report Format: {{{reportFormat}}}

  Ensure the report includes all relevant data and insights as described.  The report should be returned as a base64 encoded string. Also, generate a brief summary of the report contents and key findings.
  Follow these formatting instructions:
  - If format is PDF, ensure the report can be converted into PDF format.
  - If format is Excel, ensure the report is formatted as a spreadsheet and can be saved as a .xlsx file.
  `,
});

const generateCustomReportFlow = ai.defineFlow(
  {
    name: 'generateCustomReportFlow',
    inputSchema: GenerateCustomReportInputSchema,
    outputSchema: GenerateCustomReportOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
