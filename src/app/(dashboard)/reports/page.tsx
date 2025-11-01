import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileDown, Users, CircleDollarSign, FileText } from "lucide-react";

const reportTypes = [
  {
    title: "Resident Masterlist",
    description: "Generate a complete list of all registered residents.",
    icon: Users,
  },
  {
    title: "Monthly Revenue Report",
    description: "Summary of revenues collected from document requests.",
    icon: CircleDollarSign,
  },
  {
    title: "Document Issuance Report",
    description: "Detailed report of all documents issued within a date range.",
    icon: FileText,
  },
];

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-headline tracking-tight">Reports & Analytics</h1>
        <p className="text-muted-foreground">
          Generate and export reports for barangay operations.
        </p>
      </div>
      
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
                <Button size="sm" className="w-full">
                  <FileDown className="mr-2 h-4 w-4" />
                  Export as PDF
                </Button>
                <Button size="sm" variant="outline" className="w-full">
                  <FileDown className="mr-2 h-4 w-4" />
                  Export as Excel
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
