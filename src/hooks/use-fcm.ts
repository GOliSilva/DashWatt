import { useEffect, useState, useCallback } from 'react';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { useAuth } from '@/features/auth/components/auth-provider';
import { firebaseDb } from '@/lib/firebase/client';
import {
  requestPermissionAndGetToken,
  handleForegroundMessage
} from '@/lib/fcm';

export function useFcmToken() {
  const [token, setToken] = useState<string | null>(null);
  const { user } = useAuth();

  const persistTokenForMember = useCallback(
    async (nextToken: string) => {
      if (!firebaseDb || !user?.uid) return;

      try {
        await setDoc(
          doc(firebaseDb, 'members', user.uid),
          {
            fcmToken: nextToken,
            fcmTokenUpdatedAt: serverTimestamp()
          },
          { merge: true }
        );
      } catch (error) {
        console.error('Erro ao salvar token do FCM no membro:', error);
      }
    },
    [user?.uid]
  );

  const tryActivateNotifications = useCallback(async () => {
    if (typeof window === 'undefined' || typeof Notification === 'undefined')
      return;

    const fcmToken = await requestPermissionAndGetToken();
    if (!fcmToken) return;

    setToken(fcmToken);
  }, []);

  useEffect(() => {
    if (!token) return;
    void persistTokenForMember(token);
  }, [token, persistTokenForMember]);

  useEffect(() => {
    if (!token) return;

    const unsubscribe = handleForegroundMessage((payload) => {
      console.log('📩 New message:', payload);
      alert(
        `New notification: ${payload.notification?.title}: ${payload.notification?.body}`
      );
    });

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [token]);

  return [tryActivateNotifications, token] as const;
}
