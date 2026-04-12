'use client';

import Link from 'next/link';

export default function RequestDetailError() {
  return (
    <div className="max-w-lg mx-auto text-center py-16">
      <p className="text-gray-600 mb-4">Failed to load request.</p>
      <Link href="/dashboard" className="text-indigo-600 hover:text-indigo-500 font-medium">
        Go to dashboard
      </Link>
    </div>
  );
}
