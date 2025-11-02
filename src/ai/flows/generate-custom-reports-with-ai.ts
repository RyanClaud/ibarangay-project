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
  residentData: z.string().describe('A JSON string of all resident data.'),
  documentRequestData: z.string().describe('A JSON string of all document request data.'),
});
export type GenerateCustomReportInput = z.infer<typeof GenerateCustomReportInputSchema>;

const GenerateCustomReportOutputSchema = z.object({
  reportSummary: z.string().describe('A brief summary of the report contents and key findings. This summary will be displayed to the user.'),
  reportData: z.object({
    title: z.string().describe('The main title for the report document.'),
    headers: z.array(z.string()).describe('An array of strings representing the column headers for the report table.'),
    rows: z.array(z.array(z.union([z.string(), z.number()]))).describe('An array of arrays, where each inner array represents a row of data corresponding to the headers.'),
  }).describe('The structured data for the report, which will be used to generate the final PDF or Excel file.'),
});
export type GenerateCustomReportOutput = z.infer<typeof GenerateCustomReportOutputSchema>;

export async function generateCustomReport(input: GenerateCustomReportInput): Promise<GenerateCustomReportOutput> {
  return generateCustomReportFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateCustomReportPrompt',
  input: {schema: GenerateCustomReportInputSchema},
  output: {schema: GenerateCustomReportOutputSchema},
  prompt: `You are an AI-powered data analyst for a local government unit. Your task is to generate structured data for a report based on the user's request and the provided JSON data.

  Report Title: {{{reportTitle}}}
  Report Parameters: {{{reportParameters}}}
  Report Description: {{{reportDescription}}}

  Use the following data to generate the report:
  Resident Data: {{{residentData}}}
  Document Request Data: {{{documentRequestData}}}

  Your goal is to extract, aggregate, and format the relevant information from the provided data sources into a structured format with a title, headers, and rows.
  Also, provide a brief summary of the key findings from your analysis.
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
