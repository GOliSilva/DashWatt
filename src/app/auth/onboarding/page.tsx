'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/components/auth-provider';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { toast } from 'sonner';
import { firebaseDb } from '@/lib/firebase/client';

const sectors = [
  'Automação',
  'Elétrica',
  'Comercial',
  'Institucional',
  'Marketing',
  'Executivo'
];

export default function OnboardingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: user?.email || '',
    sector: '',
    cpf: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Informe seu nome completo');
      return;
    }

    if (!formData.sector) {
      toast.error('Selecione seu setor');
      return;
    }

    if (!formData.cpf.trim()) {
      toast.error('Informe seu CPF');
      return;
    }

    // Validação básica de CPF (11 dígitos)
    const cpfNumbers = formData.cpf.replace(/\D/g, '');
    if (cpfNumbers.length !== 11) {
      toast.error('CPF deve ter 11 dígitos');
      return;
    }

    if (!firebaseDb || !user) {
      toast.error('Erro de configuração. Tente novamente.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Criar documento do membro com ID igual ao UID do usuário
      const memberRef = doc(firebaseDb, 'members', user.uid);
      
      await setDoc(memberRef, {
        name: formData.name.trim(),
        email: formData.email.toLowerCase().trim(),
        sector: formData.sector,
        cpf: cpfNumbers,
        role: 'member', // Novo usuário sempre começa como member
        activity: '',
        status: 'Ativo',
        isLeadership: false,
        agendaTasks: [],
        alerts: [],
        timeRecords: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      toast.success('Cadastro concluído com sucesso!');
      
      // Redirecionar para a tela individual
      router.push('/dashboard/individual');
    } catch (error) {
      console.error('Erro ao criar membro:', error);
      toast.error('Erro ao concluir cadastro. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      return numbers
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    }
    return value;
  };

  const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCPF(e.target.value);
    setFormData({ ...formData, cpf: formatted });
  };

  return (
    <div className='flex min-h-screen items-center justify-center bg-background p-4'>
      <Card className='w-full max-w-lg'>
        <CardHeader className='text-center'>
          <CardTitle className='text-2xl'>Complete seu cadastro</CardTitle>
          <CardDescription>
            Preencha suas informações para acessar a plataforma
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='name'>Nome Completo *</Label>
              <Input
                id='name'
                type='text'
                placeholder='João da Silva'
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                disabled={isSubmitting}
                required
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='email'>Email *</Label>
              <Input
                id='email'
                type='email'
                value={formData.email}
                disabled
                className='bg-muted'
              />
              <p className='text-xs text-muted-foreground'>
                Email vinculado à sua conta
              </p>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='sector'>Setor *</Label>
              <Select
                value={formData.sector}
                onValueChange={(value) =>
                  setFormData({ ...formData, sector: value })
                }
                disabled={isSubmitting}
                required
              >
                <SelectTrigger id='sector'>
                  <SelectValue placeholder='Selecione seu setor' />
                </SelectTrigger>
                <SelectContent>
                  {sectors.map((sector) => (
                    <SelectItem key={sector} value={sector}>
                      {sector}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='cpf'>CPF *</Label>
              <Input
                id='cpf'
                type='text'
                placeholder='000.000.000-00'
                value={formData.cpf}
                onChange={handleCPFChange}
                disabled={isSubmitting}
                maxLength={14}
                required
              />
            </div>

            <Button
              type='submit'
              className='w-full'
              size='lg'
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Salvando...' : 'Concluir cadastro'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
