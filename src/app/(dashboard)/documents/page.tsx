import { DocumentRequestClientPage } from "@/components/documents/document-request-client-page";

export default function DocumentsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-headline tracking-tight">Document Verification</h1>
        <p className="text-muted-foreground">
          Review, approve, or reject document requests from residents.
        </p>
      </div>
      <DocumentRequestClientPage />
    </div>
  )
}
