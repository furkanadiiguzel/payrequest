import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = { title: 'Dashboard' };
import { fetchSentRequests, fetchReceivedRequests } from '@/lib/requests';
import { centsToDollars } from '@/lib/currency';
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

  const pendingSent = sent.filter((r) => r.status === 'pending');
  const pendingReceived = received.filter((r) => r.status === 'pending');
  const totalPendingSentCents = pendingSent.reduce((s, r) => s + r.amount_cents, 0);
  const totalPendingReceivedCents = pendingReceived.reduce((s, r) => s + r.amount_cents, 0);

  return (
    <div style={{ animation: 'slide-in-up 0.35s ease-out both' }}>
      {/* Stats bar */}
      <div className="grid grid-cols-2 gap-4 mb-8 sm:grid-cols-4">
        <StatCard
          label="Pending sent"
          value={String(pendingSent.length)}
          sub={pendingSent.length > 0 ? centsToDollars(totalPendingSentCents) : undefined}
          accent="indigo"
        />
        <StatCard
          label="Pending received"
          value={String(pendingReceived.length)}
          sub={pendingReceived.length > 0 ? centsToDollars(totalPendingReceivedCents) : undefined}
          accent="emerald"
        />
        <StatCard
          label="Total sent"
          value={String(sent.length)}
          sub="all time"
          accent="muted"
        />
        <StatCard
          label="Total received"
          value={String(received.length)}
          sub="all time"
          accent="muted"
        />
      </div>

      <DashboardTabs sentRequests={sent} receivedRequests={received} />
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  accent: 'indigo' | 'emerald' | 'muted';
}) {
  const accentBar =
    accent === 'indigo'
      ? 'bg-primary/60'
      : accent === 'emerald'
      ? 'bg-emerald-500/60'
      : 'bg-border';

  return (
    <div className="relative bg-card rounded-xl border border-border p-4 overflow-hidden">
      <div className={`absolute top-0 left-0 right-0 h-0.5 ${accentBar}`} />
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
      {sub && <p className="text-xs text-primary mt-1 font-medium">{sub}</p>}
    </div>
  );
}
