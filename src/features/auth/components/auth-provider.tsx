'use client';

import { firebaseAuth, isFirebaseConfigured } from '@/lib/firebase/client';
import {
  browserSessionPersistence,
  onAuthStateChanged,
  setPersistence,
  type User
} from 'firebase/auth';
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

    let unsubscribe = () => {};
    let isMounted = true;

    const initializeAuth = async () => {
      try {
        await setPersistence(firebaseAuth, browserSessionPersistence);
      } catch (error) {
        console.error('Falha ao configurar persistencia da sessao:', error);
      }

      if (!isMounted) {
        return;
      }

      unsubscribe = onAuthStateChanged(firebaseAuth, (nextUser) => {
        setUser(nextUser);
        setLoading(false);
      });
    };

    void initializeAuth();

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

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
