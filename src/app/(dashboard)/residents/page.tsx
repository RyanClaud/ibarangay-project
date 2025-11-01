import { residents } from "@/lib/data";
import type { Resident } from "@/lib/types";
import { ResidentClientPage } from "@/components/residents/resident-client-page";

export default function ResidentsPage() {
  const data: Resident[] = residents;
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-headline tracking-tight">Resident Management</h1>
        <p className="text-muted-foreground">
          View, add, and manage resident profiles in your barangay.
        </p>
      </div>
      <ResidentClientPage data={data} />
    </div>
  )
}
