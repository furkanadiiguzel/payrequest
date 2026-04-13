'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import AnimatedCheck from '@/components/AnimatedCheck';

interface SuccessScreenProps {
  requestId: string;
  onSendAnother: () => void;
}

export default function SuccessScreen({ requestId, onSendAnother }: SuccessScreenProps) {
  const router = useRouter();
  const shareableUrl = `${process.env.NEXT_PUBLIC_APP_URL}/request/${requestId}`;
  const [copied, setCopied] = useState(false);
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    const tick = setInterval(() => setCountdown((c) => c - 1), 1000);
    const redirect = setTimeout(() => router.push('/dashboard'), 3000);
    return () => {
      clearInterval(tick);
      clearTimeout(redirect);
    };
  }, [router]);

  async function handleCopyLink() {
    await navigator.clipboard.writeText(shareableUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div
      className="max-w-lg mx-auto"
      data-testid="success-screen"
      style={{ animation: 'slide-in-up 0.3s ease-out both' }}
    >
      <div className="bg-card rounded-2xl border border-border p-8">
        {/* Animated check */}
        <div className="flex flex-col items-center text-center space-y-4 mb-8">
          <div className="relative">
            {/* Pulse ring behind the check */}
            <span
              className="absolute inset-0 rounded-full border-2 border-primary/30"
              style={{ animation: 'ring-expand 1.2s ease-out 0.4s both' }}
            />
            <AnimatedCheck size={72} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Request sent!</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Redirecting to dashboard in{' '}
              <span className="text-primary font-semibold tabular-nums">{countdown}</span>s…
            </p>
          </div>
        </div>

        {/* Shareable link */}
        <div className="rounded-xl bg-muted border border-border p-4 mb-6">
          <p className="text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wider">
            Shareable link
          </p>
          <p
            className="text-sm font-mono break-all text-foreground leading-relaxed"
            data-testid="shareable-link"
          >
            {shareableUrl}
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            onClick={handleCopyLink}
            variant="outline"
            className="flex-1 transition-all"
            data-testid="copy-link-btn"
          >
            {copied ? '✓ Copied!' : 'Copy Link'}
          </Button>
          <Button
            onClick={onSendAnother}
            variant="outline"
            className="flex-1"
            data-testid="send-another-btn"
          >
            Send another
          </Button>
          <Button
            onClick={() => router.push('/dashboard')}
            className="flex-1"
            data-testid="go-to-dashboard-btn"
          >
            Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
