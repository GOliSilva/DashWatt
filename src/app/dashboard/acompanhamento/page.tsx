 'use client';
import * as React from 'react';
import Link from 'next/link';
import PageContainer from '@/components/layout/page-container';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { PieGraph } from '@/features/overview/components/pie-graph';

const projects = [
  {
    id: 'atlas',
    name: 'Projeto Atlas',
    status: 'Em andamento',
    updated: 'ha 2 dias',
    health: 'Estavel'
  },
  {
    id: 'orion',
    name: 'Projeto Orion',
    status: 'Revisao',
    updated: 'ha 5 horas',
    health: 'Atencao'
  },
  {
    id: 'lumen',
    name: 'Projeto Lumen',
    status: 'Planejamento',
    updated: 'ha 1 dia',
    health: 'Ok'
  },
  {
    id: 'nimbus',
    name: 'Projeto Nimbus',
    status: 'Execucao',
    updated: 'ha 3 dias',
    health: 'Estavel'
  },
  {
    id: 'nova',
    name: 'Projeto Nova',
    status: 'Validacao',
    updated: 'ha 8 horas',
    health: 'Atencao'
  },
  {
    id: 'saga',
    name: 'Projeto Saga',
    status: 'Execucao',
    updated: 'ha 2 horas',
    health: 'Ok'
  }
];

const members = [
  {
    id: 'ana-costa',
    name: 'Ana Costa',
    role: 'Designer',
    activity: 'Atualizou prototipos',
    status: 'online'
  },
  {
    id: 'carlos-souza',
    name: 'Carlos Souza',
    role: 'Frontend',
    activity: 'Finalizou componentes',
    status: 'away'
  },
  {
    id: 'bruno-lima',
    name: 'Bruno Lima',
    role: 'Backend',
    activity: 'Revisou endpoints',
    status: 'online'
  },
  {
    id: 'marina-silva',
    name: 'Marina Silva',
    role: 'QA',
    activity: 'Executou testes',
    status: 'offline'
  },
  {
    id: 'paulo-melo',
    name: 'Paulo Melo',
    role: 'PM',
    activity: 'Atualizou cronograma',
    status: 'online'
  },
  {
    id: 'renata-alves',
    name: 'Renata Alves',
    role: 'UX',
    activity: 'Ajustou fluxos',
    status: 'away'
  }
];

const alerts = [
  {
    id: 'alert-1',
    title: 'API instavel',
    detail: 'Picos de erro no servico de pedidos',
    level: 'alto',
    time: 'ha 10 min'
  },
  {
    id: 'alert-2',
    title: 'Fila de emails',
    detail: 'Processamento acima do esperado',
    level: 'medio',
    time: 'ha 45 min'
  },
  {
    id: 'alert-3',
    title: 'Deploy pendente',
    detail: 'Aguardando aprovacao do time',
    level: 'baixo',
    time: 'ha 2 horas'
  }
];

const statusOptions = [
  'Todos',
  'Em andamento',
  'Revisao',
  'Planejamento',
  'Execucao',
  'Validacao'
];

const scopeOptions = ['Geral', 'Automacao', 'Eletrica'];

const memberStatusStyles: Record<string, string> = {
  online: 'bg-emerald-500/10 text-emerald-700',
  away: 'bg-amber-500/10 text-amber-700',
  offline: 'bg-muted text-muted-foreground'
};

const alertLevelStyles: Record<string, string> = {
  alto: 'bg-red-500/10 text-red-700',
  medio: 'bg-amber-500/10 text-amber-700',
  baixo: 'bg-emerald-500/10 text-emerald-700'
};

export default function AcompanhamentoPage() {
  const [scopeFilter, setScopeFilter] = React.useState('Geral');
  const [statusFilter, setStatusFilter] = React.useState('Todos');
  const filteredProjects =
    statusFilter === 'Todos'
      ? projects
      : projects.filter((project) => project.status === statusFilter);

  return (
    <PageContainer
      pageTitle='Acompanhamento'
      pageDescription='Visao geral das frentes em andamento'
      pageHeaderAction={
        <Select value={scopeFilter} onValueChange={setScopeFilter}>
          <SelectTrigger className='h-8 w-[160px]' aria-label='Filtrar area'>
            <SelectValue placeholder='Area' />
          </SelectTrigger>
          <SelectContent align='end'>
            {scopeOptions.map((scope) => (
              <SelectItem key={scope} value={scope}>
                {scope}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      }
    >
      <div className='flex flex-1 flex-col space-y-4'>
        <div className='*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:grid-cols-2'>
          <Card className='h-full'>
            <CardHeader>
              <CardTitle>Projetos em acompanhamento</CardTitle>
              <CardDescription>Lista priorizada com status</CardDescription>
              <CardAction>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger
                    className='h-8 w-[160px]'
                    aria-label='Filtrar por status'
                  >
                    <SelectValue placeholder='Status' />
                  </SelectTrigger>
                  <SelectContent align='end'>
                    {statusOptions.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardAction>
            </CardHeader>
            <CardContent>
              <ScrollArea className='h-64 pr-3'>
                <div className='space-y-2'>
                  {filteredProjects.map((project) => (
                    <Link
                      key={project.id}
                      href={`/dashboard/acompanhamento/projetos/${project.id}`}
                      className='hover:bg-accent focus-visible:ring-ring/50 flex w-full items-start justify-between gap-3 rounded-md border p-3 text-left transition-colors focus-visible:ring-[3px] focus-visible:outline-none'
                    >
                      <div className='flex flex-col'>
                        <span className='text-sm font-medium'>
                          {project.name}
                        </span>
                        <span className='text-muted-foreground text-xs'>
                          {project.status} - Atualizado {project.updated}
                        </span>
                      </div>
                      <Badge variant='outline'>{project.health}</Badge>
                    </Link>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          <div className='h-full [&>div]:h-full'>
            <PieGraph />
          </div>

          <Card className='h-full'>
            <CardHeader>
              <CardTitle>Membros da equipe</CardTitle>
              <CardDescription>Ultima atividade registrada</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className='h-64 pr-3'>
                <div className='space-y-2'>
                  {members.map((member) => (
                    <Link
                      key={member.id}
                      href={`/dashboard/acompanhamento/membros/${member.id}`}
                      className='hover:bg-accent focus-visible:ring-ring/50 flex w-full items-start justify-between gap-3 rounded-md border p-3 text-left transition-colors focus-visible:ring-[3px] focus-visible:outline-none'
                    >
                      <div className='flex flex-col'>
                        <span className='text-sm font-medium'>
                          {member.name}
                        </span>
                        <span className='text-muted-foreground text-xs'>
                          {member.role} - {member.activity}
                        </span>
                      </div>
                      <Badge className={memberStatusStyles[member.status]}>
                        {member.status}
                      </Badge>
                    </Link>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          <Card className='h-full'>
            <CardHeader>
              <CardTitle>Alertas recentes</CardTitle>
              <CardDescription>Eventos que exigem atencao</CardDescription>
            </CardHeader>
            <CardContent>
              <div className='space-y-3'>
                {alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className='flex items-start justify-between gap-3 rounded-md border p-3'
                  >
                    <div className='flex flex-col'>
                      <span className='text-sm font-medium'>{alert.title}</span>
                      <span className='text-muted-foreground text-xs'>
                        {alert.detail}
                      </span>
                      <span className='text-muted-foreground text-xs'>
                        {alert.time}
                      </span>
                    </div>
                    <Badge className={alertLevelStyles[alert.level]}>
                      {alert.level}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}
