'use client';

import PageContainer from '@/components/layout/page-container';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { BadgeCheck } from 'lucide-react';

export default function ExclusivePage() {
  return (
    <PageContainer>
      <div className='space-y-6'>
        <div>
          <h1 className='flex items-center gap-2 text-3xl font-bold tracking-tight'>
            <BadgeCheck className='h-7 w-7 text-green-600' />
            Exclusive Area
          </h1>
          <p className='text-muted-foreground'>
            Esta pagina e um placeholder sem controle de acesso.
          </p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Recursos exclusivos</CardTitle>
            <CardDescription>
              Ajuste o conteudo conforme a regra de negocio.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className='text-lg'>Conteudo disponivel para todos.</div>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
