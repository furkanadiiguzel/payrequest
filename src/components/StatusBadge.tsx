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
    className: 'bg-amber-100 text-amber-800 hover:bg-amber-100',
  },
  paid: {
    label: 'Paid',
    className: 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100',
  },
  declined: {
    label: 'Declined',
    className: 'bg-red-100 text-red-800 hover:bg-red-100',
  },
  expired: {
    label: 'Expired',
    className: 'bg-slate-100 text-slate-600 hover:bg-slate-100',
  },
  cancelled: {
    label: 'Cancelled',
    className: 'bg-slate-100 text-slate-600 hover:bg-slate-100',
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
