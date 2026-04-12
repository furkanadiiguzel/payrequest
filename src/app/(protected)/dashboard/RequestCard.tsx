'use client';

import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import StatusBadge from '@/components/StatusBadge';
import { centsToDollars } from '@/lib/currency';
import { type PaymentRequest } from '@/types/database';

interface RequestCardProps {
  request: PaymentRequest;
}

export default function RequestCard({ request }: RequestCardProps) {
  const router = useRouter();
  const counterparty =
    request.recipient_email ?? request.recipient_phone ?? 'Unknown';
  const notePreview = request.note
    ? request.note.length > 50
      ? `${request.note.slice(0, 50)}…`
      : request.note
    : null;

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => router.push(`/request/${request.id}`)}
      data-testid="request-card"
    >
      <CardContent className="py-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-gray-900 truncate" data-testid="card-counterparty">
              {counterparty}
            </p>
            {notePreview && (
              <p className="text-xs text-gray-500 mt-0.5 truncate">{notePreview}</p>
            )}
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <span className="text-sm font-semibold text-gray-900" data-testid="card-amount">
              {centsToDollars(request.amount_cents)}
            </span>
            <StatusBadge status={request.status} />
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
        </p>
      </CardContent>
    </Card>
  );
}
