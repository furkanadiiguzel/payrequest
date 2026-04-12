import { createClient } from '@/lib/supabase/server';
import RequestForm from './RequestForm';

export default async function NewRequestPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return <RequestForm userEmail={user?.email ?? ''} />;
}
