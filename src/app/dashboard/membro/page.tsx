'use client';
import * as React from 'react';
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
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';

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

export default function MembroPage() {
  const [selectedDay, setSelectedDay] = React.useState<Date | undefined>(
    new Date()
  );
  const totalSeconds = 4 * 60 * 60;
  const [elapsedSeconds, setElapsedSeconds] = React.useState(0);
  const [isRunning, setIsRunning] = React.useState(false);

  React.useEffect(() => {
    if (!isRunning) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      setElapsedSeconds((current) => {
        if (current >= totalSeconds) {
          setIsRunning(false);
          return totalSeconds;
        }
        return current + 1;
      });
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [isRunning, totalSeconds]);

  const progressValue = (elapsedSeconds / totalSeconds) * 100;
  const formattedTime = new Date(elapsedSeconds * 1000)
    .toISOString()
    .slice(11, 19);

  return (
    <PageContainer
      pageTitle='Membro'
      pageDescription='Agenda, tarefas e tempo semanal'
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
              <CardTitle>Agenda</CardTitle>
              <CardDescription>Novo compromisso</CardDescription>
            </CardHeader>
            <CardContent>
              <div className='space-y-3 rounded-md border p-4'>
                <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
                  <div className='space-y-1'>
                    <label className='text-sm font-medium' htmlFor='agendaDate'>
                      Data
                    </label>
                    <Input id='agendaDate' type='date' />
                  </div>
                  <div className='space-y-1'>
                    <label
                      className='text-sm font-medium'
                      htmlFor='agendaTitle'
                    >
                      Nome da atividade
                    </label>
                    <Input
                      id='agendaTitle'
                      placeholder='Ex: Visita tecnica'
                    />
                  </div>
                </div>
                <div className='space-y-1'>
                  <label className='text-sm font-medium' htmlFor='agendaNotes'>
                    Descricao
                  </label>
                  <Textarea
                    id='agendaNotes'
                    placeholder='Detalhes do compromisso'
                    className='min-h-16'
                  />
                </div>
                <div className='flex justify-end'>
                  <Button type='button'>Adicionar</Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className='h-full'>
            <CardHeader>
              <CardTitle>Timer semanal</CardTitle>
              <CardDescription>Controle de 0 a 4 horas</CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='flex items-center justify-between'>
                <div>
                  <div className='text-sm font-medium'>Tempo</div>
                  <div className='text-2xl font-semibold'>{formattedTime}</div>
                </div>
                <Button
                  type='button'
                  variant={isRunning ? 'outline' : 'default'}
                  onClick={() => setIsRunning((current) => !current)}
                >
                  {isRunning ? 'Pausar' : 'Iniciar'}
                </Button>
              </div>
              <div className='space-y-2'>
                <div className='flex items-center justify-between text-xs text-muted-foreground'>
                  <span>0h</span>
                  <span>4h</span>
                </div>
                <Progress value={progressValue} />
                <div className='text-sm'>
                  Progresso:{' '}
                  <span className='font-medium'>
                    {Math.round(progressValue)}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

      </div>
    </PageContainer>
  );
}
