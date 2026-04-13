'use client';

import { useEffect, useState } from 'react';

interface ExpiryCountdownProps {
  expiresAt: string;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalMs: number;
}

function computeTimeLeft(expiresAt: string): TimeLeft | null {
  const totalMs = new Date(expiresAt).getTime() - Date.now();
  if (totalMs <= 0) return null;
  return {
    days: Math.floor(totalMs / (1000 * 60 * 60 * 24)),
    hours: Math.floor((totalMs / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((totalMs / (1000 * 60)) % 60),
    seconds: Math.floor((totalMs / 1000) % 60),
    totalMs,
  };
}

export default function ExpiryCountdown({ expiresAt }: ExpiryCountdownProps) {
  const [mounted, setMounted] = useState(false);
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null);

  useEffect(() => {
    setMounted(true);
    setTimeLeft(computeTimeLeft(expiresAt));
    const id = setInterval(() => setTimeLeft(computeTimeLeft(expiresAt)), 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  // Always render the placeholder until client has hydrated to prevent mismatch
  if (!mounted) {
    return <span className="text-amber-400 font-medium">–</span>;
  }

  if (timeLeft === null) {
    return <span className="text-destructive font-medium">Expired</span>;
  }

  const urgent = timeLeft.totalMs < 24 * 60 * 60 * 1000;
  const critical = timeLeft.totalMs < 2 * 60 * 60 * 1000;
  const colorClass = critical
    ? 'text-red-400'
    : urgent
    ? 'text-amber-400'
    : 'text-amber-300';

  if (timeLeft.days > 0) {
    return (
      <span className={`${colorClass} font-medium`}>
        {timeLeft.days}d {timeLeft.hours}h remaining
      </span>
    );
  }

  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    <span className={`${colorClass} font-mono font-medium tracking-tight`}>
      {pad(timeLeft.hours)}:{pad(timeLeft.minutes)}:{pad(timeLeft.seconds)} remaining
    </span>
  );
}
