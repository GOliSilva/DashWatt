'use client';

import { useAuth } from './auth-provider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function AuthGuard({
  children
}: {
  children: React.ReactNode;
}) {
  const { user, loading, isConfigured } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isConfigured) {
      return;
    }

    if (!loading && !user) {
      router.replace('/auth/sign-in');
    }
  }, [loading, user, router, isConfigured]);

  if (!isConfigured) {
    return (
      <div className='flex min-h-screen items-center justify-center px-6'>
        <Alert className='max-w-md'>
          <AlertTitle>Firebase nao configurado</AlertTitle>
          <AlertDescription>
            Defina as variaveis NEXT_PUBLIC_FIREBASE_* no arquivo .env antes de
            acessar o dashboard.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (loading) {
    return (
      <div className='text-muted-foreground flex min-h-screen items-center justify-center text-sm'>
        Carregando...
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}
