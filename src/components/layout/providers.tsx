'use client';
import React from 'react';
import { ActiveThemeProvider } from '../active-theme';
import { AuthProvider } from '@/features/auth/components/auth-provider';
import { FirebaseDataProvider } from '@/contexts/firebase-data-context';

export default function Providers({
  activeThemeValue,
  children
}: {
  activeThemeValue: string;
  children: React.ReactNode;
}) {
  return (
    <ActiveThemeProvider initialTheme={activeThemeValue}>
      <AuthProvider>
        <FirebaseDataProvider>{children}</FirebaseDataProvider>
      </AuthProvider>
    </ActiveThemeProvider>
  );
}
