'use client';

import { firebaseAuth, isFirebaseConfigured } from '@/lib/firebase/client';
import { ensureFcmToken, listenForForegroundMessages } from '@/lib/firebase/fcm';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  isConfigured: boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!firebaseAuth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(firebaseAuth, (nextUser) => {
      setUser(nextUser);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!user?.uid) return;

    let unsubscribe: (() => void) | undefined;

    ensureFcmToken(user.uid).catch((err) => {
      console.warn('Falha ao registrar FCM:', err);
    });

    listenForForegroundMessages().then((off) => {
      unsubscribe = off;
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user?.uid]);

  const value = useMemo(
    () => ({
      user,
      loading,
      isConfigured: isFirebaseConfigured
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
}
