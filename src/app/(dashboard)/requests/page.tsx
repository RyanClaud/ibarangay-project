import { redirect } from 'next/navigation';

export default function RequestsPage() {
  // This page's content is now on the resident dashboard.
  // We redirect to the dashboard to avoid duplication.
  redirect('/dashboard');
}
