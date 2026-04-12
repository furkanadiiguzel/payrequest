import { createClient } from '@/lib/supabase/server';
import { fetchSentRequests, fetchReceivedRequests } from '@/lib/requests';
import DashboardTabs from './DashboardTabs';

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const [sent, received] = await Promise.all([
    fetchSentRequests(user.id),
    fetchReceivedRequests(user.email ?? ''),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Dashboard</h1>
      <DashboardTabs sentRequests={sent} receivedRequests={received} />
    </div>
  );
}
