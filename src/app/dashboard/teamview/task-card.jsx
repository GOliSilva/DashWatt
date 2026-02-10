'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
  normalizeLabel,
  priorityStyles,
  statusStyles
} from './teamview-constants';

export function TaskCard({ task }) {
  const nStatus = normalizeLabel(task.status);
  const nPriority = normalizeLabel(task.priority);

  return (
    <div className='rounded-lg border p-3 transition-colors'>
      <div className='flex items-start justify-between gap-2'>
        <div className='flex min-w-0 flex-col'>
          <span className='line-clamp-1 text-sm font-medium'>{task.title}</span>
          <span className='text-muted-foreground text-xs'>
            {task.projectName || 'Agenda'} &middot; {task.due}
          </span>
        </div>
        <div className='flex shrink-0 flex-col items-end gap-1'>
          <Badge
            className={`${statusStyles[nStatus] || ''} px-1.5 py-0 text-[10px]`}
          >
            {task.status}
          </Badge>
          <Badge
            className={`${priorityStyles[nPriority] || ''} px-1.5 py-0 text-[10px]`}
          >
            {task.priority}
          </Badge>
        </div>
      </div>
      {task.description ? (
        <p className='text-muted-foreground mt-2 line-clamp-2 text-justify text-xs'>
          {task.description}
        </p>
      ) : null}
      {task.projectId ? (
        <div className='mt-2 flex justify-end'>
          <Button asChild size='sm' variant='outline' className='h-7 text-xs'>
            <Link href={`/dashboard/acompanhamento/projetos/${task.projectId}`}>
              Abrir projeto
            </Link>
          </Button>
        </div>
      ) : null}
    </div>
  );
}
