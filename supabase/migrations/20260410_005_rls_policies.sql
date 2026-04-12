-- payment_requests: SELECT (sender, recipient_id, or recipient_email match)
CREATE POLICY "pr_select" ON payment_requests FOR SELECT USING (
  sender_id = auth.uid()
  OR recipient_id = auth.uid()
  OR recipient_email = (SELECT email FROM profiles WHERE id = auth.uid())
);

-- payment_requests: INSERT (sender must be the authenticated user)
CREATE POLICY "pr_insert" ON payment_requests FOR INSERT
  WITH CHECK (sender_id = auth.uid());

-- payment_requests: UPDATE for sender cancellation only
CREATE POLICY "pr_sender_cancel" ON payment_requests FOR UPDATE
  USING (sender_id = auth.uid())
  WITH CHECK (status = 'cancelled');

-- payment_requests: UPDATE for recipient pay or decline
CREATE POLICY "pr_recipient_action" ON payment_requests FOR UPDATE
  USING (
    recipient_id = auth.uid()
    OR recipient_email = (SELECT email FROM profiles WHERE id = auth.uid())
  )
  WITH CHECK (status IN ('paid', 'declined'));

-- profiles: users can only read their own profile row
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT USING (id = auth.uid());
