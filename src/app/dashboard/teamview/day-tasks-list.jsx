'use client';

import { TaskCard } from './task-card';
import { TaskSkeletons } from './task-skeletons';

export function DayTasksList({ isLoading, tasks }) {
  if (isLoading) {
    return <TaskSkeletons count={2} />;
  }

  if (!tasks.length) {
    return (
      <div className='text-muted-foreground py-6 text-center text-sm'>
        Nenhuma atividade para este dia.
      </div>
    );
  }

  return (
    <div className='space-y-2'>
      {tasks.map((task) => (
        <TaskCard key={task.id} task={task} />
      ))}
    </div>
  );
}
