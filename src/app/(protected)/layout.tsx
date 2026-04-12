import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { logoutAction } from '@/actions/auth';
import { Button } from '@/components/ui/button';
import IdleTimer from '@/components/IdleTimer';

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/dashboard" className="text-xl font-bold text-indigo-600">
            PayRequest
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/request/new">
              <Button size="sm" data-testid="new-request-btn">
                New Request
              </Button>
            </Link>
            {user && (
              <span className="text-sm text-gray-600 hidden sm:block" data-testid="user-email">
                {user.email}
              </span>
            )}
            <form action={logoutAction}>
              <Button
                type="submit"
                variant="ghost"
                size="sm"
                data-testid="logout-btn"
              >
                Log out
              </Button>
            </form>
          </div>
        </div>
      </header>
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8">
        {children}
      </main>
      <IdleTimer />
    </div>
  );
}
