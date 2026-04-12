'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { writeAuditLog } from '@/lib/audit';

const LOGIN_MAX_FAILURES = parseInt(process.env.LOGIN_MAX_FAILURES ?? '5', 10);
const LOGIN_LOCKOUT_MINUTES = parseInt(process.env.LOGIN_LOCKOUT_MINUTES ?? '15', 10);

export async function loginAction(
  formData: FormData
): Promise<{ error: string } | void> {
  const email = (formData.get('email') as string)?.toLowerCase().trim();
  const password = formData.get('password') as string;
  const rawReturnUrl = formData.get('returnUrl') as string | null;
  const returnUrl =
    rawReturnUrl?.startsWith('/') ? rawReturnUrl : '/dashboard';

  const service = createServiceClient();

  // Rate-limit check: count recent failures in the rolling window
  const windowStart = new Date(
    Date.now() - LOGIN_LOCKOUT_MINUTES * 60 * 1000
  ).toISOString();
  const { count } = await service
    .from('login_attempts')
    .select('*', { count: 'exact', head: true })
    .eq('email', email)
    .eq('success', false)
    .gte('attempted_at', windowStart);

  if ((count ?? 0) >= LOGIN_MAX_FAILURES) {
    return {
      error: `Account temporarily locked. Try again after ${LOGIN_LOCKOUT_MINUTES} minutes.`,
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) {
    await service.from('login_attempts').insert({ email, success: false });
    // fire-and-forget for failures
    writeAuditLog({
      event_type: 'login_failure',
      actor_email: email,
    }).catch(() => {});
    return { error: 'Invalid email or password' };
  }

  await service.from('login_attempts').insert({ email, success: true });
  await writeAuditLog({
    event_type: 'login_success',
    actor_id: data.user.id,
    actor_email: email,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  redirect(returnUrl as any);
}

export async function signupAction(
  formData: FormData
): Promise<{ error: string } | void> {
  const email = (formData.get('email') as string)?.toLowerCase().trim();
  const password = formData.get('password') as string;

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error || !data.user) {
    return { error: error?.message ?? 'Sign up failed. Please try again.' };
  }

  await writeAuditLog({
    event_type: 'login_success',
    actor_id: data.user.id,
    actor_email: email,
  });

  redirect('/dashboard');
}

export async function logoutAction(): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    await writeAuditLog({
      event_type: 'logout',
      actor_id: user.id,
      actor_email: user.email,
    });
  }

  await supabase.auth.signOut();
  redirect('/login');
}
