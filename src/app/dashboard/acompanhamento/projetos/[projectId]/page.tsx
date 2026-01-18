'use client';
import * as React from 'react';
import PageContainer from '@/components/layout/page-container';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';

const activities = [
  {
    id: 'kickoff',
    name: 'Kickoff com stakeholders',
    issuedAt: '12/01/2026',
    dueAt: '20/01/2026',
    owner: 'Ana Costa',
    priority: 'Alta',
    description: 'Alinhar objetivos, riscos e metas do projeto.'
  },
  {
    id: 'wireframes',
    name: 'Wireframes iniciais',
    issuedAt: '13/01/2026',
    dueAt: '24/01/2026',
    owner: 'Renata Alves',
    priority: 'Media',
    description: 'Mapear fluxo e principais telas da solucao.'
  },
  {
    id: 'api-spec',
    name: 'Especificacao da API',
    issuedAt: '14/01/2026',
    dueAt: '28/01/2026',
    owner: 'Bruno Lima',
    priority: 'Alta',
    description: 'Definir contratos, payloads e regras de negocio.'
  },
  {
    id: 'qa-plan',
    name: 'Plano de testes',
    issuedAt: '15/01/2026',
    dueAt: '30/01/2026',
    owner: 'Marina Silva',
    priority: 'Baixa',
    description: 'Criar cobertura minima para cada fluxo critico.'
  }
];

const projectInfo = {
  name: 'Projeto Atlas',
  client: 'ACME Industria',
  status: 'Em andamento',
  start: '08/01/2026',
  next: 'Revisao de escopo',
  manager: 'Mariana Ribeiro'
};

const updates = [
  {
    id: 'update-1',
    activityId: 'kickoff',
    author: 'Paulo Melo',
    note: 'Resumo enviado para o time.',
    time: 'Hoje, 09:12'
  },
  {
    id: 'update-2',
    activityId: 'kickoff',
    author: 'Ana Costa',
    note: 'Pontos de risco mapeados.',
    time: 'Ontem, 17:40'
  },
  {
    id: 'update-3',
    activityId: 'wireframes',
    author: 'Renata Alves',
    note: 'Fluxo principal aprovado.',
    time: 'Hoje, 11:30'
  },
  {
    id: 'update-4',
    activityId: 'api-spec',
    author: 'Bruno Lima',
    note: 'Contrato inicial publicado.',
    time: 'Hoje, 10:05'
  }
];

const priorities: Record<string, string> = {
  Alta: 'bg-red-500/10 text-red-700',
  Media: 'bg-amber-500/10 text-amber-700',
  Baixa: 'bg-emerald-500/10 text-emerald-700'
};

export default function ProjetoPage() {
  const [selectedId, setSelectedId] = React.useState(activities[0].id);
  const selectedActivity =
    activities.find((activity) => activity.id === selectedId) ?? activities[0];
  const activityUpdates = updates.filter(
    (update) => update.activityId === selectedActivity.id
  );

  return (
    <PageContainer
      pageTitle={projectInfo.name}
      pageDescription={`Gerente: ${projectInfo.manager}`}
    >
      <div className='flex flex-1 flex-col space-y-4'>
        <div className='*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:grid-cols-2'>
          <Card className='h-full'>
            <CardHeader>
              <CardTitle>Atividades</CardTitle>
              <CardDescription>Selecione para ver detalhes</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className='h-56 pr-3'>
                <div className='space-y-2'>
                  {activities.map((activity) => (
                    <button
                      key={activity.id}
                      type='button'
                      onClick={() => setSelectedId(activity.id)}
                      className='hover:bg-accent focus-visible:ring-ring/50 flex w-full items-start justify-between gap-3 rounded-md border p-3 text-left transition-colors focus-visible:ring-[3px] focus-visible:outline-none'
                    >
                      <div className='flex flex-col'>
                        <span className='text-sm font-medium'>
                          {activity.name}
                        </span>
                        <span className='text-muted-foreground text-xs'>
                          Emissao {activity.issuedAt} - Prazo {activity.dueAt}
                        </span>
                        <span className='text-muted-foreground text-xs'>
                          Responsavel {activity.owner}
                        </span>
                      </div>
                      <Badge className={priorities[activity.priority]}>
                        {activity.priority}
                      </Badge>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          <Card className='h-full lg:col-start-1 lg:row-start-2'>
            <CardHeader>
              <CardTitle>Nova atividade</CardTitle>
              <CardDescription>Registrar novo item</CardDescription>
            </CardHeader>
            <CardContent className='space-y-2'>
              <div className='grid grid-cols-1 gap-2'>
                <div className='space-y-1'>
                  <label className='text-sm font-medium' htmlFor='activityName'>
                    Nome da atividade
                  </label>
                  <Input
                    id='activityName'
                    placeholder='Ex: Alinhamento com o time'
                  />
                </div>
                <div className='space-y-1'>
                  <label className='text-sm font-medium' htmlFor='activityDesc'>
                    Descricao
                  </label>
                  <Textarea
                    id='activityDesc'
                    placeholder='Detalhes da atividade'
                    className='min-h-16'
                  />
                </div>
                <div className='grid grid-cols-1 gap-2 sm:grid-cols-2'>
                  <div className='space-y-1'>
                    <label className='text-sm font-medium' htmlFor='activityDue'>
                      Prazo
                    </label>
                    <Input id='activityDue' type='date' />
                  </div>
                  <div className='space-y-1'>
                    <label className='text-sm font-medium'>
                      Responsavel
                    </label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder='Selecione' />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from(
                          new Set(activities.map((activity) => activity.owner))
                        ).map((owner) => (
                          <SelectItem key={owner} value={owner}>
                            {owner}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className='h-full lg:col-start-2 lg:row-span-2'>
            <CardHeader>
              <CardTitle>{selectedActivity.name}</CardTitle>
              <CardDescription>
                Responsavel: {selectedActivity.owner}
              </CardDescription>
              <CardAction>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant='outline' size='sm'>
                      Info do projeto
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align='end'>
                    <DropdownMenuLabel>Informacoes do projeto</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      Nome: {projectInfo.name}
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      Cliente: {projectInfo.client}
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      Status: {projectInfo.status}
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      Inicio: {projectInfo.start}
                    </DropdownMenuItem>
                    <DropdownMenuItem>Proximo: {projectInfo.next}</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardAction>
            </CardHeader>
            <CardContent className='space-y-2 text-sm'>
              <div className='grid grid-cols-1 gap-2 sm:grid-cols-2'>
                <div className='rounded-md border p-3'>
                  <div className='text-muted-foreground text-xs'>Prazo</div>
                  <div className='mt-1 font-medium'>
                    {selectedActivity.dueAt}
                  </div>
                </div>
                <div className='rounded-md border p-3'>
                  <div className='text-muted-foreground text-xs'>
                    Prioridade
                  </div>
                  <Badge className={priorities[selectedActivity.priority]}>
                    {selectedActivity.priority}
                  </Badge>
                </div>
              </div>
              <div className='rounded-md border p-3'>
                <div className='text-muted-foreground text-xs'>Descricao</div>
                <p className='mt-1'>{selectedActivity.description}</p>
              </div>
              <div className='rounded-md border p-3'>
                <div className='text-muted-foreground text-xs'>Atualizacoes</div>
                <div className='mt-2 space-y-2'>
                  {activityUpdates.length === 0 ? (
                    <div className='text-muted-foreground text-xs'>
                      Sem atualizacoes.
                    </div>
                  ) : (
                    activityUpdates.map((update) => (
                      <div key={update.id} className='rounded-md border p-2'>
                        <div className='text-xs font-medium'>
                          {update.author}
                        </div>
                        <div className='text-muted-foreground text-xs'>
                          {update.note}
                        </div>
                        <div className='text-muted-foreground text-[11px]'>
                          {update.time}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}
