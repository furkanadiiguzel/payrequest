import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { applyExpiryToRequest } from '@/lib/requests';
import { maskEmail } from '@/lib/mask';
import RequestDetailClient from './RequestDetailClient';
import Link from 'next/link';
import { centsToDollars } from '@/lib/currency';
import StatusBadge from '@/components/StatusBadge';

interface RequestDetailPageProps {
  params: Promise<{ id: string }>;
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
      <div className="max-w-lg mx-auto space-y-4">
        {effective.status === 'expired' && (
          <div className="rounded-md bg-amber-50 border border-amber-200 p-4 text-amber-800 text-sm font-medium">
            This request has expired
          </div>
        )}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <div className="text-center">
            <p className="text-4xl font-bold text-gray-900">{centsToDollars(request.amount_cents)}</p>
            <div className="mt-2">
              <StatusBadge status={effective.status} />
            </div>
          </div>
          {request.note && (
            <div className="rounded-md bg-gray-50 p-3">
              <p className="text-sm text-gray-700">{request.note}</p>
            </div>
          )}
          <p className="text-sm text-gray-500">
            From: <span className="font-medium text-gray-700">{maskedEmail}</span>
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-3">
          <Link
            href={`/login?returnUrl=/request/${id}`}
            className="block w-full text-center rounded-md bg-indigo-600 text-white py-2 px-4 text-sm font-medium hover:bg-indigo-500"
            data-testid="login-to-respond-btn"
          >
            Log in to respond
          </Link>
          <Link
            href={`/signup?returnUrl=/request/${id}`}
            className="block w-full text-center rounded-md border border-gray-300 text-gray-700 py-2 px-4 text-sm font-medium hover:bg-gray-50"
            data-testid="signup-link"
          >
            Sign up
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
