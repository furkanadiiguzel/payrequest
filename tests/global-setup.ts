import { createClient } from '@supabase/supabase-js';
import { ALICE, BOB } from './helpers/seed';

async function globalSetup() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars'
    );
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  for (const user of [ALICE, BOB]) {
    const { data: existing } = await supabase.auth.admin.listUsers();
    const alreadyExists = existing.users.some((u) => u.email === user.email);

    if (!alreadyExists) {
      const { error } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,
      });
      if (error) {
        throw new Error(`Failed to create test user ${user.email}: ${error.message}`);
      }
      console.log(`Created test user: ${user.email}`);
    } else {
      console.log(`Test user already exists: ${user.email}`);
    }
  }
}

export default globalSetup;
