import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import type { Lead } from './types';

type LeadsListProps = {
  isLoading: boolean;
  leads: Lead[];
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onOpenLead: (lead: Lead) => void;
  formatLeadDate: (value: unknown) => string;
};

export function LeadsList({
  isLoading,
  leads,
  searchTerm,
  onSearchChange,
  onOpenLead,
  formatLeadDate
}: LeadsListProps) {
  return (
    <Card>
      <CardHeader className='gap-3 md:flex-row md:items-center md:justify-between'>
        <div>
          <CardTitle>Consulta de Leads</CardTitle>
          <CardDescription>
            Busque leads cadastrados e acompanhe os detalhes.
          </CardDescription>
        </div>
        <div className='w-full md:w-64'>
          <Input
            placeholder='Buscar por nome, contato ou tipo...'
            value={searchTerm}
            onChange={(event) => onSearchChange(event.target.value)}
          />
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className='text-muted-foreground text-sm'>
            Carregando leads...
          </div>
        ) : leads.length === 0 ? (
          <div className='text-muted-foreground text-sm'>
            Nenhum lead encontrado.
          </div>
        ) : (
          <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-3'>
            {leads.map((lead) => (
              <button
                key={lead.id}
                type='button'
                onClick={() => onOpenLead(lead)}
                className='hover:bg-muted/50 active:bg-muted flex flex-col gap-3 rounded-lg border p-4 text-left transition-colors'
              >
                <div className='flex items-start justify-between gap-2'>
                  <span className='text-sm leading-tight font-semibold'>
                    {lead.leadName}
                  </span>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                      lead.hasBeenContacted
                        ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400'
                        : 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400'
                    }`}
                  >
                    {lead.hasBeenContacted ? 'Contatado' : 'Pendente'}
                  </span>
                </div>
                <div className='flex flex-col gap-0.5'>
                  <span className='text-muted-foreground text-xs'>
                    {lead.responsibleName || '-'}
                  </span>
                  <div className='flex items-center gap-2'>
                    <span className='text-muted-foreground text-xs'>
                      {formatLeadDate(lead.date)}
                    </span>
                    {lead.location ? (
                      <>
                        <span className='text-muted-foreground text-xs'>•</span>
                        <span className='text-muted-foreground truncate text-xs'>
                          {lead.location}
                        </span>
                      </>
                    ) : null}
                  </div>
                </div>
                {lead.interestedServices?.length ? (
                  <div className='flex flex-wrap gap-1.5'>
                    {lead.interestedServices.map((service) => (
                      <span
                        key={`${lead.id}-${service}`}
                        className='bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-[10px]'
                      >
                        {service}
                      </span>
                    ))}
                  </div>
                ) : null}
              </button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
