'use client';
import * as React from 'react';
import PageContainer from '@/components/layout/page-container';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components/ui/tabs';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion';
import { firebaseDb } from '@/lib/firebase/client';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where
} from 'firebase/firestore';
import { format } from 'date-fns';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { useAuth } from '@/features/auth/components/auth-provider';

type MemberTask = {
  id: string;
  activityId?: string;
  projectId?: string;
  projectName?: string;
  source?: 'project' | 'agenda';
  title: string;
  due: string;
  status: string;
  priority: string;
  owner?: string;
  ownerId?: string;
  description?: string;
  updates?: ActivityUpdate[];
};

type ActivityUpdate = {
  id: string;
  author: string;
  authorId?: string;
  note: string;
  time: string;
};

type MemberAlert = {
  id: string;
  title: string;
  detail: string;
  level: string;
  time: string;
};

type MemberInfo = {
  name: string;
  email: string;
  sector: string;
  cpf: string;
  role: string;
};

const priorityStyles: Record<string, string> = {
  Alta: 'bg-red-500/10 text-red-700',
  Media: 'bg-amber-500/10 text-amber-700',
  Baixa: 'bg-emerald-500/10 text-emerald-700'
};
const priorityOptions = ['Alta', 'Media', 'Baixa'];

const statusStyles: Record<string, string> = {
  'Em andamento': 'bg-primary/10 text-primary',
  Planejado: 'bg-muted text-muted-foreground',
  Bloqueado: 'bg-red-500/10 text-red-700',
  Concluido: 'bg-emerald-500/10 text-emerald-700'
};
const statusOptions = ['Planejado', 'Em andamento', 'Bloqueado', 'Concluido'];

const priorityRank: Record<string, number> = {
  Alta: 3,
  Media: 2,
  Baixa: 1
};

const alerts: MemberAlert[] = [];

const alertLevelStyles: Record<string, string> = {
  alto: 'bg-red-500/10 text-red-700',
  medio: 'bg-amber-500/10 text-amber-700',
  baixo: 'bg-emerald-500/10 text-emerald-700'
};

const parseDueDate = (value: string) => {
  if (!value) {
    return null;
  }
  const parts = value.split('/');
  if (parts.length !== 3) {
    return null;
  }
  const [day, month, year] = parts;
  const parsed = new Date(
    Number.parseInt(year, 10),
    Number.parseInt(month, 10) - 1,
    Number.parseInt(day, 10)
  );
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const formatDateLabel = (value: string) => {
  if (!value) {
    return '';
  }
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return format(parsed, 'dd/MM/yyyy');
};

const toInputDate = (value: string) => {
  if (!value) {
    return '';
  }
  const parts = value.split('/');
  if (parts.length !== 3) {
    return '';
  }
  const [day, month, year] = parts;
  return `${year}-${month}-${day}`;
};

const getWeekStart = (date: Date) => {
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const weekStart = new Date(date);
  weekStart.setDate(date.getDate() + diff);
  weekStart.setHours(0, 0, 0, 0);
  return weekStart;
};

const calculateWorkedHours = (records: {type: string; timestamp: any}[]) => {
  let totalMinutes = 0;
  let lastEntrada: Date | null = null;

  const sorted = [...records].sort((a, b) => {
    const timeA = a.timestamp?.toDate ? a.timestamp.toDate().getTime() : 0;
    const timeB = b.timestamp?.toDate ? b.timestamp.toDate().getTime() : 0;
    return timeA - timeB;
  });

  for (const record of sorted) {
    if (!record.timestamp?.toDate) continue;
    
    const recordDate = record.timestamp.toDate();

    if (record.type === 'Entrada') {
      lastEntrada = recordDate;
    } else if (record.type === 'Saída' && lastEntrada) {
      const diff = recordDate.getTime() - lastEntrada.getTime();
      totalMinutes += diff / (1000 * 60);
      lastEntrada = null;
    }
  }

  return totalMinutes / 60;
};

function NotFoundMember() {
  const router = useRouter();

  return (
    <div className='absolute top-1/2 left-1/2 mb-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center text-center'>
      <span className='from-foreground bg-linear-to-b to-transparent bg-clip-text text-[10rem] leading-none font-extrabold text-transparent'>
        404
      </span>
      <h2 className='font-heading my-2 text-2xl font-bold'>
        Você não está cadastrado
      </h2>
      <p>
        Seu email não está registrado no sistema.
      </p>
      <div className='mt-8 flex justify-center gap-2'>
        <Button onClick={() => router.push('/dashboard')} variant='default' size='lg'>
          Ir para Dashboard
        </Button>
      </div>
    </div>
  );
}

export default function IndividualPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [memberId, setMemberId] = React.useState('');
  const [memberNotFound, setMemberNotFound] = React.useState(false);
  const [isMemberLoading, setIsMemberLoading] = React.useState(true);
  const [isProjectTasksLoading, setIsProjectTasksLoading] = React.useState(true);
  const [selectedDay, setSelectedDay] = React.useState<Date | undefined>(
    new Date()
  );
  const [memberInfo, setMemberInfo] = React.useState<MemberInfo>({
    name: '',
    email: '',
    sector: '',
    cpf: '',
    role: ''
  });
  const [projectTasks, setProjectTasks] = React.useState<MemberTask[]>([]);
  const [agendaTasks, setAgendaTasks] = React.useState<MemberTask[]>([]);
  const [memberAlerts, setMemberAlerts] = React.useState<MemberAlert[]>(alerts);
  const [activeTask, setActiveTask] = React.useState<MemberTask | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = React.useState(false);
  const [isSavingEdit, setIsSavingEdit] = React.useState(false);
  const [timeRecords, setTimeRecords] = React.useState<{id: string; type: string; timestamp: any}[]>([]);
  const [isBatingPonto, setIsBatingPonto] = React.useState(false);
  const [editStatus, setEditStatus] = React.useState(statusOptions[1]);
  const [updateNote, setUpdateNote] = React.useState('');
  const [isSavingAgenda, setIsSavingAgenda] = React.useState(false);
  const [weekTimeRecords, setWeekTimeRecords] = React.useState<{id: string; type: string; timestamp: any}[]>([]);
  const [currentRunningTime, setCurrentRunningTime] = React.useState(0);
  const [agendaForm, setAgendaForm] = React.useState({
    date: '',
    title: '',
    description: '',
    priority: priorityOptions[1],
    status: statusOptions[0]
  });
  const allTasks = React.useMemo(
    () => [...agendaTasks, ...projectTasks],
    [agendaTasks, projectTasks]
  );
  const selectedDayLabel = selectedDay ? format(selectedDay, 'dd/MM/yyyy') : '';
  const tasksForDay = selectedDayLabel
    ? allTasks.filter((task) => task.due === selectedDayLabel)
    : [];
  const priorityByDate = React.useMemo(() => {
    const map = new Map<string, string>();
    allTasks.forEach((task) => {
      const parsed = parseDueDate(task.due);
      if (!parsed) {
        return;
      }
      const key = format(parsed, 'yyyy-MM-dd');
      const current = map.get(key);
      if (!current || priorityRank[task.priority] > priorityRank[current]) {
        map.set(key, task.priority);
      }
    });
    return map;
  }, [allTasks]);
  const calendarIndicators = React.useMemo(() => {
    const high: Date[] = [];
    const medium: Date[] = [];
    const low: Date[] = [];
    priorityByDate.forEach((priority, key) => {
      const parsed = new Date(`${key}T00:00:00`);
      if (Number.isNaN(parsed.getTime())) {
        return;
      }
      if (priority === 'Alta') {
        high.push(parsed);
      } else if (priority === 'Media') {
        medium.push(parsed);
      } else {
        low.push(parsed);
      }
    });
    return {
      highPriority: high,
      mediumPriority: medium,
      lowPriority: low
    };
  }, [priorityByDate]);

  React.useEffect(() => {
    if (!firebaseDb || authLoading || !user?.email) {
      return;
    }
    const db = firebaseDb;

    let isActive = true;
    setIsMemberLoading(true);
    
    const applyMemberSnapshot = (
      docId: string,
      data: Partial<MemberInfo> & {
        tasks?: MemberTask[];
        alerts?: MemberAlert[];
        agendaTasks?: MemberTask[];
      }
    ) => {
      setMemberId(docId);
      setMemberInfo({
        name: data.name ?? '',
        email: data.email ?? '',
        sector: data.sector ?? '',
        cpf: data.cpf ?? '',
        role: data.role ?? ''
      });
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const weekStart = getWeekStart(new Date());
      const allRecords = ((data as any).timeRecords || []) as {id: string; type: string; timestamp: any}[];
      
      console.log('=== DEBUG PONTO ===');
      console.log('Total de registros no Firestore:', allRecords.length);
      console.log('Data de hoje:', today);
      console.log('Início da semana (segunda-feira):', weekStart);
      
      const todayRecords = allRecords.filter((r: any) => {
        if (!r.timestamp?.toDate) return false;
        const recordDate = r.timestamp.toDate();
        return recordDate >= today && recordDate < tomorrow;
      });
      console.log('Registros de hoje filtrados:', todayRecords.length);
      setTimeRecords(todayRecords);
      
      const weekRecords = allRecords.filter((r: any) => {
        if (!r.timestamp?.toDate) return false;
        const recordDate = r.timestamp.toDate();
        const isInWeek = recordDate >= weekStart;
        if (isInWeek) {
          console.log('Registro da semana:', {
            type: r.type,
            date: recordDate.toLocaleString(),
            weekStart: weekStart.toLocaleString()
          });
        }
        return isInWeek;
      });
      console.log('Registros da semana filtrados:', weekRecords.length);
      console.log('===================');
      setWeekTimeRecords(weekRecords);
      
      if (Array.isArray(data.agendaTasks)) {
        setAgendaTasks(
          data.agendaTasks.map((task) => ({
            ...task,
            source: 'agenda'
          }))
        );
      } else {
        setAgendaTasks([]);
      }
      if (Array.isArray(data.alerts)) {
        setMemberAlerts(data.alerts);
      } else {
        setMemberAlerts(alerts);
      }
    };

    const loadMember = async () => {
      try {
        // Usar o UID do usuário para buscar o documento do membro
        const memberRef = doc(db, 'members', user.uid);
        const memberDoc = await getDoc(memberRef);
        
        if (memberDoc.exists() && isActive) {
          applyMemberSnapshot(
            memberDoc.id,
            memberDoc.data() as Partial<MemberInfo>
          );
        } else if (isActive) {
          setMemberNotFound(true);
        }
      } catch (error) {
        console.error('Falha ao carregar membro:', error);
        toast.error('Nao foi possivel carregar seus dados.');
      } finally {
        if (isActive) {
          setIsMemberLoading(false);
        }
      }
    };

    loadMember();

    return () => {
      isActive = false;
    };
  }, [user, authLoading]);

  React.useEffect(() => {
    if (!firebaseDb || !memberId) {
      return;
    }
    const db = firebaseDb;

    let isActive = true;
    setIsProjectTasksLoading(true);
    const loadTasks = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'projects'));
        if (!isActive) {
          return;
        }

        const tasksFromDb: MemberTask[] = [];
        snapshot.docs.forEach((docSnapshot) => {
          const data = docSnapshot.data() as {
            name?: string;
            Activities?: Array<{
              id: string;
              name: string;
              dueAt?: string;
              status?: string;
              priority?: string;
              ownerId?: string;
              owner?: string;
              description?: string;
              updates?: ActivityUpdate[];
            }>;
          };
          if (!Array.isArray(data.Activities)) {
            return;
          }

          data.Activities.forEach((activity) => {
            if (activity.ownerId !== memberId) {
              return;
            }

            tasksFromDb.push({
              id: `${docSnapshot.id}-${activity.id}`,
              activityId: activity.id,
              projectId: docSnapshot.id,
              projectName: data.name ?? 'Projeto',
              source: 'project',
              title: activity.name ?? 'Tarefa',
              due: activity.dueAt ?? '',
              status: activity.status ?? 'Planejado',
              priority: activity.priority ?? 'Media',
              owner: activity.owner,
              ownerId: activity.ownerId,
              description: activity.description,
              updates: Array.isArray(activity.updates) ? activity.updates : []
            });
          });
        });

        setProjectTasks(tasksFromDb);
      } catch (error) {
        console.error('Falha ao carregar tarefas:', error);
        toast.error('Nao foi possivel carregar tarefas.');
      } finally {
        if (isActive) {
          setIsProjectTasksLoading(false);
        }
      }
    };

    loadTasks();

    return () => {
      isActive = false;
    };
  }, [memberId]);

  React.useEffect(() => {
    const hasActiveEntry = timeRecords.length > 0 && timeRecords[timeRecords.length - 1].type === 'Entrada';
    
    if (!hasActiveEntry) {
      setCurrentRunningTime(0);
      return;
    }

    const lastEntry = timeRecords[timeRecords.length - 1];
    if (!lastEntry.timestamp?.toDate) {
      setCurrentRunningTime(0);
      return;
    }

    const entryTime = lastEntry.timestamp.toDate();

    const interval = setInterval(() => {
      const now = new Date();
      const diffMs = now.getTime() - entryTime.getTime();
      const diffSeconds = Math.floor(diffMs / 1000);
      setCurrentRunningTime(diffSeconds);
    }, 1000);

    return () => clearInterval(interval);
  }, [timeRecords]);

  const handleTaskClick = (task: MemberTask) => {
    setActiveTask(task);
    setEditStatus(task.status ?? statusOptions[1]);
    setUpdateNote('');
    setIsTaskModalOpen(true);
  };

  const handleUpdateTask = async () => {
    if (!activeTask?.projectId || !activeTask.activityId) {
      if (activeTask?.source !== 'agenda') {
        toast.error('Atividade nao encontrada.');
        return;
      }
    }
    if (!firebaseDb) {
      toast.error('Firebase nao configurado.');
      return;
    }
    const db = firebaseDb;
    setIsSavingEdit(true);
    try {
      if (activeTask?.source === 'agenda' || !activeTask.projectId) {
        if (!memberId) {
          toast.error('Membro nao encontrado.');
          return;
        }
        const memberRef = doc(db, 'members', memberId);
        const memberSnapshot = await getDoc(memberRef);
        if (!memberSnapshot.exists()) {
          toast.error('Membro nao encontrado.');
          return;
        }

        const memberData = memberSnapshot.data() as {
          agendaTasks?: MemberTask[];
        };
        const noteValue = updateNote.trim();
        const updateId =
          typeof crypto !== 'undefined' && crypto.randomUUID
            ? crypto.randomUUID()
            : `update-${Date.now()}`;
        const updateEntry: ActivityUpdate | null = noteValue
          ? {
              id: updateId,
              author: memberInfo.name || 'Membro',
              authorId: memberId || undefined,
              note: noteValue,
              time: format(new Date(), 'dd/MM/yyyy HH:mm')
            }
          : null;

        const existingAgenda = Array.isArray(memberData.agendaTasks)
          ? memberData.agendaTasks
          : [];
        const nextAgenda = existingAgenda.map((task) => {
          if (task.id !== activeTask.id) {
            return task;
          }
          const existingUpdates = Array.isArray(task.updates)
            ? task.updates
            : [];
          return {
            ...task,
            source: 'agenda',
            status: editStatus,
            updates: updateEntry
              ? [updateEntry, ...existingUpdates]
              : existingUpdates
          };
        });

        await updateDoc(memberRef, {
          agendaTasks: nextAgenda,
          updatedAt: serverTimestamp()
        });

        setAgendaTasks((current) =>
          current.map((task) =>
            task.id === activeTask.id
              ? {
                  ...task,
                  status: editStatus,
                  updates: updateEntry
                    ? [updateEntry, ...(task.updates ?? [])]
                    : task.updates
                }
              : task
          )
        );
        setActiveTask((current) =>
          current
            ? {
                ...current,
                status: editStatus,
                updates: updateEntry
                  ? [updateEntry, ...(current.updates ?? [])]
                  : current.updates
              }
            : current
        );
        setUpdateNote('');
        toast.success('Atualizacao registrada.');
        return;
      }

      const projectRef = doc(db, 'projects', activeTask.projectId);
      const snapshot = await getDoc(projectRef);
      if (!snapshot.exists()) {
        toast.error('Projeto nao encontrado.');
        return;
      }

      const data = snapshot.data() as { Activities?: MemberTask[] };
      const noteValue = updateNote.trim();
      const updateId =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `update-${Date.now()}`;
      const updateEntry: ActivityUpdate | null = noteValue
        ? {
            id: updateId,
            author: memberInfo.name || 'Membro',
            authorId: memberId || undefined,
            note: noteValue,
            time: format(new Date(), 'dd/MM/yyyy HH:mm')
          }
        : null;

      const nextActivities = Array.isArray(data.Activities)
        ? data.Activities.map((activity) => {
            if (activity.id !== activeTask.activityId) {
              return activity;
            }
            const existingUpdates = Array.isArray(activity.updates)
              ? activity.updates
              : [];
            return {
              ...activity,
              status: editStatus,
              updates: updateEntry
                ? [updateEntry, ...existingUpdates]
                : existingUpdates
            };
          })
        : [];

      await updateDoc(projectRef, {
        Activities: nextActivities,
        updatedAt: serverTimestamp()
      });

      setProjectTasks((current) =>
        current.map((task) =>
          task.id === activeTask.id
            ? {
                ...task,
                status: editStatus,
                updates: updateEntry
                  ? [updateEntry, ...(task.updates ?? [])]
                  : task.updates
              }
            : task
        )
      );
      setActiveTask((current) =>
        current
          ? {
              ...current,
              status: editStatus,
              updates: updateEntry
                ? [updateEntry, ...(current.updates ?? [])]
                : current.updates
            }
          : current
      );
      setUpdateNote('');
      toast.success('Atividade atualizada.');
    } catch (error) {
      console.error('Falha ao atualizar atividade:', error);
      toast.error('Nao foi possivel atualizar a atividade.');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleBaterPonto = async () => {
    if (!firebaseDb || !memberId) return;

    setIsBatingPonto(true);
    try {
      const type = timeRecords.length === 0 || timeRecords[timeRecords.length - 1].type === 'Saída' ? 'Entrada' : 'Saída';
      
      const newRecord = {
        id: `${Date.now()}`,
        type,
        timestamp: Timestamp.now()
      };

      const memberRef = doc(firebaseDb, 'members', memberId);
      const memberDoc = await getDoc(memberRef);
      const currentRecords = (memberDoc.data()?.timeRecords || []) as any[];
      
      await updateDoc(memberRef, {
        timeRecords: [...currentRecords, newRecord],
        updatedAt: serverTimestamp()
      });

      const localRecord = {
        ...newRecord,
        timestamp: { toDate: () => newRecord.timestamp.toDate() }
      };
      
      setTimeRecords(prev => [...prev, localRecord]);
      setWeekTimeRecords(prev => [...prev, localRecord]);
      toast.success(`${type} registrada`);
    } catch (error) {
      console.error('Erro ao bater ponto:', error);
      toast.error('Erro ao registrar ponto');
    } finally {
      setIsBatingPonto(false);
    }
  };

  const handleAddAgendaTask = async () => {
    if (!agendaForm.title.trim()) {
      toast.error('Informe o nome da atividade.');
      return;
    }
    if (!agendaForm.date) {
      toast.error('Informe a data.');
      return;
    }
    if (!firebaseDb) {
      toast.error('Firebase nao configurado.');
      return;
    }
    if (!memberId) {
      toast.error('Membro nao encontrado.');
      return;
    }

    const db = firebaseDb;
    const memberRef = doc(db, 'members', memberId);
    setIsSavingAgenda(true);
    try {
      const snapshot = await getDoc(memberRef);
      if (!snapshot.exists()) {
        toast.error('Membro nao encontrado.');
        return;
      }

      const taskId =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `agenda-${Date.now()}`;
      const agendaTask: MemberTask = {
        id: taskId,
        source: 'agenda',
        title: agendaForm.title.trim(),
        due: formatDateLabel(agendaForm.date),
        status: agendaForm.status,
        priority: agendaForm.priority,
        description: agendaForm.description.trim(),
        updates: []
      };

      const data = snapshot.data() as { agendaTasks?: MemberTask[] };
      const existingAgenda = Array.isArray(data.agendaTasks)
        ? data.agendaTasks
        : [];
      const nextAgenda = [agendaTask, ...existingAgenda];

      await updateDoc(memberRef, {
        agendaTasks: nextAgenda,
        updatedAt: serverTimestamp()
      });

      setAgendaTasks((current) => [agendaTask, ...current]);
      setAgendaForm({
        date: '',
        title: '',
        description: '',
        priority: priorityOptions[1],
        status: statusOptions[0]
      });
      toast.success('Agenda adicionada.');
    } catch (error) {
      console.error('Falha ao salvar agenda:', error);
      toast.error('Nao foi possivel salvar a agenda.');
    } finally {
      setIsSavingAgenda(false);
    }
  };

  if (authLoading) {
    return (
      <div className='flex h-screen items-center justify-center'>
        <div className='text-center'>
          <div className='inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]' />
          <p className='mt-4 text-muted-foreground'>Carregando...</p>
        </div>
      </div>
    );
  }

  if (memberNotFound) {
    return <NotFoundMember />;
  }

  return (
    <PageContainer
      pageTitle={memberInfo.name || 'Individual'}
      pageDescription='Tarefas, calendario e alertas'
      hideHeaderOnMobile
    >
      <div className='flex flex-1 flex-col space-y-3 md:space-y-4'>
        {/* Mobile Tabs */}
        <div className='block lg:hidden'>
          <Tabs defaultValue='tasks' className='w-full'>
            <TabsList className='grid w-full grid-cols-4 h-auto'>
              <TabsTrigger value='tasks' className='text-xs py-2'>Tarefas</TabsTrigger>
              <TabsTrigger value='calendar' className='text-xs py-2'>Calendário</TabsTrigger>
              <TabsTrigger value='agenda' className='text-xs py-2'>Agenda</TabsTrigger>
              <TabsTrigger value='ponto' className='text-xs py-2'>Ponto</TabsTrigger>
            </TabsList>

            {/* Tarefas Tab */}
            <TabsContent value='tasks' className='mt-3'>
              <Card>
                <CardHeader className='pb-3'>
                  <CardTitle className='text-lg md:text-xl'>Lista de tarefas</CardTitle>
                  <CardDescription className='text-xs md:text-sm'>Atividades da semana</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className='space-y-2'>
                    {isProjectTasksLoading ? (
                      <div className='space-y-2'>
                        {Array.from({ length: 4 }).map((_, index) => (
                          <div key={`task-skeleton-${index}`} className='rounded-lg border p-3'>
                            <Skeleton className='h-4 w-2/3' />
                            <Skeleton className='mt-2 h-3 w-1/3' />
                          </div>
                        ))}
                      </div>
                    ) : allTasks.length === 0 ? (
                      <div className='text-muted-foreground text-sm py-8 text-center'>
                        Nenhuma tarefa encontrada.
                      </div>
                    ) : (
                      <Accordion type='single' collapsible className='w-full'>
                        {allTasks.map((task) => (
                          <AccordionItem key={task.id} value={task.id}>
                            <AccordionTrigger className='hover:no-underline py-3'>
                              <div className='flex items-start justify-between gap-2 w-full pr-2'>
                                <div className='flex flex-col items-start text-left'>
                                  <span className='text-sm font-medium line-clamp-1'>
                                    {task.title}
                                  </span>
                                  <span className='text-muted-foreground text-xs'>
                                    {task.due}
                                  </span>
                                </div>
                                <div className='flex flex-col items-end gap-1 flex-shrink-0'>
                                  <Badge className={`${statusStyles[task.status]} text-[10px] px-1.5 py-0`}>
                                    {task.status}
                                  </Badge>
                                  <Badge className={`${priorityStyles[task.priority]} text-[10px] px-1.5 py-0`}>
                                    {task.priority}
                                  </Badge>
                                </div>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent>
                              <div className='space-y-2 pt-2'>
                                <div className='flex justify-end'>
                                  <Button
                                    onClick={() => handleTaskClick(task)}
                                    size='sm'
                                  >
                                    Detalhes
                                  </Button>
                                </div>
                                {task.description && (
                                  <p className='text-sm text-muted-foreground text-justify break-all md:break-words'>
                                    {task.description}
                                  </p>
                                )}
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Calendar Tab */}
            <TabsContent value='calendar' className='mt-3'>
              <Card>
                <CardHeader className='pb-3'>
                  <CardTitle className='text-lg md:text-xl'>Calendário</CardTitle>
                  <CardDescription className='text-xs md:text-sm'>Dias com atividades</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className='space-y-3'>
                    {isProjectTasksLoading ? (
                      <Skeleton className='h-80 w-full' />
                    ) : (
                      <div className='flex justify-center'>
                        <Calendar
                          mode='single'
                          selected={selectedDay}
                          onSelect={setSelectedDay}
                          modifiers={calendarIndicators}
                          modifiersClassNames={{
                            highPriority:
                              "relative after:absolute after:bottom-1 after:left-1/2 after:h-1.5 after:w-1.5 after:-translate-x-1/2 after:rounded-full after:bg-red-500/60 after:content-['']",
                            mediumPriority:
                              "relative after:absolute after:bottom-1 after:left-1/2 after:h-1.5 after:w-1.5 after:-translate-x-1/2 after:rounded-full after:bg-amber-500/60 after:content-['']",
                            lowPriority:
                              "relative after:absolute after:bottom-1 after:left-1/2 after:h-1.5 after:w-1.5 after:-translate-x-1/2 after:rounded-full after:bg-emerald-500/60 after:content-['']"
                          }}
                          className='rounded-md border'
                        />
                      </div>
                    )}
                    
                    <div className='rounded-lg border p-3'>
                      <div className='text-muted-foreground text-xs font-semibold uppercase mb-2'>
                        Atividades do dia
                      </div>
                      <div className='text-sm font-medium mb-3'>
                        {selectedDayLabel || 'Selecione uma data'}
                      </div>
                      <div className='space-y-2'>
                        {isProjectTasksLoading ? (
                          <div className='space-y-2'>
                            {Array.from({ length: 2 }).map((_, index) => (
                              <div key={`day-skeleton-${index}`} className='rounded-md border p-2'>
                                <Skeleton className='h-3 w-3/4' />
                                <Skeleton className='mt-2 h-3 w-1/3' />
                              </div>
                            ))}
                          </div>
                        ) : tasksForDay.length === 0 ? (
                          <div className='text-muted-foreground text-sm text-center py-4'>
                            Nenhuma atividade para este dia.
                          </div>
                        ) : (
                          tasksForDay.map((task) => (
                            <button
                              key={task.id}
                              type='button'
                              onClick={() => handleTaskClick(task)}
                              className='hover:bg-accent w-full rounded-lg border p-3 text-left transition-colors active:scale-95'
                            >
                              <div className='flex items-start justify-between gap-2'>
                                <div className='flex flex-col'>
                                  <span className='text-sm font-medium line-clamp-1'>
                                    {task.title}
                                  </span>
                                  <span className='text-muted-foreground text-xs'>
                                    {task.due}
                                  </span>
                                </div>
                                <div className='flex flex-col items-end gap-1 flex-shrink-0'>
                                  <Badge className={`${statusStyles[task.status]} text-[10px] px-1.5`}>
                                    {task.status}
                                  </Badge>
                                  <Badge className={`${priorityStyles[task.priority]} text-[10px] px-1.5`}>
                                    {task.priority}
                                  </Badge>
                                </div>
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Agenda Tab */}
            <TabsContent value='agenda' className='mt-3'>
              <Card>
                <CardHeader className='pb-3'>
                  <CardTitle className='text-lg md:text-xl'>Agenda</CardTitle>
                  <CardDescription className='text-xs md:text-sm'>Novo compromisso</CardDescription>
                </CardHeader>
                <CardContent>
                  {isMemberLoading ? (
                    <div className='space-y-3'>
                      <Skeleton className='h-4 w-1/3' />
                      <Skeleton className='h-10 w-full' />
                      <Skeleton className='h-4 w-1/3' />
                      <Skeleton className='h-10 w-full' />
                      <Skeleton className='h-4 w-1/3' />
                      <Skeleton className='h-24 w-full' />
                    </div>
                  ) : (
                    <div className='space-y-3'>
                      <div className='space-y-2'>
                        <label className='text-sm font-medium' htmlFor='agendaDate'>
                          Data
                        </label>
                        <Input
                          id='agendaDate'
                          type='date'
                          value={agendaForm.date}
                          disabled={isSavingAgenda}
                          onChange={(event) =>
                            setAgendaForm((current) => ({
                              ...current,
                              date: event.target.value
                            }))
                          }
                          className='h-11'
                        />
                      </div>
                      
                      <div className='space-y-2'>
                        <label className='text-sm font-medium' htmlFor='agendaTitle'>
                          Nome da atividade
                        </label>
                        <Input
                          id='agendaTitle'
                          placeholder='Ex: Visita tecnica'
                          value={agendaForm.title}
                          disabled={isSavingAgenda}
                          onChange={(event) =>
                            setAgendaForm((current) => ({
                              ...current,
                              title: event.target.value
                            }))
                          }
                          className='h-11'
                        />
                      </div>

                      <div className='space-y-2'>
                        <label className='text-sm font-medium' htmlFor='agendaNotes'>
                          Descrição
                        </label>
                        <Textarea
                          id='agendaNotes'
                          placeholder='Detalhes do compromisso'
                          className='min-h-20'
                          value={agendaForm.description}
                          disabled={isSavingAgenda}
                          onChange={(event) =>
                            setAgendaForm((current) => ({
                              ...current,
                              description: event.target.value
                            }))
                          }
                        />
                      </div>

                      <div className='grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] items-end gap-3'>
                        <div className='space-y-2'>
                          <label className='text-sm font-medium'>Prioridade</label>
                          <Select
                            value={agendaForm.priority}
                            disabled={isSavingAgenda}
                            onValueChange={(value) =>
                              setAgendaForm((current) => ({
                                ...current,
                                priority: value
                              }))
                            }
                          >
                            <SelectTrigger className='h-11'>
                              <SelectValue placeholder='Prioridade' />
                            </SelectTrigger>
                            <SelectContent>
                              {priorityOptions.map((priority) => (
                                <SelectItem key={priority} value={priority}>
                                  {priority}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className='space-y-2'>
                          <label className='text-sm font-medium'>Status</label>
                          <Select
                            value={agendaForm.status}
                            disabled={isSavingAgenda}
                            onValueChange={(value) =>
                              setAgendaForm((current) => ({
                                ...current,
                                status: value
                              }))
                            }
                          >
                            <SelectTrigger className='h-11'>
                              <SelectValue placeholder='Status' />
                            </SelectTrigger>
                            <SelectContent>
                              {statusOptions.map((status) => (
                                <SelectItem key={status} value={status}>
                                  {status}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className='space-y-2'>
                          <span className='text-sm font-medium opacity-0'>Adicionar</span>
                          <Button
                            type='button'
                            onClick={handleAddAgendaTask}
                            disabled={isSavingAgenda}
                            className='h-11 w-11 rounded-md p-0'
                            size='icon'
                            aria-label='Adicionar'
                          >
                            +
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Ponto Tab */}
            <TabsContent value='ponto' className='mt-3'>
              <Card>
                <CardHeader className='pb-3'>
                  <CardTitle className='text-lg md:text-xl'>Ponto</CardTitle>
                  <CardDescription className='text-xs md:text-sm'>Horas semanais (seg-dom)</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className='flex flex-col gap-4'>
                    {(() => {
                      const baseWorkedHours = calculateWorkedHours(weekTimeRecords);
                      const runningHours = currentRunningTime / 3600;
                      const workedHours = baseWorkedHours + runningHours;
                      const isPaid = workedHours >= 4;
                      const progressPercent = Math.min((workedHours / 4) * 100, 100);
                      const hasActiveEntry = timeRecords.length > 0 && timeRecords[timeRecords.length - 1].type === 'Entrada';

                      return (
                        <>
                          <div className='text-center py-4'>
                            <div className='text-4xl md:text-5xl font-bold'>
                              {workedHours.toFixed(2)}h
                            </div>
                            <div className='text-muted-foreground text-xs mt-1'>
                              de 4h trabalhadas
                            </div>
                          </div>

                          <div className='space-y-2'>
                            <Progress value={progressPercent} className='h-2.5' />
                            <div className='flex justify-between text-xs text-muted-foreground'>
                              <span>0h</span>
                              <span>4h</span>
                            </div>
                          </div>

                          {isPaid && hasActiveEntry && (
                            <div className='rounded-lg border border-amber-500 bg-amber-500/10 p-3 text-center'>
                              <div className='text-amber-600 font-semibold text-sm'>
                                ⚠ Entrada ativa com 4h+ trabalhadas
                              </div>
                              <div className='text-muted-foreground text-xs mt-1'>
                                Registre a saída para contabilizar
                              </div>
                            </div>
                          )}

                          {isPaid && !hasActiveEntry && (
                            <div className='rounded-lg border border-green-500 bg-green-500/10 p-3 text-center'>
                              <div className='text-green-600 font-semibold text-sm'>
                                ✔ Horas semanais pagas
                              </div>
                              <div className='text-muted-foreground text-xs mt-1'>
                                {workedHours.toFixed(2)}h / 4h completadas
                              </div>
                            </div>
                          )}

                          <Button
                            onClick={handleBaterPonto}
                            disabled={isBatingPonto}
                            className='w-full h-12'
                            size='lg'
                          >
                            {isBatingPonto ? 'Registrando...' : timeRecords.length === 0 || timeRecords[timeRecords.length - 1].type === 'Saída' ? 'Registrar Entrada' : 'Registrar Saída'}
                          </Button>

                          <div className='space-y-2 mt-4'>
                            <div className='text-muted-foreground text-xs font-medium uppercase'>
                              Registros de Hoje
                            </div>
                            {timeRecords.length === 0 ? (
                              <div className='text-muted-foreground text-sm text-center py-6 border rounded-lg'>
                                Nenhum registro hoje
                              </div>
                            ) : (
                              <div className='space-y-2'>
                                {timeRecords.map((record) => (
                                  <div key={record.id} className='flex items-center justify-between rounded-lg border p-3'>
                                    <span className='text-sm font-medium'>{record.type}</span>
                                    <span className='text-muted-foreground text-sm font-mono'>
                                      {record.timestamp?.toDate ? format(record.timestamp.toDate(), 'HH:mm:ss') : '--:--:--'}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Desktop Grid */}
        <div className='hidden lg:grid lg:grid-cols-2 gap-4'>
          <Card className='h-105'>
            <CardHeader>
              <CardTitle>Lista de tarefas</CardTitle>
              <CardDescription>Atividades da semana</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className='h-56 pr-3'>
                <div className='space-y-2'>
                  {isProjectTasksLoading ? (
                    <div className='space-y-2'>
                      {Array.from({ length: 4 }).map((_, index) => (
                        <div key={`task-skeleton-${index}`} className='rounded-md border p-3'>
                          <Skeleton className='h-4 w-2/3' />
                          <Skeleton className='mt-2 h-3 w-1/3' />
                        </div>
                      ))}
                    </div>
                  ) : allTasks.length === 0 ? (
                    <div className='text-muted-foreground text-sm'>
                      Nenhuma tarefa encontrada.
                    </div>
                  ) : (
                    allTasks.map((task) => (
                      <button
                        key={task.id}
                        type='button'
                        onClick={() => handleTaskClick(task)}
                        className='hover:bg-accent focus-visible:ring-ring/50 w-full cursor-pointer rounded-md border p-3 text-left transition-colors focus-visible:ring-[3px] focus-visible:outline-none'
                      >
                        <div className='flex items-start justify-between gap-3'>
                          <div className='flex flex-col'>
                            <span className='text-sm font-medium'>
                              {task.title}
                            </span>
                            <span className='text-muted-foreground text-xs'>
                              Prazo: {task.due}
                            </span>
                            {task.description ? (
                              <span className='text-muted-foreground text-justify text-xs line-clamp-2 break-all'>
                                {task.description}
                              </span>
                            ) : null}
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
                      </button>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          <Card className='h-105'>
            <CardHeader>
              <CardTitle>Calendario</CardTitle>
              <CardDescription>Dias clicaveis para agenda</CardDescription>
            </CardHeader>
            <CardContent>
              <div className='grid gap-4 md:grid-cols-[260px_minmax(0,1fr)]'>
                {isProjectTasksLoading ? (
                  <Skeleton className='h-77.5 w-full' />
                ) : (
                  <Calendar
                    mode='single'
                    selected={selectedDay}
                    onSelect={setSelectedDay}
                    modifiers={calendarIndicators}
                    modifiersClassNames={{
                      highPriority:
                        "relative after:absolute after:bottom-1 after:left-1/2 after:h-1.5 after:w-1.5 after:-translate-x-1/2 after:rounded-full after:bg-red-500/60 after:content-['']",
                      mediumPriority:
                        "relative after:absolute after:bottom-1 after:left-1/2 after:h-1.5 after:w-1.5 after:-translate-x-1/2 after:rounded-full after:bg-amber-500/60 after:content-['']",
                      lowPriority:
                        "relative after:absolute after:bottom-1 after:left-1/2 after:h-1.5 after:w-1.5 after:-translate-x-1/2 after:rounded-full after:bg-emerald-500/60 after:content-['']"
                    }}
                  />
                )}
                <div className='flex flex-col rounded-md border p-3'>
                  <div className='text-muted-foreground text-xs font-semibold uppercase'>
                    Atividades do dia
                  </div>
                  <div className='mt-1 text-sm font-medium'>
                    {selectedDayLabel || 'Selecione uma data'}
                  </div>
                  <ScrollArea className='mt-3 h-48 pr-2'>
                    <div className='space-y-2'>
                      {isProjectTasksLoading ? (
                        <div className='space-y-2'>
                          {Array.from({ length: 3 }).map((_, index) => (
                            <div key={`day-skeleton-${index}`} className='rounded-md border p-2'>
                              <Skeleton className='h-3 w-3/4' />
                              <Skeleton className='mt-2 h-3 w-1/3' />
                            </div>
                          ))}
                        </div>
                      ) : tasksForDay.length === 0 ? (
                        <div className='text-muted-foreground text-sm'>
                          Nenhuma atividade para este dia.
                        </div>
                      ) : (
                        tasksForDay.map((task) => (
                          <button
                            key={task.id}
                            type='button'
                            onClick={() => handleTaskClick(task)}
                            className='hover:bg-accent focus-visible:ring-ring/50 w-full cursor-pointer rounded-md border p-2 text-left transition-colors focus-visible:ring-[3px] focus-visible:outline-none'
                          >
                            <div className='flex items-start justify-between gap-3'>
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
                          </button>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className='h-105'>
            <CardHeader>
              <CardTitle>Agenda</CardTitle>
              <CardDescription>Novo compromisso</CardDescription>
            </CardHeader>
            <CardContent>
              <div className='space-y-3 rounded-md border p-4'>
                {isMemberLoading ? (
                  <div className='space-y-3'>
                    <Skeleton className='h-4 w-1/3' />
                    <Skeleton className='h-9 w-full' />
                    <Skeleton className='h-4 w-1/3' />
                    <Skeleton className='h-9 w-full' />
                    <Skeleton className='h-4 w-1/3' />
                    <Skeleton className='h-24 w-full' />
                  </div>
                ) : (
                <>
                <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
                  <div className='space-y-1'>
                    <label className='text-sm font-medium' htmlFor='agendaDate'>
                      Data
                    </label>
                    <Input
                      id='agendaDate'
                      type='date'
                      value={agendaForm.date}
                      disabled={isSavingAgenda}
                      onChange={(event) =>
                        setAgendaForm((current) => ({
                          ...current,
                          date: event.target.value
                        }))
                      }
                    />
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
                      value={agendaForm.title}
                      disabled={isSavingAgenda}
                      onChange={(event) =>
                        setAgendaForm((current) => ({
                          ...current,
                          title: event.target.value
                        }))
                      }
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
                    value={agendaForm.description}
                    disabled={isSavingAgenda}
                    onChange={(event) =>
                      setAgendaForm((current) => ({
                        ...current,
                        description: event.target.value
                      }))
                    }
                  />
                </div>
                <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
                  <div className='space-y-1'>
                    <label className='text-sm font-medium'>Prioridade</label>
                    <Select
                      value={agendaForm.priority}
                      disabled={isSavingAgenda}
                      onValueChange={(value) =>
                        setAgendaForm((current) => ({
                          ...current,
                          priority: value
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder='Prioridade' />
                      </SelectTrigger>
                      <SelectContent>
                        {priorityOptions.map((priority) => (
                          <SelectItem key={priority} value={priority}>
                            {priority}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className='space-y-1'>
                    <label className='text-sm font-medium'>Status</label>
                    <Select
                      value={agendaForm.status}
                      disabled={isSavingAgenda}
                      onValueChange={(value) =>
                        setAgendaForm((current) => ({
                          ...current,
                          status: value
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder='Status' />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map((status) => (
                          <SelectItem key={status} value={status}>
                            {status}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className='flex justify-end'>
                  <Button
                    type='button'
                    onClick={handleAddAgendaTask}
                    disabled={isSavingAgenda}
                  >
                    {isSavingAgenda ? 'Salvando...' : 'Adicionar'}
                  </Button>
                </div>
                </>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className='h-105'>
            <CardHeader>
              <CardTitle>Ponto</CardTitle>
              <CardDescription>Horas semanais (seg-dom)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className='flex flex-col gap-4'>
                {(() => {
                  const baseWorkedHours = calculateWorkedHours(weekTimeRecords);
                  const runningHours = currentRunningTime / 3600;
                  const workedHours = baseWorkedHours + runningHours;
                  const isPaid = workedHours >= 4;
                  const progressPercent = Math.min((workedHours / 4) * 100, 100);
                  const hasActiveEntry = timeRecords.length > 0 && timeRecords[timeRecords.length - 1].type === 'Entrada';

                  return (
                    <>
                      {isPaid && hasActiveEntry ? (
                        <>
                          <div className='rounded-md border border-amber-500 bg-amber-500/10 p-4 text-center'>
                            <div className='text-amber-600 font-semibold text-sm'>
                              ⚠ Entrada ativa com 4h+ trabalhadas
                            </div>
                            <div className='text-muted-foreground text-xs mt-1'>
                              Registre a saída para contabilizar as horas pagas
                            </div>
                          </div>
                          
                          <Button
                            onClick={handleBaterPonto}
                            disabled={isBatingPonto}
                            className='w-full'
                            size='lg'
                            variant='default'
                          >
                            {isBatingPonto ? 'Registrando...' : 'Registrar Saída'}
                          </Button>
                          
                          <div className='text-center'>
                            <div className='text-3xl font-bold'>
                              {workedHours.toFixed(2)}h
                            </div>
                            <div className='text-muted-foreground text-xs'>
                              de 4h trabalhadas
                            </div>
                          </div>
                          
                          <div className='space-y-2'>
                            <Progress value={progressPercent} className='h-3' />
                            <div className='flex justify-between text-xs text-muted-foreground'>
                              <span>0h</span>
                              <span>4h</span>
                            </div>
                          </div>
                        </>
                      ) : isPaid ? (
                        <div className='rounded-md border border-green-500 bg-green-500/10 p-4 text-center'>
                          <div className='text-green-600 font-semibold text-sm'>
                            ✔ Horas semanais pagas
                          </div>
                          <div className='text-muted-foreground text-xs mt-1'>
                            {workedHours.toFixed(2)}h / 4h completadas
                          </div>
                        </div>
                      ) : (
                        <>
                          <Button
                            onClick={handleBaterPonto}
                            disabled={isBatingPonto}
                            className='w-full'
                            size='lg'
                          >
                            {isBatingPonto ? 'Registrando...' : timeRecords.length === 0 || timeRecords[timeRecords.length - 1].type === 'Saída' ? 'Registrar Entrada' : 'Registrar Saída'}
                          </Button>
                          
                          <div className='text-center'>
                            <div className='text-3xl font-bold'>
                              {workedHours.toFixed(2)}h
                            </div>
                            <div className='text-muted-foreground text-xs'>
                              de 4h trabalhadas
                            </div>
                          </div>
                          
                          <div className='space-y-2'>
                            <Progress value={progressPercent} className='h-3' />
                            <div className='flex justify-between text-xs text-muted-foreground'>
                              <span>0h</span>
                              <span>4h</span>
                            </div>
                          </div>
                        </>
                      )}

                      <ScrollArea className='h-32'>
                        <div className='space-y-2'>
                          <div className='text-muted-foreground text-xs font-medium'>Hoje</div>
                          {timeRecords.length === 0 ? (
                            <div className='text-muted-foreground text-xs text-center py-4'>
                              Nenhum registro hoje
                            </div>
                          ) : (
                            timeRecords.map((record) => (
                              <div key={record.id} className='flex items-center justify-between rounded-md border p-2'>
                                <span className='text-sm font-medium'>{record.type}</span>
                                <span className='text-muted-foreground text-xs'>
                                  {record.timestamp?.toDate ? format(record.timestamp.toDate(), 'HH:mm:ss') : '--:--:--'}
                                </span>
                              </div>
                            ))
                          )}
                        </div>
                      </ScrollArea>
                    </>
                  );
                })()}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <Dialog open={isTaskModalOpen} onOpenChange={setIsTaskModalOpen}>
        <DialogContent className='max-w-[95vw] md:max-w-2xl max-h-[90vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle className='text-lg md:text-xl pr-8'>{activeTask?.title ?? 'Atividade'}</DialogTitle>
            <DialogDescription className='text-xs md:text-sm'>
              {activeTask?.projectName
                ? `Projeto: ${activeTask.projectName}`
                : 'Detalhes da atividade'}
            </DialogDescription>
          </DialogHeader>
          <div className='grid gap-3 md:gap-4'>
            <div className='grid grid-cols-2 gap-2'>
              <div className='rounded-lg border p-3 text-sm'>
                <div className='text-muted-foreground text-xs mb-1'>Prazo</div>
                <div className='font-medium text-xs md:text-sm'>{activeTask?.due || '--'}</div>
              </div>
              <div className='rounded-lg border p-3 text-sm'>
                <div className='text-muted-foreground text-xs mb-1'>Prioridade</div>
                {activeTask ? (
                  <Badge className={`${priorityStyles[activeTask.priority]} text-xs`}>
                    {activeTask.priority}
                  </Badge>
                ) : (
                  <span className='text-muted-foreground text-xs'>--</span>
                )}
              </div>
            </div>

            <details className='rounded-lg border p-3 text-sm'>
              <summary className='cursor-pointer text-sm font-medium'>Descrição</summary>
              <div className='mt-2 text-sm text-justify break-all whitespace-pre-wrap'>
                {activeTask?.description?.trim() || 'Sem descrição'}
              </div>
            </details>
            
            <div className='grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3'>
              <div className='space-y-2'>
                <label className='text-sm font-medium'>Status</label>
                <Select
                  value={editStatus}
                  disabled={isSavingEdit}
                  onValueChange={setEditStatus}
                >
                  <SelectTrigger className='h-11'>
                    <SelectValue placeholder='Status' />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                type='button'
                onClick={handleUpdateTask}
                disabled={isSavingEdit}
                className='h-11 w-11 rounded-md p-0'
                size='icon'
                aria-label='Salvar atualização'
              >
                +
              </Button>
            </div>
            
            <div className='space-y-2'>
              <label className='text-sm font-medium'>Adicionar atualização</label>
              <Textarea
                placeholder='Descreva sua atualização'
                className='min-h-20'
                value={updateNote}
                disabled={isSavingEdit}
                onChange={(event) => setUpdateNote(event.target.value)}
              />
            </div>
            
            <div className='rounded-lg border p-3'>
              <div className='text-sm font-medium mb-3'>Atualizações anteriores</div>
              <div className='space-y-2 max-h-60 overflow-y-auto'>
                {activeTask?.updates && activeTask.updates.length > 0 ? (
                  activeTask.updates.map((update) => (
                    <div key={update.id} className='rounded-lg border bg-muted/30 p-3'>
                      <div className='flex items-start justify-between gap-2 mb-1'>
                        <div className='text-xs font-medium'>
                          {update.author}
                        </div>
                        <div className='text-muted-foreground text-[10px]'>
                          {update.time}
                        </div>
                      </div>
                      <div className='text-sm text-justify pr-3'>
                        {update.note}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className='text-muted-foreground text-sm text-center py-4'>
                    Sem atualizações
                  </div>
                )}
              </div>
            </div>
          </div>
          {activeTask?.projectId ? (
            <DialogFooter className='flex-col gap-2 sm:flex-row sm:gap-0'>
              <Button asChild type='button' variant='secondary' className='w-full sm:w-auto'>
                <Link
                  href={`/dashboard/acompanhamento/projetos/${activeTask.projectId}`}
                >
                  Abrir projeto
                </Link>
              </Button>
            </DialogFooter>
          ) : null}
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
