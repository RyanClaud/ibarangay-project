import { documentRequests } from "@/lib/data";
import { PaymentsClientPage } from "@/components/payments/payments-client-page";

export default function PaymentsPage() {
  const pendingPayments = documentRequests.filter(req => req.status === 'Approved');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-headline tracking-tight">Payment Tracking</h1>
        <p className="text-muted-foreground">
          Confirm payments for approved document requests.
        </p>
      </div>
      <PaymentsClientPage data={pendingPayments} />
    </div>
  );
}
