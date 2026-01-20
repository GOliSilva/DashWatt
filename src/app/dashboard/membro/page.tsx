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
import { firebaseDb } from '@/lib/firebase/client';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where
} from 'firebase/firestore';
import { format } from 'date-fns';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
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

type MemberOption = {
  id: string;
  name: string;
  role?: string;
};
const priorityRank: Record<string, number> = {
  Alta: 3,
  Media: 2,
  Baixa: 1
};

const alerts: MemberAlert[] = [
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

export default function MembroPage() {
  const searchParams = useSearchParams();
  const memberIdParam = searchParams.get('memberId') ?? searchParams.get('id');
  const memberNameParam = searchParams.get('name');
  const [memberId, setMemberId] = React.useState('');
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
  const [editStatus, setEditStatus] = React.useState(statusOptions[1]);
  const [updateNote, setUpdateNote] = React.useState('');
  const [isSavingAgenda, setIsSavingAgenda] = React.useState(false);
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
    if (!firebaseDb) {
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

    const loadMemberById = async (docId: string) => {
      const snapshot = await getDoc(doc(db, 'members', docId));
      if (!snapshot.exists() || !isActive) {
        return false;
      }
      applyMemberSnapshot(snapshot.id, snapshot.data() as Partial<MemberInfo>);
      return true;
    };

    const loadMember = async () => {
      try {
        if (memberIdParam) {
          await loadMemberById(memberIdParam);
          return;
        }
        if (memberNameParam) {
          const nameQuery = query(
            collection(db, 'members'),
            where('name', '==', memberNameParam)
          );
          const snapshot = await getDocs(nameQuery);
          const first = snapshot.docs[0];
          if (first && isActive) {
            applyMemberSnapshot(
              first.id,
              first.data() as Partial<MemberInfo>
            );
            return;
          }
        }

        const fallbackSnapshot = await getDocs(
          query(collection(db, 'members'), orderBy('name', 'asc'))
        );
        const first = fallbackSnapshot.docs[0];
        if (first && isActive) {
          applyMemberSnapshot(first.id, first.data() as Partial<MemberInfo>);
          return;
        }

        if (isActive) {
          setMemberId('');
          setMemberInfo({
            name: '',
            email: '',
            sector: '',
            cpf: '',
            role: ''
          });
          setProjectTasks([]);
          setAgendaTasks([]);
          setMemberAlerts(alerts);
          toast.error('Nenhum membro encontrado.');
        }
      } catch (error) {
        console.error('Falha ao carregar membro:', error);
        toast.error('Nao foi possivel carregar o membro.');
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
  }, [memberIdParam, memberNameParam]);

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

  return (
    <PageContainer
      pageTitle={memberInfo.name || 'Individual'}
      pageDescription='Tarefas, calendario e alertas'
    >
      <div className='flex flex-1 flex-col space-y-4'>
        <div className='*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:shadow-xs lg:grid-cols-2'>
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
              <CardTitle>Alertas</CardTitle>
              <CardDescription>Itens para acompanhamento</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className='h-56 pr-3'>
                <div className='space-y-2'>
                  {isMemberLoading ? (
                    <div className='space-y-2'>
                      {Array.from({ length: 3 }).map((_, index) => (
                        <div key={`alert-skeleton-${index}`} className='rounded-md border p-3'>
                          <Skeleton className='h-4 w-1/2' />
                          <Skeleton className='mt-2 h-3 w-3/4' />
                        </div>
                      ))}
                    </div>
                  ) : (
                    memberAlerts.map((alert) => (
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
            </CardContent>
          </Card>
        </div>
      </div>
      <Dialog open={isTaskModalOpen} onOpenChange={setIsTaskModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{activeTask?.title ?? 'Atividade'}</DialogTitle>
            <DialogDescription>
              {activeTask?.projectName
                ? `Projeto: ${activeTask.projectName}`
                : 'Detalhes da atividade'}
            </DialogDescription>
          </DialogHeader>
          <div className='grid gap-3'>
            <div className='grid grid-cols-1 gap-2 sm:grid-cols-2'>
              <div className='rounded-md border p-3 text-sm'>
                <div className='text-muted-foreground text-xs'>Prazo</div>
                <div className='mt-1 font-medium'>{activeTask?.due || '--'}</div>
              </div>
              <div className='rounded-md border p-3 text-sm'>
                <div className='text-muted-foreground text-xs'>Prioridade</div>
                {activeTask ? (
                  <Badge className={priorityStyles[activeTask.priority]}>
                    {activeTask.priority}
                  </Badge>
                ) : (
                  <span className='text-muted-foreground text-xs'>--</span>
                )}
              </div>
            </div>
            <Select
              value={editStatus}
              disabled={isSavingEdit}
              onValueChange={setEditStatus}
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
            <Textarea
              placeholder='Adicionar atualizacao'
              className='min-h-20'
              value={updateNote}
              disabled={isSavingEdit}
              onChange={(event) => setUpdateNote(event.target.value)}
            />
            <div className='rounded-md border p-3'>
              <div className='text-muted-foreground text-xs'>Atualizacoes</div>
              <div className='mt-2 space-y-2'>
                {activeTask?.updates && activeTask.updates.length > 0 ? (
                  activeTask.updates.map((update) => (
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
                ) : (
                  <div className='text-muted-foreground text-xs'>
                    Sem atualizacoes.
                  </div>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              type='button'
              variant='outline'
              onClick={() => setIsTaskModalOpen(false)}
            >
              Fechar
            </Button>
            {activeTask?.projectId ? (
              <Button asChild type='button' variant='secondary'>
                <Link
                  href={`/dashboard/acompanhamento/projetos/${activeTask.projectId}`}
                >
                  Abrir projeto
                </Link>
              </Button>
            ) : null}
            <Button
              type='button'
              onClick={handleUpdateTask}
              disabled={isSavingEdit}
            >
              {isSavingEdit ? 'Salvando...' : 'Salvar atualizacao'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
