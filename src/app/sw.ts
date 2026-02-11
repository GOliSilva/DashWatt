/// <reference lib="webworker" />

import { Serwist } from 'serwist';
import { defaultCache } from '@serwist/next/worker';

declare const self: ServiceWorkerGlobalScope & {
  __SW_MANIFEST: Array<{
    url: string;
    revision?: string | null;
  }>;
};

const OFFLINE_URL = '/dashboard/individual';

const serwist = new Serwist({
  precacheEntries: [
    ...self.__SW_MANIFEST,
    { url: OFFLINE_URL, revision: null }
  ],
  skipWaiting: true,
  clientsClaim: true,
  runtimeCaching: defaultCache,

  importScripts: ['/firebase-messaging-sw.js']
});

serwist.addEventListeners();

serwist.addEventListeners();

self.addEventListener('fetch', (event) => {
  if (event.request.mode !== 'navigate') {
    return;
  }

  const updateOfflinePageCache = async () => {
    try {
      const cache = await caches.open('pages');
      const response = await fetch(OFFLINE_URL, { credentials: 'same-origin' });
      if (response && response.ok) {
        await cache.put(OFFLINE_URL, response.clone());
      }
    } catch {
      // Ignore cache update failures
    }
  };

  event.respondWith(
    (async () => {
      try {
        // Try network first for navigation requests
        const response = await fetch(event.request);
        event.waitUntil(updateOfflinePageCache());
        return response;
      } catch (error) {
        // Network failed, return cached individual page
        const cached = await caches.match(OFFLINE_URL);
        return cached ?? Response.error();
      }
    })()
  );
});
