'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { format, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { ChevronLeftIcon, ChevronRightIcon } from '@radix-ui/react-icons';
import {
  normalizeLabel,
  parseDueDate,
  priorityStyles,
  statusStyles
} from './teamview-constants';

/* ── Shared: task mini-card ── */
function TaskMiniCard({ task }) {
  const nStatus = normalizeLabel(task.status);
  const nPriority = normalizeLabel(task.priority);
  return (
    <div className='bg-background rounded-md border p-2 shadow-[0_1px_0_rgba(0,0,0,0.03)]'>
      <div className='line-clamp-2 text-[11px] font-medium'>{task.title}</div>
      <div className='mt-1 flex flex-wrap items-center gap-1'>
        <Badge
          className={`${statusStyles[nStatus] || ''} px-1 py-0 text-[9px]`}
        >
          {task.status}
        </Badge>
        <Badge
          className={`${priorityStyles[nPriority] || ''} px-1 py-0 text-[9px]`}
        >
          {task.priority}
        </Badge>
      </div>
    </div>
  );
}

/* ── Mobile: card layout per member ── */
function MobileSectorView({ items, weekStart }) {
  return (
    <div className='space-y-3 sm:hidden'>
      {items.map((member) => {
        const tasksByDay = new Map();
        member.tasks.forEach((task) => {
          const due = parseDueDate(task.due);
          if (!due) return;
          const key = format(due, 'yyyy-MM-dd');
          const existing = tasksByDay.get(key) || [];
          tasksByDay.set(key, [...existing, task]);
        });

        /* Build days that have tasks */
        const daysWithTasks = [];
        for (let i = 0; i < 7; i++) {
          const date = addDays(weekStart, i);
          const key = format(date, 'yyyy-MM-dd');
          const dayTasks = tasksByDay.get(key) || [];
          if (dayTasks.length > 0) {
            daysWithTasks.push({ date, dayTasks });
          }
        }

        return (
          <div key={member.id} className='rounded-lg border'>
            <div className='bg-muted/40 border-b px-3 py-2.5'>
              <span className='text-sm font-semibold'>{member.name}</span>
              <span className='text-muted-foreground ml-2 text-xs'>
                {member.tasks.length} tarefa{member.tasks.length !== 1 && 's'}
              </span>
            </div>
            <div className='px-3 py-2'>
              {daysWithTasks.length === 0 ? (
                <p className='text-muted-foreground py-2 text-xs'>
                  Nenhuma atividade esta semana.
                </p>
              ) : (
                <div className='space-y-2'>
                  {daysWithTasks.map(({ date, dayTasks }) => (
                    <div key={format(date, 'yyyy-MM-dd')}>
                      <div className='text-muted-foreground mb-1 text-[11px] font-semibold uppercase'>
                        {format(date, 'EEEE, dd/MM', { locale: ptBR })}
                      </div>
                      <div className='space-y-1'>
                        {dayTasks.map((task) => (
                          <TaskMiniCard key={task.id} task={task} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── Desktop: grid/table layout ── */
function DesktopSectorGrid({ items, weekStart }) {
  return (
    <div className='hidden overflow-x-auto rounded-md border sm:block'>
      <div className='min-w-[840px]'>
        <div className='bg-muted/40 grid grid-cols-[220px_repeat(7,minmax(120px,1fr))] border-b'>
          <div className='text-muted-foreground px-3 py-2 text-xs font-semibold uppercase'>
            Membro
          </div>
          {Array.from({ length: 7 }).map((_, index) => {
            const date = addDays(weekStart, index);
            return (
              <div
                key={`day-${index}`}
                className='text-muted-foreground px-3 py-2 text-xs font-semibold uppercase'
              >
                {format(date, 'EEE', { locale: ptBR })}
                <span className='text-muted-foreground ml-2 text-[10px] font-normal'>
                  {format(date, 'dd/MM')}
                </span>
              </div>
            );
          })}
        </div>

        <div className='divide-y'>
          {items.map((member) => {
            const tasksByDay = new Map();
            member.tasks.forEach((task) => {
              const due = parseDueDate(task.due);
              if (!due) return;
              const key = format(due, 'yyyy-MM-dd');
              const existing = tasksByDay.get(key) || [];
              tasksByDay.set(key, [...existing, task]);
            });

            return (
              <div
                key={member.id}
                className='grid grid-cols-[220px_repeat(7,minmax(120px,1fr))]'
              >
                <div className='px-3 py-3 text-sm font-medium'>
                  {member.name}
                </div>
                {Array.from({ length: 7 }).map((_, index) => {
                  const date = addDays(weekStart, index);
                  const key = format(date, 'yyyy-MM-dd');
                  const dayTasks = tasksByDay.get(key) || [];

                  return (
                    <div key={`${member.id}-${key}`} className='px-2 py-2'>
                      {dayTasks.length === 0 ? (
                        <div className='text-muted-foreground text-[11px]'>
                          —
                        </div>
                      ) : (
                        <div className='space-y-1'>
                          {dayTasks.map((task) => (
                            <TaskMiniCard key={task.id} task={task} />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function SectorWeeklyOverview({
  sectors,
  selectedSector,
  onSectorChange,
  weekLabel,
  weekStart,
  onPrevWeek,
  onNextWeek,
  isLoading,
  items
}) {
  const hasSelection = Boolean(selectedSector);

  return (
    <Card>
      <CardHeader className='space-y-2 pb-3'>
        <div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
          <CardTitle className='text-lg md:text-xl'>
            Atividades semanais por setor
          </CardTitle>
          <div className='bg-muted/40 flex items-center gap-2 rounded-md border px-2 py-1'>
            <Button
              type='button'
              size='icon'
              variant='ghost'
              onClick={onPrevWeek}
              aria-label='Semana anterior'
              className='h-7 w-7'
            >
              <ChevronLeftIcon className='size-4' />
            </Button>
            <CardDescription className='text-xs font-medium whitespace-nowrap sm:text-sm'>
              {weekLabel}
            </CardDescription>
            <Button
              type='button'
              size='icon'
              variant='ghost'
              onClick={onNextWeek}
              aria-label='Proxima semana'
              className='h-7 w-7'
            >
              <ChevronRightIcon className='size-4' />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className='space-y-3'>
          <Select value={selectedSector} onValueChange={onSectorChange}>
            <SelectTrigger className='h-11'>
              <SelectValue placeholder='Selecione um setor' />
            </SelectTrigger>
            <SelectContent>
              {sectors.map((sector) => (
                <SelectItem key={sector} value={sector}>
                  {sector}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {!hasSelection ? (
            <div className='text-muted-foreground text-sm'>
              Selecione um setor para visualizar as atividades.
            </div>
          ) : isLoading ? (
            <div className='space-y-2'>
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={`sector-skel-${index}`}
                  className='rounded-md border p-3'
                >
                  <Skeleton className='h-4 w-1/3' />
                  <Skeleton className='mt-2 h-3 w-2/3' />
                </div>
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className='text-muted-foreground text-sm'>
              Nenhum membro encontrado neste setor.
            </div>
          ) : (
            <>
              {/* Mobile: card layout */}
              <MobileSectorView items={items} weekStart={weekStart} />
              {/* Desktop: grid table */}
              <DesktopSectorGrid items={items} weekStart={weekStart} />
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
