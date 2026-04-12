'use server';

import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { writeAuditLog } from '@/lib/audit';
import { applyExpiryToRequest } from '@/lib/requests';
import { normalizePhone } from '@/lib/phone';
import { isEmail } from '@/lib/validations/helpers';

export async function createRequest(
  formData: FormData
): Promise<{ success: true; requestId: string } | { success: false; error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: 'Unauthorized' };

  const rawRecipient = (formData.get('recipient') as string)?.trim();
  const rawAmount = (formData.get('amount') as string)?.trim();
  const rawNote = (formData.get('note') as string)?.trim() || null;

  // Validate recipient
  let recipientEmail: string | null = null;
  let recipientPhone: string | null = null;

  if (isEmail(rawRecipient)) {
    recipientEmail = rawRecipient.toLowerCase();
  } else {
    const phone = normalizePhone(rawRecipient);
    if (phone) {
      recipientPhone = phone;
    } else {
      return { success: false, error: 'Please enter a valid email address or US phone number' };
    }
  }

  // Self-request guard
  if (recipientEmail && recipientEmail === user.email?.toLowerCase()) {
    return { success: false, error: 'You cannot request money from yourself' };
  }

  // Validate amount
  if (!/^\d+(\.\d{1,2})?$/.test(rawAmount)) {
    return { success: false, error: 'Amount can have at most 2 decimal places' };
  }
  const amountCents = Math.round(parseFloat(rawAmount) * 100);
  if (amountCents < 1) return { success: false, error: 'Amount must be greater than $0.00' };
  if (amountCents > 1_000_000) return { success: false, error: 'Amount cannot exceed $10,000.00' };

  // Validate note
  if (rawNote && rawNote.length > 280) {
    return { success: false, error: 'Note cannot exceed 280 characters' };
  }

  const { data, error } = await supabase.from('payment_requests').insert({
    sender_id: user.id,
    recipient_email: recipientEmail,
    recipient_phone: recipientPhone,
    amount_cents: amountCents,
    note: rawNote,
  }).select('id').single();

  if (error || !data) {
    return { success: false, error: 'Failed to create request. Please try again.' };
  }

  return { success: true, requestId: data.id };
}

export async function payRequest(
  requestId: string
): Promise<{ success: true; amountCents: number; senderEmail: string } | { success: false; error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  const service = createServiceClient();
  const { data: request } = await service
    .from('payment_requests')
    .select('*')
    .eq('id', requestId)
    .single();

  if (!request) return { success: false, error: 'Request not found' };

  const effective = applyExpiryToRequest(request);
  if (effective.status === 'expired') {
    await service
      .from('payment_requests')
      .update({ status: 'expired' })
      .eq('id', requestId);
    await writeAuditLog({
      event_type: 'status_transition',
      actor_id: user.id,
      actor_email: user.email,
      target_id: requestId,
      previous_value: 'pending',
      new_value: 'expired',
    });
    return { success: false, error: 'This request has expired' };
  }

  if (request.status !== 'pending') {
    return { success: false, error: 'Request is not pending' };
  }

  // Verify recipient
  const isRecipient =
    request.recipient_id === user.id ||
    (request.recipient_email &&
      request.recipient_email.toLowerCase() === user.email?.toLowerCase());
  if (!isRecipient) return { success: false, error: 'Unauthorized' };

  // Simulated payment delay
  await new Promise((r) => setTimeout(r, 2000 + Math.random() * 1000));

  await service
    .from('payment_requests')
    .update({ status: 'paid', paid_at: new Date().toISOString() })
    .eq('id', requestId);

  await writeAuditLog({
    event_type: 'status_transition',
    actor_id: user.id,
    actor_email: user.email,
    target_id: requestId,
    previous_value: 'pending',
    new_value: 'paid',
  });

  // Fetch sender email for overlay
  const { data: senderProfile } = await service
    .from('profiles')
    .select('email')
    .eq('id', request.sender_id)
    .single();

  return {
    success: true,
    amountCents: request.amount_cents,
    senderEmail: senderProfile?.email ?? '',
  };
}

export async function declineRequest(
  requestId: string
): Promise<{ success: true } | { success: false; error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  const service = createServiceClient();
  const { data: request } = await service
    .from('payment_requests')
    .select('*')
    .eq('id', requestId)
    .single();

  if (!request) return { success: false, error: 'Request not found' };

  const effective = applyExpiryToRequest(request);
  if (effective.status === 'expired') {
    await service
      .from('payment_requests')
      .update({ status: 'expired' })
      .eq('id', requestId);
    await writeAuditLog({
      event_type: 'status_transition',
      actor_id: user.id,
      actor_email: user.email,
      target_id: requestId,
      previous_value: 'pending',
      new_value: 'expired',
    });
    return { success: false, error: 'This request has expired' };
  }

  if (request.status !== 'pending') return { success: false, error: 'Request is not pending' };

  const isRecipient =
    request.recipient_id === user.id ||
    (request.recipient_email &&
      request.recipient_email.toLowerCase() === user.email?.toLowerCase());
  if (!isRecipient) return { success: false, error: 'Unauthorized' };

  await service
    .from('payment_requests')
    .update({ status: 'declined', declined_at: new Date().toISOString() })
    .eq('id', requestId);

  await writeAuditLog({
    event_type: 'status_transition',
    actor_id: user.id,
    actor_email: user.email,
    target_id: requestId,
    previous_value: 'pending',
    new_value: 'declined',
  });

  return { success: true };
}

export async function cancelRequest(
  requestId: string
): Promise<{ success: true } | { success: false; error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  const service = createServiceClient();
  const { data: request } = await service
    .from('payment_requests')
    .select('*')
    .eq('id', requestId)
    .single();

  if (!request) return { success: false, error: 'Request not found' };

  const effective = applyExpiryToRequest(request);
  if (effective.status === 'expired') {
    await service
      .from('payment_requests')
      .update({ status: 'expired' })
      .eq('id', requestId);
    await writeAuditLog({
      event_type: 'status_transition',
      actor_id: user.id,
      actor_email: user.email,
      target_id: requestId,
      previous_value: 'pending',
      new_value: 'expired',
    });
    return { success: false, error: 'This request has expired' };
  }

  if (request.status !== 'pending') return { success: false, error: 'Request is not pending' };

  if (request.sender_id !== user.id) return { success: false, error: 'Unauthorized' };

  await service
    .from('payment_requests')
    .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
    .eq('id', requestId);

  await writeAuditLog({
    event_type: 'status_transition',
    actor_id: user.id,
    actor_email: user.email,
    target_id: requestId,
    previous_value: 'pending',
    new_value: 'cancelled',
  });

  return { success: true };
}
