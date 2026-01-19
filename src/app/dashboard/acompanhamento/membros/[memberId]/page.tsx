'use client';
import * as React from 'react';
import Link from 'next/link';
import PageContainer from '@/components/layout/page-container';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { ScrollArea } from '@/components/ui/scroll-area';

const tasks = [
  {
    id: 'task-1',
    title: 'Revisar backlog semanal',
    due: 'Hoje',
    status: 'Em andamento',
    priority: 'Alta'
  },
  {
    id: 'task-2',
    title: 'Atualizar checklist de QA',
    due: 'Amanha',
    status: 'Planejado',
    priority: 'Media'
  },
  {
    id: 'task-3',
    title: 'Alinhar dependencias do time',
    due: 'Sexta',
    status: 'Em andamento',
    priority: 'Baixa'
  },
  {
    id: 'task-4',
    title: 'Revisar entregas do sprint',
    due: 'Segunda',
    status: 'Bloqueado',
    priority: 'Alta'
  },
  {
    id: 'task-5',
    title: 'Validar wireframes',
    due: 'Quarta',
    status: 'Planejado',
    priority: 'Media'
  }
];

const priorityStyles: Record<string, string> = {
  Alta: 'bg-red-500/10 text-red-700',
  Media: 'bg-amber-500/10 text-amber-700',
  Baixa: 'bg-emerald-500/10 text-emerald-700'
};

const statusStyles: Record<string, string> = {
  'Em andamento': 'bg-primary/10 text-primary',
  Planejado: 'bg-muted text-muted-foreground',
  Bloqueado: 'bg-red-500/10 text-red-700'
};

const memberInfo = {
  name: 'Ana Costa',
  email: 'ana.costa@exemplo.com',
  sector: 'Design',
  cpf: '123.456.789-00',
  role: 'Designer'
};

const alerts = [
  {
    id: 'alert-1',
    title: 'Entrega proxima',
    detail: 'Revisar prototipos ate sexta-feira',
    level: 'alto',
    time: 'ha 2 horas'
  },
  {
    id: 'alert-2',
    title: 'Pendencia de aprovacao',
    detail: 'Feedback do cliente pendente',
    level: 'medio',
    time: 'ha 5 horas'
  },
  {
    id: 'alert-3',
    title: 'Reuniao marcada',
    detail: 'Daily com engenharia amanha',
    level: 'baixo',
    time: 'ha 1 dia'
  },
  {
    id: 'alert-4',
    title: 'Ajuste urgente',
    detail: 'Atualizar layout da home',
    level: 'alto',
    time: 'ha 30 min'
  }
];

const alertLevelStyles: Record<string, string> = {
  alto: 'bg-red-500/10 text-red-700',
  medio: 'bg-amber-500/10 text-amber-700',
  baixo: 'bg-emerald-500/10 text-emerald-700'
};

export default function MembroPage() {
  const [selectedDay, setSelectedDay] = React.useState<Date | undefined>(
    new Date()
  );

  return (
    <PageContainer
      pageTitle='Membro'
      pageDescription='Tarefas, calendario e alertas'
    >
      <div className='flex flex-1 flex-col space-y-4'>
        <div className='*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:grid-cols-2'>
          <Card className='h-full'>
            <CardHeader>
              <CardTitle>Lista de tarefas</CardTitle>
              <CardDescription>Atividades da semana</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className='h-56 pr-3'>
                <div className='space-y-2'>
                  {tasks.map((task) => (
                    <div
                      key={task.id}
                      className='flex items-start justify-between gap-3 rounded-md border p-3'
                    >
                      <div className='flex flex-col'>
                        <span className='text-sm font-medium'>
                          {task.title}
                        </span>
                        <span className='text-muted-foreground text-xs'>
                          Prazo: {task.due}
                        </span>
                      </div>
                      <div className='flex flex-col items-end gap-1'>
                        <Badge className={statusStyles[task.status]}>
                          {task.status}
                        </Badge>
                        <Badge className={priorityStyles[task.priority]}>
                          {task.priority}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          <Card className='h-full'>
            <CardHeader>
              <CardTitle>Calendario</CardTitle>
              <CardDescription>Dias clicaveis para agenda</CardDescription>
            </CardHeader>
            <CardContent>
              <Calendar
                mode='single'
                selected={selectedDay}
                onSelect={setSelectedDay}
              />
            </CardContent>
          </Card>

          <Card className='h-full'>
            <CardHeader>
              <CardTitle>Informacoes</CardTitle>
              <CardDescription>Dados do membro</CardDescription>
            </CardHeader>
            <CardContent>
              <div className='grid grid-cols-1 gap-3 text-sm sm:grid-cols-2'>
                <div className='rounded-md border p-3'>
                  <div className='text-muted-foreground text-xs'>Nome</div>
                  <div className='mt-1 font-medium'>{memberInfo.name}</div>
                </div>
                <div className='rounded-md border p-3'>
                  <div className='text-muted-foreground text-xs'>Email</div>
                  <div className='mt-1 font-medium'>{memberInfo.email}</div>
                </div>
                <div className='rounded-md border p-3'>
                  <div className='text-muted-foreground text-xs'>Setor</div>
                  <div className='mt-1 font-medium'>{memberInfo.sector}</div>
                </div>
                <div className='rounded-md border p-3'>
                  <div className='text-muted-foreground text-xs'>CPF</div>
                  <div className='mt-1 font-medium'>{memberInfo.cpf}</div>
                </div>
                <div className='rounded-md border p-3 sm:col-span-2'>
                  <div className='text-muted-foreground text-xs'>Cargo</div>
                  <div className='mt-1 font-medium'>{memberInfo.role}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className='h-full'>
            <CardHeader>
              <CardTitle>Alertas</CardTitle>
              <CardDescription>Itens para acompanhamento</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className='h-56 pr-3'>
                <div className='space-y-2'>
                  {alerts.map((alert) => (
                    <div
                      key={alert.id}
                      className='flex items-start justify-between gap-3 rounded-md border p-3'
                    >
                      <div className='flex flex-col'>
                        <span className='text-sm font-medium'>
                          {alert.title}
                        </span>
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
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        <div>
          <Button asChild variant='outline'>
            <Link href='/dashboard/acompanhamento'>Voltar</Link>
          </Button>
        </div>
      </div>
    </PageContainer>
  );
}
