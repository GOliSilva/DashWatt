'use client';

import PageContainer from '@/components/layout/page-container';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function BillingPage() {
  return (
    <PageContainer
      pageTitle='Billing & Plans'
      pageDescription='Configuracao de cobranca desativada'
    >
      <Card>
        <CardHeader>
          <CardTitle>Billing</CardTitle>
        </CardHeader>
        <CardContent>
          <p className='text-muted-foreground'>
            O modulo de cobranca foi removido junto com o Clerk.
          </p>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
