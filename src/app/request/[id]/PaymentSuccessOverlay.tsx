'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { centsToDollars } from '@/lib/currency';
import AnimatedCheck from '@/components/AnimatedCheck';

interface PaymentSuccessOverlayProps {
  amountCents: number;
  senderEmail: string;
}

const CONFETTI = [
  { key: 'a', anim: 'confetti-a', color: '#6366f1', size: 10, delay: '0ms',   shape: 'circle' },
  { key: 'b', anim: 'confetti-b', color: '#10b981', size: 8,  delay: '60ms',  shape: 'square' },
  { key: 'c', anim: 'confetti-c', color: '#f59e0b', size: 12, delay: '120ms', shape: 'circle' },
  { key: 'd', anim: 'confetti-d', color: '#8b5cf6', size: 7,  delay: '30ms',  shape: 'square' },
  { key: 'e', anim: 'confetti-e', color: '#06b6d4', size: 9,  delay: '90ms',  shape: 'circle' },
  { key: 'f', anim: 'confetti-a', color: '#f472b6', size: 8,  delay: '150ms', shape: 'square' },
  { key: 'g', anim: 'confetti-b', color: '#34d399', size: 11, delay: '20ms',  shape: 'circle' },
  { key: 'h', anim: 'confetti-c', color: '#a78bfa', size: 7,  delay: '180ms', shape: 'square' },
];

export default function PaymentSuccessOverlay({ amountCents, senderEmail }: PaymentSuccessOverlayProps) {
  const router = useRouter();
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    const tick = setInterval(() => setCountdown((c) => c - 1), 1000);
    const redirect = setTimeout(() => router.push('/dashboard'), 3000);
    return () => {
      clearInterval(tick);
      clearTimeout(redirect);
    };
  }, [router]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm"
      data-testid="payment-success-overlay"
      style={{ animation: 'fade-in 0.25s ease-out both' }}
    >
      <div className="text-center space-y-6 max-w-sm px-4 relative">
        {/* Confetti particles */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {CONFETTI.map((p) => (
            <span
              key={p.key}
              className={p.shape === 'circle' ? 'absolute rounded-full' : 'absolute rounded-sm'}
              style={{
                width: p.size,
                height: p.size,
                background: p.color,
                animation: `${p.anim} 1.1s ease-out ${p.delay} forwards`,
              }}
            />
          ))}
        </div>

        {/* Check icon */}
        <div className="relative flex justify-center">
          <span
            className="absolute w-20 h-20 rounded-full border-2 border-emerald-500/30"
            style={{ animation: 'ring-expand 1.4s ease-out 0.5s both' }}
          />
          <AnimatedCheck size={80} color="oklch(0.75 0.18 160)" />
        </div>

        {/* Content */}
        <div style={{ animation: 'slide-in-up 0.4s ease-out 0.3s both', opacity: 0 }}>
          <p className="text-3xl font-bold text-foreground">
            {centsToDollars(amountCents)}
          </p>
          <p className="text-base text-muted-foreground mt-1">
            Payment sent to <span className="text-foreground font-medium">{senderEmail}</span>
          </p>
          <p className="text-xs text-muted-foreground/60 mt-3">
            Redirecting in{' '}
            <span className="text-primary font-semibold tabular-nums">{countdown}</span>s
          </p>
        </div>

        <div style={{ animation: 'slide-in-up 0.4s ease-out 0.5s both', opacity: 0 }}>
          <Button
            onClick={() => router.push('/dashboard')}
            className="w-full sm:w-auto"
            data-testid="back-to-dashboard-btn"
          >
            Back to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
