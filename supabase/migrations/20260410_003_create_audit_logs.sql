CREATE TABLE audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  actor_id uuid,
  actor_email text,
  target_id uuid,
  previous_value text,
  new_value text,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- INSERT allowed for authenticated users and service role; NO UPDATE or DELETE granted
CREATE POLICY "audit_logs_insert" ON audit_logs
  FOR INSERT WITH CHECK (true);
