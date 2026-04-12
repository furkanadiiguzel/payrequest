export type PaymentRequestStatus =
  | 'pending'
  | 'paid'
  | 'declined'
  | 'cancelled'
  | 'expired';

export interface Profile {
  id: string;
  email: string;
  phone: string | null;
  display_name: string | null;
  created_at: string;
}

export interface PaymentRequest {
  id: string;
  sender_id: string;
  recipient_email: string | null;
  recipient_phone: string | null;
  recipient_id: string | null;
  amount_cents: number;
  note: string | null;
  status: PaymentRequestStatus;
  created_at: string;
  expires_at: string;
  paid_at: string | null;
  declined_at: string | null;
  cancelled_at: string | null;
}

export interface AuditLog {
  id: string;
  event_type: string;
  actor_id: string | null;
  actor_email: string | null;
  target_id: string | null;
  previous_value: string | null;
  new_value: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface LoginAttempt {
  id: string;
  email: string;
  attempted_at: string;
  success: boolean;
}
