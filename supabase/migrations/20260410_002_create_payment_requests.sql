CREATE TABLE payment_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL REFERENCES profiles(id),
  recipient_email text,
  recipient_phone text,
  recipient_id uuid REFERENCES profiles(id),
  amount_cents integer NOT NULL CHECK (amount_cents > 0 AND amount_cents <= 1000000),
  note text CHECK (char_length(note) <= 280),
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'paid', 'declined', 'cancelled', 'expired')),
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT now() + interval '7 days',
  paid_at timestamptz,
  declined_at timestamptz,
  cancelled_at timestamptz
);

ALTER TABLE payment_requests ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_pr_sender ON payment_requests(sender_id);
CREATE INDEX idx_pr_recipient_email ON payment_requests(recipient_email);
CREATE INDEX idx_pr_status ON payment_requests(status);
CREATE INDEX idx_pr_expires ON payment_requests(expires_at) WHERE status = 'pending';
