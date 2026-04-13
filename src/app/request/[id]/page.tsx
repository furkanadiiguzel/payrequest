import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { applyExpiryToRequest } from '@/lib/requests';
import { maskEmail } from '@/lib/mask';
import RequestDetailClient from './RequestDetailClient';
import Link from 'next/link';
import { centsToDollars } from '@/lib/currency';
import StatusBadge from '@/components/StatusBadge';
import ExpiryCountdown from '@/components/ExpiryCountdown';

interface RequestDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: RequestDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const service = createServiceClient();
  const { data: request } = await service
    .from('payment_requests')
    .select('amount_cents')
    .eq('id', id)
    .single();
  if (!request) return { title: 'Request Not Found' };
  return { title: `Request for ${centsToDollars(request.amount_cents)}` };
}

export default async function RequestDetailPage({ params }: RequestDetailPageProps) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // --- UNAUTHENTICATED: handled by T069, stub returns public view ---
  if (!user) {
    const service = createServiceClient();
    const { data: request } = await service
      .from('payment_requests')
      .select('*')
      .eq('id', id)
      .single();

    if (!request) notFound();

    const { data: senderProfile } = await service
      .from('profiles')
      .select('email')
      .eq('id', request.sender_id)
      .single();

    const effective = applyExpiryToRequest(request);
    const maskedEmail = maskEmail(senderProfile?.email ?? '');

    return (
      <div className="max-w-lg mx-auto space-y-4" style={{ animation: 'slide-in-up 0.3s ease-out both' }}>
        {effective.status === 'expired' && (
          <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 p-4 text-amber-400 text-sm font-medium flex items-center gap-2">
            <span>⚠</span> This request has expired and can no longer be paid
          </div>
        )}
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          {/* Amount hero */}
          <div className="px-6 pt-8 pb-6 text-center border-b border-border">
            <p className="text-5xl font-bold text-foreground tabular-nums tracking-tight" data-testid="request-amount">
              {centsToDollars(request.amount_cents)}
            </p>
            <div className="mt-3 flex justify-center">
              <StatusBadge status={effective.status} />
            </div>
          </div>

          {/* Details */}
          <div className="px-6 py-5 space-y-4">
            {request.note && (
              <div className="rounded-xl bg-muted/60 border border-border/60 px-4 py-3">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Note</p>
                <p className="text-sm text-foreground leading-relaxed">{request.note}</p>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">From</span>
              <span className="font-medium text-foreground">{maskedEmail}</span>
            </div>
            {effective.status === 'pending' && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Expires</span>
                <ExpiryCountdown expiresAt={request.expires_at} />
              </div>
            )}
          </div>
        </div>

        <div className="bg-card rounded-2xl border border-border p-5 space-y-3">
          <p className="text-xs text-muted-foreground text-center">
            Log in or sign up to respond to this request
          </p>
          <Link
            href={`/login?returnUrl=/request/${id}`}
            className="block w-full text-center rounded-lg bg-primary text-primary-foreground py-2.5 px-4 text-sm font-semibold hover:bg-primary/90 transition-colors"
            data-testid="login-to-respond-btn"
          >
            Log in to respond
          </Link>
          <Link
            href={`/signup?returnUrl=/request/${id}`}
            className="block w-full text-center rounded-lg border border-border text-foreground py-2.5 px-4 text-sm font-medium hover:bg-accent transition-colors"
            data-testid="signup-link"
          >
            Create an account
          </Link>
        </div>
      </div>
    );
  }

  // --- AUTHENTICATED ---
  const { data: request } = await supabase
    .from('payment_requests')
    .select('*')
    .eq('id', id)
    .single();

  if (!request) notFound();

  // Determine viewer role
  const userEmail = user.email?.toLowerCase() ?? '';
  let viewerRole: 'sender' | 'recipient';

  if (request.sender_id === user.id) {
    viewerRole = 'sender';
  } else if (
    request.recipient_id === user.id ||
    (request.recipient_email && request.recipient_email.toLowerCase() === userEmail)
  ) {
    viewerRole = 'recipient';
  } else {
    notFound();
  }

  const effective = applyExpiryToRequest(request);

  // Fetch sender email for recipient display
  const service = createServiceClient();
  const { data: senderProfile } = await service
    .from('profiles')
    .select('email')
    .eq('id', request.sender_id)
    .single();

  return (
    <RequestDetailClient
      request={effective}
      viewerRole={viewerRole}
      senderEmail={senderProfile?.email ?? ''}
    />
  );
}
