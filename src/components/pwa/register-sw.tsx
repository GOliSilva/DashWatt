'use client';

import { useEffect } from 'react';

export default function RegisterSW() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return;
    if (!('serviceWorker' in navigator)) return;

    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // Ignore registration errors to avoid blocking the app
      });
    });
  }, []);

  return null;
}
