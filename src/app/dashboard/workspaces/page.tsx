'use client';

import PageContainer from '@/components/layout/page-container';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function WorkspacesPage() {
  return (
    <PageContainer
      pageTitle='Workspaces'
      pageDescription='Gerencie seus workspaces localmente'
    >
      <Card>
        <CardHeader>
          <CardTitle>Workspaces</CardTitle>
        </CardHeader>
        <CardContent>
          <p className='text-muted-foreground'>
            A funcionalidade de organizacoes foi desativada.
          </p>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
