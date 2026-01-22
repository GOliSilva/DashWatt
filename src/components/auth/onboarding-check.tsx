'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/features/auth/components/auth-provider';
import { doc, getDoc } from 'firebase/firestore';
import { firebaseDb } from '@/lib/firebase/client';

const ONBOARDING_PATH = '/auth/onboarding';
const AUTH_PATHS = ['/auth/sign-in', '/auth/sign-up'];

export function OnboardingCheck({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const [isChecking, setIsChecking] = useState(true);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);

  useEffect(() => {
    const checkOnboarding = async () => {
      // Não verificar em páginas de autenticação ou na própria página de onboarding
      if (AUTH_PATHS.includes(pathname) || pathname === ONBOARDING_PATH) {
        setIsChecking(false);
        return;
      }

      // Aguardar autenticação carregar
      if (loading) {
        return;
      }

      // Se não está logado, não precisa verificar onboarding
      if (!user) {
        setIsChecking(false);
        return;
      }

      // Verificar se tem documento de membro no Firestore
      if (!firebaseDb) {
        console.error('Firebase não configurado');
        setIsChecking(false);
        return;
      }

      try {
        const memberRef = doc(firebaseDb, 'members', user.uid);
        const memberDoc = await getDoc(memberRef);

        if (!memberDoc.exists()) {
          // Membro não existe, redirecionar para onboarding
          console.log('Membro não encontrado, redirecionando para onboarding');
          router.push(ONBOARDING_PATH);
          return;
        }

        // Verificar se tem os campos básicos preenchidos
        const memberData = memberDoc.data();
        const hasRequiredFields =
          memberData?.name && memberData?.email && memberData?.sector && memberData?.cpf;

        if (!hasRequiredFields) {
          // Campos obrigatórios não preenchidos
          console.log('Campos obrigatórios faltando, redirecionando para onboarding');
          router.push(ONBOARDING_PATH);
          return;
        }

        // Onboarding completo
        setHasCompletedOnboarding(true);
      } catch (error) {
        console.error('Erro ao verificar onboarding:', error);
      } finally {
        setIsChecking(false);
      }
    };

    checkOnboarding();
  }, [user, loading, pathname, router]);

  // Mostrar loading enquanto verifica
  if (isChecking || loading) {
    return (
      <div className='flex h-screen items-center justify-center'>
        <div className='text-center'>
          <div className='inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent' />
          <p className='mt-4 text-muted-foreground'>Carregando...</p>
        </div>
      </div>
    );
  }

  // Se estiver na página de onboarding ou auth, mostrar normalmente
  if (pathname === ONBOARDING_PATH || AUTH_PATHS.includes(pathname)) {
    return <>{children}</>;
  }

  // Se não completou onboarding, não renderizar (vai redirecionar)
  if (user && !hasCompletedOnboarding) {
    return null;
  }

  // Tudo OK, mostrar o conteúdo
  return <>{children}</>;
}
