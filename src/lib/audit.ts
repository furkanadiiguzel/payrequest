// SERVER ONLY — uses service role client
import { createServiceClient } from '@/lib/supabase/service';

export interface AuditEntry {
  event_type:
    | 'status_transition'
    | 'login_success'
    | 'login_failure'
    | 'logout'
    | 'session_expired';
  actor_id?: string;
  actor_email?: string;
  target_id?: string;
  previous_value?: string;
  new_value?: string;
  metadata?: Record<string, unknown>;
}

export async function writeAuditLog(entry: AuditEntry): Promise<void> {
  const supabase = createServiceClient();
  await supabase.from('audit_logs').insert({
    event_type: entry.event_type,
    actor_id: entry.actor_id ?? null,
    actor_email: entry.actor_email ?? null,
    target_id: entry.target_id ?? null,
    previous_value: entry.previous_value ?? null,
    new_value: entry.new_value ?? null,
    metadata: entry.metadata ?? null,
  });
}
