'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export default function DashboardError({ reset }: { reset: () => void }) {
  const router = useRouter();
  return (
    <div className="text-center py-16">
      <p className="text-gray-600 mb-4">Failed to load requests.</p>
      <div className="flex gap-3 justify-center">
        <Button variant="outline" onClick={() => { reset(); router.refresh(); }}>
          Retry
        </Button>
      </div>
    </div>
  );
}
