'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { centsToDollars } from '@/lib/currency';

interface PaymentSuccessOverlayProps {
  amountCents: number;
  senderEmail: string;
}

export default function PaymentSuccessOverlay({
  amountCents,
  senderEmail,
}: PaymentSuccessOverlayProps) {
  const router = useRouter();

  useEffect(() => {
    const t = setTimeout(() => router.push('/dashboard'), 3000);
    return () => clearTimeout(t);
  }, [router]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-white/95"
      data-testid="payment-success-overlay"
    >
      <div className="text-center space-y-6 max-w-sm px-4">
        <div className="text-6xl">✓</div>
        <div>
          <p className="text-2xl font-bold text-gray-900">
            Payment of {centsToDollars(amountCents)} sent to {senderEmail}!
          </p>
          <p className="text-sm text-gray-500 mt-2">Redirecting in 3 seconds…</p>
        </div>
        <Button onClick={() => router.push('/dashboard')} data-testid="back-to-dashboard-btn">
          Back to Dashboard
        </Button>
      </div>
    </div>
  );
}
