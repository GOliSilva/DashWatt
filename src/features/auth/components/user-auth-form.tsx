'use client';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { firebaseAuth, isFirebaseConfigured } from '@/lib/firebase/client';
import GoogleSignInButton from './google-auth-button';

export default function UserAuthForm({
  mode
}: {
  mode: 'sign-in' | 'sign-up';
}) {
  return (
    <div className='space-y-4'>
      {!isFirebaseConfigured && (
        <Alert>
          <AlertTitle>Firebase nao configurado</AlertTitle>
          <AlertDescription>
            Defina as variaveis NEXT_PUBLIC_FIREBASE_* no arquivo .env para
            habilitar a autenticacao.
          </AlertDescription>
        </Alert>
      )}
      <div className='grid gap-2'>
        <GoogleSignInButton disabled={!firebaseAuth || !isFirebaseConfigured} />
      </div>
    </div>
  );
}
