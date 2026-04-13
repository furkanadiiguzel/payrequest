import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import path from 'path';

config({ path: path.resolve(process.cwd(), '.env') });
config({ path: path.resolve(process.cwd(), '.env.local'), override: true });

interface CreateTestRequestParams {
  senderEmail: string;
  recipientEmail?: string;
  recipientPhone?: string;
  amountCents?: number;
  note?: string;
  status?: string;
  expiresAt?: string;
}

export async function createTestRequest(params: CreateTestRequestParams) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // Resolve sender_id from email
  const { data: senderProfile } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', params.senderEmail)
    .single();

  if (!senderProfile) throw new Error(`Profile not found for ${params.senderEmail}`);

  const now = new Date();
  const expiresAt =
    params.expiresAt ?? new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from('payment_requests')
    .insert({
      sender_id: senderProfile.id,
      recipient_email: params.recipientEmail ?? null,
      recipient_phone: params.recipientPhone ?? null,
      amount_cents: params.amountCents ?? 2500,
      note: params.note ?? null,
      status: params.status ?? 'pending',
      expires_at: expiresAt,
    })
    .select('*')
    .single();

  if (error) throw new Error(`createTestRequest failed: ${error.message}`);
  return data;
}
