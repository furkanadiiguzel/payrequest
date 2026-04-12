'use client';

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { format, formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { type PaymentRequest } from '@/types/database';
import { centsToDollars } from '@/lib/currency';
import StatusBadge from '@/components/StatusBadge';
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
  const [successData, setSuccessData] = useState<{
    amountCents: number;
    senderEmail: string;
  } | null>(null);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);

  const counterparty =
    request.recipient_email ?? request.recipient_phone ?? 'Unknown';

  function handleCopyLink() {
    const url = `${window.location.origin}/request/${request.id}`;
    navigator.clipboard.writeText(url);
    toast.success('Link copied!');
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
    router.push('/dashboard');
  }

  function terminalTimestamp() {
    if (request.status === 'paid' && request.paid_at) {
      return `Paid on ${format(new Date(request.paid_at), 'MMMM d, yyyy')}`;
    }
    if (request.status === 'declined' && request.declined_at) {
      return `Declined on ${format(new Date(request.declined_at), 'MMMM d, yyyy')}`;
    }
    if (request.status === 'cancelled' && request.cancelled_at) {
      return `Cancelled on ${format(new Date(request.cancelled_at), 'MMMM d, yyyy')}`;
    }
    if (request.status === 'expired') {
      return `This request expired on ${format(new Date(request.expires_at), 'MMMM d, yyyy')}`;
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

  return (
    <div className="max-w-lg mx-auto space-y-4">
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <div className="text-center">
          <p className="text-4xl font-bold text-gray-900" data-testid="request-amount">
            {centsToDollars(request.amount_cents)}
          </p>
          <div className="mt-2" data-testid="request-status">
            <StatusBadge status={request.status} />
          </div>
        </div>

        {request.note && (
          <div className="rounded-md bg-gray-50 p-3">
            <p className="text-sm text-gray-700">{request.note}</p>
          </div>
        )}

        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-gray-500">From</dt>
            <dd className="font-medium text-gray-900">{senderEmail}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">To</dt>
            <dd className="font-medium text-gray-900">{counterparty}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">Created</dt>
            <dd className="text-gray-700">
              {format(new Date(request.created_at), 'MMM d, yyyy')}
            </dd>
          </div>
          {request.status === 'pending' && (
            <div className="flex justify-between">
              <dt className="text-gray-500">Expires</dt>
              <dd className="text-amber-600 font-medium">
                {formatDistanceToNow(new Date(request.expires_at), { addSuffix: true })}
              </dd>
            </div>
          )}
        </dl>

        {terminalTimestamp() && (
          <p className="text-sm text-gray-500 text-center pt-2 border-t border-gray-100">
            {terminalTimestamp()}
          </p>
        )}
      </div>

      {/* Action buttons — pending only */}
      {request.status === 'pending' && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
          {viewerRole === 'recipient' && (
            <>
              <Button
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white"
                disabled={isPaying}
                onClick={handlePay}
                data-testid="pay-button"
              >
                {isPaying ? 'Processing…' : 'Pay'}
              </Button>
              <Button
                variant="outline"
                className="w-full text-red-600 border-red-300 hover:bg-red-50"
                onClick={() => setShowDeclineDialog(true)}
                data-testid="decline-button"
              >
                Decline
              </Button>
            </>
          )}

          {viewerRole === 'sender' && (
            <>
              <Button
                variant="outline"
                className="w-full text-red-600 border-red-300 hover:bg-red-50"
                onClick={() => setShowCancelDialog(true)}
                data-testid="cancel-button"
              >
                Cancel Request
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={handleCopyLink}
                data-testid="copy-link-button"
              >
                Copy Link
              </Button>
            </>
          )}
        </div>
      )}

      {/* Decline confirmation dialog */}
      <Dialog open={showDeclineDialog} onOpenChange={setShowDeclineDialog}>
        <DialogContent data-testid="confirm-dialog">
          <DialogHeader>
            <DialogTitle>Decline request?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600">
            Are you sure you want to decline this request for{' '}
            <strong>{centsToDollars(request.amount_cents)}</strong> from{' '}
            <strong>{senderEmail}</strong>?
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeclineDialog(false)} data-testid="dialog-cancel">
              Cancel
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

      {/* Cancel confirmation dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent data-testid="confirm-dialog">
          <DialogHeader>
            <DialogTitle>Cancel request?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600">
            Are you sure you want to cancel this request?
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancelDialog(false)} data-testid="dialog-cancel">
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
