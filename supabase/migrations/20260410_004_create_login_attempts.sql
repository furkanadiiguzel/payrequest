CREATE TABLE login_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  attempted_at timestamptz DEFAULT now(),
  success boolean NOT NULL
);

-- No RLS: this table is accessed exclusively via the service role client
CREATE INDEX idx_login_attempts_email_time ON login_attempts(email, attempted_at DESC);
