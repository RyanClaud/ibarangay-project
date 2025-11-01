import { RequestForm } from "@/components/requests/request-form";
import { RequestHistory } from "@/components/requests/request-history";
import { documentRequests, residents } from "@/lib/data";

export default function RequestsPage() {
  // Simulating a logged-in resident
  const residentId = 'RES001';
  const residentRequests = documentRequests.filter(req => req.residentId === residentId);
  const residentInfo = residents.find(res => res.id === residentId);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline tracking-tight">Request a Document</h1>
        <p className="text-muted-foreground">
          Fill out the form below to request a new document. Your information will be auto-filled.
        </p>
      </div>
      
      <RequestForm resident={residentInfo} />

      <div className="pt-8">
        <h2 className="text-2xl font-bold font-headline tracking-tight">My Request History</h2>
        <p className="text-muted-foreground">
          Track the status of your document requests.
        </p>
      </div>
      
      <RequestHistory data={residentRequests} />
    </div>
  );
}
