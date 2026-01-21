'use client';

import * as React from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import { useAuth } from '@/features/auth/components/auth-provider';
import { useFirebaseData } from '@/contexts/firebase-data-context';

type Alert = {
  id: string;
  title: string;
  detail: string;
  time: string;
  level: 'baixo' | 'médio' | 'alto';
};

const alertLevelStyles = {
  baixo: 'bg-green-500/10 text-green-500 hover:bg-green-500/20',
  médio: 'bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20',
  alto: 'bg-red-500/10 text-red-500 hover:bg-red-500/20'
};

export function AlertsButton() {
  const [isOpen, setIsOpen] = React.useState(false);
  const { user } = useAuth();
  const { members } = useFirebaseData();
  
  const currentMember = React.useMemo(() => {
    if (!user?.email) return null;
    const userEmail = user.email.toLowerCase().trim();
    return members.find((m) => m.email?.toLowerCase().trim() === userEmail);
  }, [user?.email, members]);

  const alerts: Alert[] = React.useMemo(() => {
    if (!currentMember || !(currentMember as any).alerts) return [];
    return (currentMember as any).alerts || [];
  }, [currentMember]);

  if (!user) return null;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant='outline' size='icon' className='relative'>
          <Bell className='h-4 w-4' />
          {alerts.length > 0 && (
            <span className='absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white'>
              {alerts.length}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-80' align='end'>
        <div className='space-y-2'>
          <h4 className='font-medium text-sm'>Alertas</h4>
          <ScrollArea className='h-64'>
            <div className='space-y-2 pr-3'>
              {alerts.length === 0 ? (
                <div className='text-muted-foreground text-sm py-4 text-center'>
                  Nenhum alerta
                </div>
              ) : (
                alerts.map((alert) => (
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
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </PopoverContent>
    </Popover>
  );
}
