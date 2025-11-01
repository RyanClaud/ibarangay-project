'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAppContext } from "@/contexts/app-context";
import { exportResidentMasterlist, exportMonthlyRevenue, exportDocumentIssuance } from "@/lib/reports";
import { FileDown, Users, CircleDollarSign, FileText, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

type ReportType = "residentMasterlist" | "monthlyRevenue" | "documentIssuance";

const reportTypes: {
  id: ReportType;
  title: string;
  description: string;
  icon: React.ElementType;
  handler: (format: 'pdf' | 'excel', data: any) => void;
}[] = [
  {
    id: "residentMasterlist",
    title: "Resident Masterlist",
    description: "Generate a complete list of all registered residents.",
    icon: Users,
    handler: (format, data) => exportResidentMasterlist(format, data),
  },
  {
    id: "monthlyRevenue",
    title: "Monthly Revenue Report",
    description: "Summary of revenues collected from document requests.",
    icon: CircleDollarSign,
    handler: (format, data) => exportMonthlyRevenue(format, data),
  },
  {
    id: "documentIssuance",
    title: "Document Issuance Report",
    description: "Detailed report of all documents issued within a date range.",
    icon: FileText,
    handler: (format, data) => exportDocumentIssuance(format, data),
  },
];

export default function ReportsPage() {
  const { residents, documentRequests, isDataLoading } = useAppContext();

  const handleExport = (reportId: ReportType, format: 'pdf' | 'excel') => {
    if (isDataLoading) {
        toast({
            title: "Please wait",
            description: "Data is still loading. Try again in a moment.",
            variant: "destructive"
        });
        return;
    }
    
    const report = reportTypes.find(r => r.id === reportId);
    if (!report) return;

    let data;
    switch(reportId) {
        case 'residentMasterlist':
            data = residents;
            break;
        case 'monthlyRevenue':
        case 'documentIssuance':
            data = documentRequests;
            break;
        default:
            data = [];
    }

    if (!data || data.length === 0) {
        toast({
            title: "No Data",
            description: "There is no data available to generate this report.",
        });
        return;
    }

    try {
        report.handler(format, data);
        toast({
            title: "Report Generated",
            description: `Your ${report.title} has been downloaded.`,
        });
    } catch(error) {
        console.error("Report generation failed:", error);
        toast({
            title: "Export Failed",
            description: "Something went wrong while generating the report.",
            variant: "destructive"
        });
    }
  };


  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-headline tracking-tight">Reports &amp; Analytics</h1>
        <p className="text-muted-foreground">
          Generate and export reports for barangay operations.
        </p>
      </div>
      
      {isDataLoading ? (
         <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
         </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {reportTypes.map((report) => (
            <Card key={report.title} className="fade-in transition-all hover:shadow-lg hover:-translate-y-1">
              <CardHeader className="flex flex-row items-start gap-4 space-y-0">
                <div className="p-3 bg-primary/10 rounded-full">
                  <report.icon className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <CardTitle>{report.title}</CardTitle>
                  <CardDescription className="mt-1">
                    {report.description}
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Button size="sm" className="w-full" onClick={() => handleExport(report.id, 'pdf')}>
                    <FileDown className="mr-2 h-4 w-4" />
                    Export as PDF
                  </Button>
                  <Button size="sm" variant="outline" className="w-full" onClick={() => handleExport(report.id, 'excel')}>
                    <FileDown className="mr-2 h-4 w-4" />
                    Export as Excel
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
