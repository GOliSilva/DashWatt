'use client';

import { firebaseApp, firebaseDb, isFirebaseConfigured } from '@/lib/firebase/client';
import {
  getMessaging,
  getToken,
  onMessage,
  isSupported,
  type Messaging
} from 'firebase/messaging';
import { arrayUnion, doc, serverTimestamp, setDoc } from 'firebase/firestore';

const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY ?? '';

let messagingPromise: Promise<Messaging | null> | null = null;

async function getMessagingIfSupported() {
  if (!firebaseApp || !isFirebaseConfigured) return null;
  if (!(await isSupported())) return null;

  if (!messagingPromise) {
    messagingPromise = Promise.resolve(getMessaging(firebaseApp));
  }

  return messagingPromise;
}

async function ensureServiceWorker() {
  if (!('serviceWorker' in navigator)) return null;
  const existing = await navigator.serviceWorker.getRegistration('/sw.js');
  if (existing) return existing;
  return navigator.serviceWorker.register('/sw.js');
}

async function ensurePermission() {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  const result = await Notification.requestPermission();
  return result === 'granted';
}

export async function ensureFcmToken(userId: string) {
  if (!firebaseDb || !firebaseApp || !isFirebaseConfigured) return null;
  if (!VAPID_KEY) return null;

  const allowed = await ensurePermission();
  if (!allowed) return null;

  const messaging = await getMessagingIfSupported();
  if (!messaging) return null;

  const registration = await ensureServiceWorker();
  if (!registration) return null;

  const token = await getToken(messaging, {
    vapidKey: VAPID_KEY,
    serviceWorkerRegistration: registration
  });

  if (!token) return null;

  await setDoc(
    doc(firebaseDb, 'members', userId),
    {
      tokens: arrayUnion(token),
      tokensUpdatedAt: serverTimestamp()
    },
    { merge: true }
  );

  return token;
}

export async function listenForForegroundMessages() {
  const messaging = await getMessagingIfSupported();
  if (!messaging) return () => undefined;

  return onMessage(messaging, (payload) => {
    if (Notification.permission === 'granted' && payload.notification) {
      new Notification(payload.notification.title ?? 'Notificacao', {
        body: payload.notification.body
      });
    }
  });
}
