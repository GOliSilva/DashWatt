/// <reference lib="webworker" />

import { Serwist } from 'serwist';
import { defaultCache } from '@serwist/next/worker';
import { initializeApp } from 'firebase/app';
import { getMessaging, onBackgroundMessage, isSupported } from 'firebase/messaging/sw';

declare const self: ServiceWorkerGlobalScope & {
  __SW_MANIFEST: Array<{
    url: string;
    revision?: string | null;
  }>;
};

const OFFLINE_URL = '/dashboard/individual';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? '',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? '',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? '',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? '',
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID ?? ''
};

const requiredKeys = [
  'apiKey',
  'authDomain',
  'projectId',
  'storageBucket',
  'messagingSenderId',
  'appId'
] as const;

const isFirebaseConfigured = requiredKeys.every((key) => firebaseConfig[key]);

const serwist = new Serwist({
  precacheEntries: [
    ...self.__SW_MANIFEST,
    {
      url: OFFLINE_URL,
      revision: null
    }
  ],
  skipWaiting: true,
  clientsClaim: true,
  runtimeCaching: defaultCache
});

serwist.addEventListeners();

const setupMessaging = async () => {
  if (!isFirebaseConfigured) return;
  if (!(await isSupported())) return;

  const app = initializeApp(firebaseConfig);
  const messaging = getMessaging(app);

  onBackgroundMessage(messaging, (payload) => {
    const title = payload.notification?.title ?? 'Notificacao';
    const options: NotificationOptions = {
      body: payload.notification?.body,
      data: payload.data ?? {}
    };
    self.registration.showNotification(title, options);
  });
};

setupMessaging();

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
