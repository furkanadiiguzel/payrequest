'use client';

import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import StatusBadge from '@/components/StatusBadge';
import { centsToDollars } from '@/lib/currency';
import { type PaymentRequest } from '@/types/database';

interface RequestCardProps {
  request: PaymentRequest;
}

const statusAccent: Record<string, string> = {
  pending:   'bg-amber-500/70',
  paid:      'bg-emerald-500/70',
  declined:  'bg-red-500/70',
  expired:   'bg-slate-500/40',
  cancelled: 'bg-slate-500/40',
};

export default function RequestCard({ request }: RequestCardProps) {
  const router = useRouter();
  const counterparty =
    request.recipient_email ?? request.recipient_phone ?? 'Unknown';
  const notePreview = request.note
    ? request.note.length > 60
      ? `${request.note.slice(0, 60)}…`
      : request.note
    : null;
  const accent = statusAccent[request.status] ?? 'bg-border';

  return (
    <div
      className="group relative bg-card rounded-xl border border-border cursor-pointer transition-all duration-200 hover:border-primary/40 hover:shadow-[0_0_16px_oklch(0.61_0.22_264_/_0.12)] overflow-hidden"
      onClick={() => router.push(`/request/${request.id}`)}
      data-testid="request-card"
    >
      {/* Left accent bar */}
      <div className={`absolute left-0 top-0 bottom-0 w-0.5 ${accent}`} />

      <div className="px-5 py-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1 ml-2">
            <p
              className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors"
              data-testid="card-counterparty"
            >
              {counterparty}
            </p>
            {notePreview && (
              <p className="text-xs text-muted-foreground mt-0.5 truncate">{notePreview}</p>
            )}
          </div>
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <span
              className="text-sm font-bold text-foreground tabular-nums"
              data-testid="card-amount"
            >
              {centsToDollars(request.amount_cents)}
            </span>
            <StatusBadge status={request.status} />
          </div>
        </div>
        <p className="text-xs text-muted-foreground/60 mt-2.5 ml-2">
          {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
        </p>
      </div>
    </div>
  );
}
