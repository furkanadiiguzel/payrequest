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
    <div className="min-h-screen flex flex-col bg-background">
      <header className="bg-card/80 backdrop-blur-md border-b border-border sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 group">
            <span className="w-7 h-7 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center text-primary text-sm font-bold group-hover:bg-primary/30 transition-colors">
              P
            </span>
            <span className="text-base font-bold text-foreground">PayRequest</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/request/new">
              <Button size="sm" className="shadow-sm" data-testid="nav-new-request">
                + New Request
              </Button>
            </Link>
            {user && (
              <span className="text-xs text-muted-foreground hidden sm:block px-2 py-1 bg-muted rounded-md" data-testid="user-email">
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
