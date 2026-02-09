import * as React from 'react';
import { Button } from '@/components/ui/button';
import PageContainer from '@/components/layout/page-container';

type LeadsPageHeaderProps = {
  onCreateLead: () => void;
  children: React.ReactNode;
};

export function LeadsPageHeader({
  onCreateLead,
  children
}: LeadsPageHeaderProps) {
  return (
    <PageContainer
      pageTitle='Leads'
      pageDescription='Consulte e registre novos leads.'
      pageHeaderAction={
        <Button type='button' onClick={onCreateLead}>
          Novo lead
        </Button>
      }
    >
      {children}
    </PageContainer>
  );
}
