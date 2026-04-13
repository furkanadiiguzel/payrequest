'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { type PaymentRequest } from '@/types/database';
import { centsToDollars } from '@/lib/currency';
import StatusBadge from '@/components/StatusBadge';
import ExpiryCountdown from '@/components/ExpiryCountdown';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { payRequest, declineRequest, cancelRequest } from '@/actions/requests';
import PaymentSuccessOverlay from './PaymentSuccessOverlay';

interface RequestDetailClientProps {
  request: PaymentRequest;
  viewerRole: 'sender' | 'recipient';
  senderEmail: string;
}

export default function RequestDetailClient({
  request,
  viewerRole,
  senderEmail,
}: RequestDetailClientProps) {
  const router = useRouter();
  const [isPaying, startPayTransition] = useTransition();
  const [showDeclineDialog, setShowDeclineDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [isActing, setIsActing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [successData, setSuccessData] = useState<{
    amountCents: number;
    senderEmail: string;
  } | null>(null);

  const counterparty =
    request.recipient_email ?? request.recipient_phone ?? 'Unknown';

  function handleCopyLink() {
    const url = `${window.location.origin}/request/${request.id}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handlePay() {
    startPayTransition(async () => {
      const result = await payRequest(request.id);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      setSuccessData({ amountCents: result.amountCents, senderEmail: result.senderEmail });
    });
  }

  async function handleDecline() {
    setIsActing(true);
    const result = await declineRequest(request.id);
    setIsActing(false);
    setShowDeclineDialog(false);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success('Request declined');
    router.push('/dashboard');
  }

  async function handleCancel() {
    setIsActing(true);
    const result = await cancelRequest(request.id);
    setIsActing(false);
    setShowCancelDialog(false);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success('Request cancelled');
    router.push('/dashboard');
  }

  function terminalTimestamp(): string | null {
    if (request.status === 'paid' && request.paid_at) {
      return `Paid ${formatDistanceToNow(new Date(request.paid_at), { addSuffix: true })}`;
    }
    if (request.status === 'declined' && request.declined_at) {
      return `Declined ${formatDistanceToNow(new Date(request.declined_at), { addSuffix: true })}`;
    }
    if (request.status === 'cancelled' && request.cancelled_at) {
      return `Cancelled ${formatDistanceToNow(new Date(request.cancelled_at), { addSuffix: true })}`;
    }
    if (request.status === 'expired') {
      return `Expired ${formatDistanceToNow(new Date(request.expires_at), { addSuffix: true })}`;
    }
    return null;
  }

  if (successData) {
    return (
      <PaymentSuccessOverlay
        amountCents={successData.amountCents}
        senderEmail={successData.senderEmail}
      />
    );
  }

  const termTs = terminalTimestamp();

  return (
    <div
      className="max-w-lg mx-auto space-y-4"
      style={{ animation: 'slide-in-up 0.3s ease-out both' }}
    >
      {/* Main card */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        {/* Amount header */}
        <div className="px-6 pt-8 pb-6 text-center border-b border-border">
          <p
            className="text-5xl font-bold text-foreground tabular-nums tracking-tight"
            data-testid="request-amount"
          >
            {centsToDollars(request.amount_cents)}
          </p>
          <div className="mt-3 flex justify-center" data-testid="request-status">
            <StatusBadge status={request.status} />
          </div>
        </div>

        {/* Details */}
        <div className="px-6 py-5 space-y-4">
          {request.note && (
            <div className="rounded-xl bg-muted/60 border border-border/60 px-4 py-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                Note
              </p>
              <p className="text-sm text-foreground leading-relaxed">{request.note}</p>
            </div>
          )}

          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
            <div>
              <dt className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">From</dt>
              <dd className="font-medium text-foreground truncate" title={senderEmail}>
                {senderEmail}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">To</dt>
              <dd className="font-medium text-foreground truncate" title={counterparty}>
                {counterparty}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">
                Created
              </dt>
              <dd className="text-foreground">
                {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
              </dd>
            </div>
            {request.status === 'pending' && (
              <div>
                <dt className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">
                  Expires
                </dt>
                <dd>
                  <ExpiryCountdown expiresAt={request.expires_at} />
                </dd>
              </div>
            )}
          </dl>

          {termTs && (
            <div className="pt-3 border-t border-border text-sm text-muted-foreground text-center">
              {termTs}
            </div>
          )}
        </div>
      </div>

      {/* Action card — pending only */}
      {request.status === 'pending' && (
        <div className="bg-card rounded-2xl border border-border p-4 space-y-3">
          {viewerRole === 'recipient' && (
            <>
              {/* Pay button */}
              <div className="relative">
                {!isPaying && (
                  <span
                    className="absolute inset-0 rounded-md bg-emerald-500/20"
                    style={{ animation: 'ring-expand 2s ease-out 1s infinite' }}
                  />
                )}
                <Button
                  className="w-full relative bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
                  disabled={isPaying}
                  onClick={handlePay}
                  data-testid="request-pay-button"
                >
                  {isPaying ? (
                    <span className="flex items-center gap-2">
                      <span className="inline-flex gap-1">
                        {[0, 1, 2].map((i) => (
                          <span
                            key={i}
                            className="w-1.5 h-1.5 rounded-full bg-white/80"
                            style={{
                              animation: `particle-float 0.8s ease-in-out ${i * 150}ms infinite`,
                            }}
                          />
                        ))}
                      </span>
                      Processing payment…
                    </span>
                  ) : (
                    'Pay ' + centsToDollars(request.amount_cents)
                  )}
                </Button>
              </div>
              <Button
                variant="outline"
                className="w-full text-destructive border-destructive/30 hover:bg-destructive/10 hover:border-destructive/50"
                onClick={() => setShowDeclineDialog(true)}
                data-testid="request-decline-button"
              >
                Decline
              </Button>
            </>
          )}

          {viewerRole === 'sender' && (
            <>
              <Button
                variant="outline"
                className="w-full transition-all"
                onClick={handleCopyLink}
                data-testid="copy-link-button"
              >
                {copied ? '✓ Copied!' : 'Copy Shareable Link'}
              </Button>
              <Button
                variant="outline"
                className="w-full text-destructive border-destructive/30 hover:bg-destructive/10 hover:border-destructive/50"
                onClick={() => setShowCancelDialog(true)}
                data-testid="request-cancel-button"
              >
                Cancel Request
              </Button>
            </>
          )}
        </div>
      )}

      {/* Sender can still copy link even on non-pending */}
      {request.status !== 'pending' && viewerRole === 'sender' && (
        <div className="bg-card rounded-2xl border border-border p-4">
          <Button
            variant="outline"
            className="w-full transition-all"
            onClick={handleCopyLink}
            data-testid="copy-link-button"
          >
            {copied ? '✓ Copied!' : 'Copy Link'}
          </Button>
        </div>
      )}

      {/* Decline dialog */}
      <Dialog open={showDeclineDialog} onOpenChange={setShowDeclineDialog}>
        <DialogContent data-testid="confirm-dialog">
          <DialogHeader>
            <DialogTitle>Decline this request?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            You&apos;re about to decline a request for{' '}
            <strong className="text-foreground">{centsToDollars(request.amount_cents)}</strong> from{' '}
            <strong className="text-foreground">{senderEmail}</strong>. This cannot be undone.
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeclineDialog(false)}
              data-testid="dialog-cancel"
            >
              Keep
            </Button>
            <Button
              variant="destructive"
              disabled={isActing}
              onClick={handleDecline}
              data-testid="dialog-confirm"
            >
              {isActing ? 'Declining…' : 'Decline'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent data-testid="confirm-dialog">
          <DialogHeader>
            <DialogTitle>Cancel this request?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This will cancel your{' '}
            <strong className="text-foreground">{centsToDollars(request.amount_cents)}</strong>{' '}
            request. The recipient will no longer be able to pay it.
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCancelDialog(false)}
              data-testid="dialog-cancel"
            >
              Keep
            </Button>
            <Button
              variant="destructive"
              disabled={isActing}
              onClick={handleCancel}
              data-testid="dialog-confirm"
            >
              {isActing ? 'Cancelling…' : 'Cancel Request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
