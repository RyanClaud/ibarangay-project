'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { generateInsightsAction, generateCustomReportAction } from '@/app/actions/ai-actions';
import { Loader2, Sparkles } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const customReportSchema = z.object({
  reportTitle: z.string().min(5, 'Title must be at least 5 characters long.'),
  reportParameters: z.string().optional(),
  reportDescription: z.string().min(20, 'Description must be at least 20 characters long.'),
  reportFormat: z.enum(['PDF', 'Excel']),
});

export default function InsightsPage() {
  const [insights, setInsights] = useState<string | null>(null);
  const [reportSummary, setReportSummary] = useState<string | null>(null);
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  const form = useForm<z.infer<typeof customReportSchema>>({
    resolver: zodResolver(customReportSchema),
    defaultValues: {
      reportTitle: '',
      reportParameters: '{}',
      reportDescription: '',
      reportFormat: 'PDF',
    },
  });

  const handleGenerateInsights = async () => {
    setIsGeneratingInsights(true);
    setInsights(null);
    try {
      const result = await generateInsightsAction();
      setInsights(result.insights);
      toast({ title: 'Insights Generated Successfully' });
    } catch (error) {
      console.error(error);
      toast({ title: 'Error Generating Insights', variant: 'destructive' });
    } finally {
      setIsGeneratingInsights(false);
    }
  };

  const onCustomReportSubmit = async (values: z.infer<typeof customReportSchema>) => {
    setIsGeneratingReport(true);
    setReportSummary(null);
    try {
      const result = await generateCustomReportAction(values);
      setReportSummary(result.reportSummary);
      toast({ title: 'Custom Report Generated Successfully' });
    } catch (error) {
      console.error(error);
      toast({ title: 'Error Generating Custom Report', variant: 'destructive' });
    } finally {
      setIsGeneratingReport(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-headline tracking-tight">AI-Powered Insights</h1>
        <p className="text-muted-foreground">Leverage AI to analyze data and generate custom reports.</p>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <Card className="fade-in">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Sparkles className="text-primary" />Barangay Data Analysis</CardTitle>
            <CardDescription>Click the button to generate AI-powered insights on resident demographics and document request patterns.</CardDescription>
          </CardHeader>
          <CardContent className="min-h-[200px]">
            {isGeneratingInsights ? (
              <div className="space-y-4">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ) : insights ? (
              <div className="prose prose-sm max-w-none text-foreground">{insights}</div>
            ) : (
                <div className="text-center text-muted-foreground p-8">Click "Generate Insights" to see AI analysis.</div>
            )}
          </CardContent>
          <CardFooter>
            <Button onClick={handleGenerateInsights} disabled={isGeneratingInsights}>
              {isGeneratingInsights ? <Loader2 className="animate-spin" /> : <Sparkles />}
              {isGeneratingInsights ? 'Generating...' : 'Generate Insights'}
            </Button>
          </CardFooter>
        </Card>

        <Card className="fade-in">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onCustomReportSubmit)}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Sparkles className="text-primary" />Custom Report Generator</CardTitle>
                <CardDescription>Define parameters to generate a custom report with AI.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField control={form.control} name="reportTitle" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Report Title</FormLabel>
                    <FormControl><Input placeholder="e.g., Q3 Document Issuance Analysis" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="reportDescription" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Report Description</FormLabel>
                    <FormControl><Textarea placeholder="Describe the report you need..." {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="reportFormat" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Format</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent><SelectItem value="PDF">PDF</SelectItem><SelectItem value="Excel">Excel</SelectItem></SelectContent>
                    </Select>
                  </FormItem>
                )} />
                {reportSummary && (
                   <div className="prose prose-sm max-w-none text-foreground border-t pt-4">{reportSummary}</div>
                )}
                 {isGeneratingReport && (
                    <div className="space-y-2 pt-4 border-t">
                        <Skeleton className="h-4 w-1/4" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                    </div>
                )}
              </CardContent>
              <CardFooter>
                <Button type="submit" disabled={isGeneratingReport}>
                  {isGeneratingReport ? <Loader2 className="animate-spin" /> : <Sparkles />}
                  {isGeneratingReport ? 'Generating...' : 'Generate Report'}
                </Button>
              </CardFooter>
            </form>
          </Form>
        </Card>
      </div>
    </div>
  );
}
