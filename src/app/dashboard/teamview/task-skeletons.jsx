'use client';

import { Skeleton } from '@/components/ui/skeleton';

export function TaskSkeletons({ count = 3 }) {
  return (
    <div className='space-y-2'>
      {Array.from({ length: count }).map((_, i) => (
        <div key={`skel-${i}`} className='rounded-lg border p-3'>
          <Skeleton className='h-4 w-2/3' />
          <Skeleton className='mt-2 h-3 w-1/3' />
        </div>
      ))}
    </div>
  );
}
