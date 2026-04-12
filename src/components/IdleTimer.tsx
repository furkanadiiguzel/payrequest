'use client';

import { useEffect, useRef } from 'react';
import { logoutAction } from '@/actions/auth';
import { writeAuditLog } from '@/lib/audit';

const IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
const CHECK_INTERVAL_MS = 60 * 1000; // check every 60 seconds
const LAST_ACTIVITY_KEY = 'pr_last_activity';

export default function IdleTimer() {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function resetActivity() {
    sessionStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
  }

  useEffect(() => {
    resetActivity();

    const events = ['mousemove', 'keydown', 'click', 'scroll'] as const;
    events.forEach((e) => window.addEventListener(e, resetActivity, { passive: true }));

    intervalRef.current = setInterval(async () => {
      const last = parseInt(sessionStorage.getItem(LAST_ACTIVITY_KEY) ?? '0', 10);
      if (Date.now() - last > IDLE_TIMEOUT_MS) {
        writeAuditLog({ event_type: 'session_expired' }).catch(() => {});
        await logoutAction();
      }
    }, CHECK_INTERVAL_MS);

    return () => {
      events.forEach((e) => window.removeEventListener(e, resetActivity));
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return null;
}
