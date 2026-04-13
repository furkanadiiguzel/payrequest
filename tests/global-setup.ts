import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import path from 'path';
import { USER1, USER2 } from './helpers/seed';

// Load .env (and .env.local if it exists) so service-role key is available
// when Playwright runs global-setup outside of the Next.js process
config({ path: path.resolve(process.cwd(), '.env') });
config({ path: path.resolve(process.cwd(), '.env.local'), override: true });

async function globalSetup() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.\n' +
        'Make sure .env.local is present with those values.'
    );
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  for (const user of [USER1, USER2]) {
    // Check if user already exists
    const { data: { users } } = await supabase.auth.admin.listUsers();
    const alreadyExists = users.some((u) => u.email === user.email);

    if (!alreadyExists) {
      const { error } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,   // skip email verification for test users
      });
      if (error) {
        throw new Error(`Failed to create test user ${user.email}: ${error.message}`);
      }
      console.log(`[global-setup] Created test user: ${user.email}`);
    } else {
      console.log(`[global-setup] Test user already exists: ${user.email}`);
    }
  }
}

export default globalSetup;
