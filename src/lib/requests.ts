import { type PaymentRequest } from '@/types/database';
import { createClient } from '@/lib/supabase/server';

export function applyExpiryToRequest(r: PaymentRequest): PaymentRequest {
  if (r.status === 'pending' && r.expires_at && new Date(r.expires_at) < new Date()) {
    return { ...r, status: 'expired' };
  }
  return r;
}

export async function fetchSentRequests(userId: string): Promise<PaymentRequest[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('payment_requests')
    .select('*')
    .eq('sender_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) throw error;
  return (data ?? []).map(applyExpiryToRequest);
}

export async function fetchReceivedRequests(userEmail: string): Promise<PaymentRequest[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('payment_requests')
    .select('*')
    .ilike('recipient_email', userEmail)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) throw error;
  return (data ?? []).map(applyExpiryToRequest);
}
