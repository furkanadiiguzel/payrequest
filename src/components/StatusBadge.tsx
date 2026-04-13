import { Badge } from '@/components/ui/badge';
import { type PaymentRequestStatus } from '@/types/database';

interface StatusBadgeProps {
  status: PaymentRequestStatus;
}

const statusConfig: Record<
  PaymentRequestStatus,
  { label: string; className: string; strikethrough?: boolean }
> = {
  pending: {
    label: 'Pending',
    className: 'bg-amber-500/15 text-amber-300 hover:bg-amber-500/15 border-amber-500/20',
  },
  paid: {
    label: 'Paid',
    className: 'bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/15 border-emerald-500/20',
  },
  declined: {
    label: 'Declined',
    className: 'bg-red-500/15 text-red-300 hover:bg-red-500/15 border-red-500/20',
  },
  expired: {
    label: 'Expired',
    className: 'bg-slate-500/15 text-slate-400 hover:bg-slate-500/15 border-slate-500/20',
  },
  cancelled: {
    label: 'Cancelled',
    className: 'bg-slate-500/15 text-slate-400 hover:bg-slate-500/15 border-slate-500/20',
    strikethrough: true,
  },
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status];
  return (
    <Badge className={config.className} variant="secondary">
      <span className={config.strikethrough ? 'line-through' : undefined}>
        {config.label}
      </span>
    </Badge>
  );
}
