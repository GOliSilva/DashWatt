'use client';

import { FormInput } from '@/components/forms/form-input';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { firebaseAuth, isFirebaseConfigured } from '@/lib/firebase/client';
import { zodResolver } from '@hookform/resolvers/zod';
import { FirebaseError } from 'firebase/app';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from 'firebase/auth';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';
import GithubSignInButton from './github-auth-button';
import GoogleSignInButton from './google-auth-button';

const formSchema = z.object({
  email: z.string().email({ message: 'Informe um email valido' }),
  password: z
    .string()
    .min(6, { message: 'A senha precisa de pelo menos 6 caracteres' })
});

type UserFormValue = z.infer<typeof formSchema>;

const errorMessages: Record<string, string> = {
  'auth/invalid-email': 'Email invalido',
  'auth/user-not-found': 'Usuario nao encontrado',
  'auth/wrong-password': 'Senha incorreta',
  'auth/email-already-in-use': 'Email ja cadastrado',
  'auth/weak-password': 'Senha fraca',
  'auth/too-many-requests': 'Muitas tentativas. Tente novamente.'
};

const getAuthErrorMessage = (error: unknown) => {
  if (error instanceof FirebaseError) {
    return errorMessages[error.code] ?? 'Nao foi possivel autenticar.';
  }

  return 'Nao foi possivel autenticar.';
};

export default function UserAuthForm({
  mode
}: {
  mode: 'sign-in' | 'sign-up';
}) {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') ?? '/dashboard';
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const form = useForm<UserFormValue>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: ''
    }
  });

  const onSubmit = async (data: UserFormValue) => {
    if (!firebaseAuth) {
      toast.error('Firebase nao configurado.');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'sign-in') {
        await signInWithEmailAndPassword(
          firebaseAuth,
          data.email,
          data.password
        );
        toast.success('Login realizado com sucesso!');
      } else {
        await createUserWithEmailAndPassword(
          firebaseAuth,
          data.email,
          data.password
        );
        toast.success('Conta criada com sucesso!');
      }

      router.replace(callbackUrl);
    } catch (error) {
      toast.error(getAuthErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

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
      <Form
        form={form}
        onSubmit={form.handleSubmit(onSubmit)}
        className='w-full space-y-3'
      >
        <FormInput
          control={form.control}
          name='email'
          label='Email'
          type='email'
          placeholder='seuemail@dominio.com'
          disabled={loading}
          required
        />
        <FormInput
          control={form.control}
          name='password'
          label='Senha'
          type='password'
          placeholder='Digite sua senha'
          disabled={loading}
          required
        />
        <Button
          disabled={loading || !isFirebaseConfigured}
          className='w-full'
          type='submit'
        >
          {mode === 'sign-in' ? 'Entrar' : 'Criar conta'}
        </Button>
      </Form>
      <div className='relative'>
        <div className='absolute inset-0 flex items-center'>
          <span className='w-full border-t' />
        </div>
        <div className='relative flex justify-center text-xs uppercase'>
          <span className='bg-background text-muted-foreground px-2'>
            Ou continue com
          </span>
        </div>
      </div>
      <div className='grid gap-2'>
        <GoogleSignInButton disabled={loading || !isFirebaseConfigured} />
        <GithubSignInButton disabled={loading || !isFirebaseConfigured} />
      </div>
    </div>
  );
}
