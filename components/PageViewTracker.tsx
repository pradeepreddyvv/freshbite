'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

const SEND_INTERVAL_MS = 60_000; // throttle same page to once per minute per browser tab

export default function PageViewTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname || pathname.startsWith('/api')) return;

    const key = `pv:last:${pathname}`;
    const now = Date.now();
    const last = Number(sessionStorage.getItem(key) || 0);
    if (last && now - last < SEND_INTERVAL_MS) return;

    sessionStorage.setItem(key, String(now));

    fetch('/api/analytics/pageviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: pathname, referrer: document.referrer || null }),
      keepalive: true,
    }).catch(() => {
      // Best-effort analytics should never break UX
    });
  }, [pathname]);

  return null;
}
