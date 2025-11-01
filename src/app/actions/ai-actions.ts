'use server';

import { generateInsights } from '@/ai/flows/generate-insights-from-barangay-data';
import { generateCustomReport } from '@/ai/flows/generate-custom-reports-with-ai';
import type { GenerateCustomReportInput } from '@/ai/flows/generate-custom-reports-with-ai';

// This server action calls the AI flow to generate insights from barangay data.
export async function generateInsightsAction(residentData: string, documentRequestData: string) {

  const result = await generateInsights({
    residentData,
    documentRequestData,
    parameters: 'Focus on population age groups and most requested documents.',
  });

  return result;
}

// This server action calls the AI flow to generate a custom report.
export async function generateCustomReportAction(input: GenerateCustomReportInput) {
  const result = await generateCustomReport(input);
  return result;
}
