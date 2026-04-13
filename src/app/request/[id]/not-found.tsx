import Link from 'next/link';

export default function RequestNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-foreground mb-2">Request not found</h1>
        <p className="text-muted-foreground mb-6">This request doesn&apos;t exist or you don&apos;t have access to it.</p>
        <Link href="/dashboard" className="text-primary hover:text-primary/80 font-medium">
          Go to dashboard
        </Link>
      </div>
    </div>
  );
}
