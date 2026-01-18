'use client';

import PageContainer from '@/components/layout/page-container';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TeamPage() {
  return (
    <PageContainer
      pageTitle='Team Management'
      pageDescription='Gerencie sua equipe localmente'
    >
      <Card>
        <CardHeader>
          <CardTitle>Equipe</CardTitle>
        </CardHeader>
        <CardContent>
          <p className='text-muted-foreground'>
            A pagina de equipe foi simplificada sem Clerk.
          </p>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
