import { useEffect, useState, useCallback } from 'react';
import {
  serverTimestamp,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  addDoc
} from 'firebase/firestore';
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

      const fcmtokensCol = collection(
        firebaseDb,
        'members',
        user.uid,
        'fcmtokens'
      );

      try {
        const q = query(fcmtokensCol, where('fcmToken', '==', nextToken));
        const snap = await getDocs(q);

        if (snap.empty) {
          await addDoc(fcmtokensCol, {
            fcmToken: nextToken,
            fcmTokenCreatedAt: serverTimestamp(),
            fcmTokenUpdatedAt: serverTimestamp()
          });
        } else {
          await updateDoc(snap.docs[0].ref, {
            fcmTokenUpdatedAt: serverTimestamp()
          });
        }
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
    void tryActivateNotifications();
  }, []);

  useEffect(() => {
    if (!token) return;
    void persistTokenForMember(token);
  }, [token, persistTokenForMember]);

  useEffect(() => {
    if (!token) return;

    const unsubscribe = handleForegroundMessage((payload: any) => {
      console.log('📩 New message:', payload);
    });

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [token]);

  return token;
}
