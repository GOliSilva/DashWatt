import {
  getToken,
  getMessaging,
  onMessage,
  type MessagePayload
} from 'firebase/messaging';
import { firebaseApp } from './firebase/client';
import { FirebaseApp } from 'firebase/app';

const messaging =
  typeof window !== 'undefined' && firebaseApp
    ? getMessaging(firebaseApp as FirebaseApp)
    : null; // check if the firebase app is initialized on the client

export async function requestPermissionAndGetToken() {
  if (
    !messaging ||
    typeof window === 'undefined' ||
    typeof Notification === 'undefined'
  ) {
    return null;
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    return null;
  }

  try {
    const token = await getToken(messaging, {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY
    });
    return token ?? null;
  } catch (error) {
    console.error('Erro ao obter token do FCM:', error);
    return null;
  }
}

export function handleForegroundMessage(
  callback: (payload: MessagePayload) => void
) {
  if (!messaging) return null;
  return onMessage(messaging, callback);
}
