'use client';

import { useEffect } from 'react';

export default function RegisterSW() {
  useEffect(() => {
    const enableSw =
      process.env.NODE_ENV === 'production' ||
      process.env.NEXT_PUBLIC_ENABLE_SW === 'true';
    if (!enableSw) return;
    if (!('serviceWorker' in navigator)) return;

    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // Ignore registration errors to avoid blocking the app
      });
    });
  }, []);

  return null;
}
