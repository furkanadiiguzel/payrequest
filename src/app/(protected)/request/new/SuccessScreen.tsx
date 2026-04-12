'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface SuccessScreenProps {
  requestId: string;
  onSendAnother: () => void;
}

export default function SuccessScreen({ requestId, onSendAnother }: SuccessScreenProps) {
  const router = useRouter();
  const shareableUrl = `${process.env.NEXT_PUBLIC_APP_URL}/request/${requestId}`;
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => router.push('/dashboard'), 3000);
    return () => clearTimeout(t);
  }, [router]);

  async function handleCopyLink() {
    await navigator.clipboard.writeText(shareableUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="max-w-lg mx-auto" data-testid="success-screen">
      <Card>
        <CardContent className="pt-8 pb-8 text-center space-y-6">
          <div className="text-5xl">✓</div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Request sent!</h2>
            <p className="text-sm text-gray-500 mt-1">
              Redirecting to dashboard in 3 seconds…
            </p>
          </div>

          <div className="rounded-md bg-gray-50 border border-gray-200 p-3 text-left">
            <p className="text-xs text-gray-500 mb-1">Shareable link</p>
            <p
              className="text-sm font-mono break-all text-gray-800"
              data-testid="shareable-link"
            >
              {shareableUrl}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              onClick={handleCopyLink}
              variant="outline"
              className="flex-1"
              data-testid="copy-link-btn"
            >
              {copied ? 'Copied!' : 'Copy Link'}
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
              Go to dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
