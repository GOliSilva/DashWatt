'use client';
import * as React from 'react';
import PageContainer from '@/components/layout/page-container';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { firebaseDb } from '@/lib/firebase/client';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import {
  arrayUnion,
  collection,
  doc,
  getDocs,
  getDoc,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc
} from 'firebase/firestore';
import { format } from 'date-fns';
import { useParams } from 'next/navigation';
import { toast } from 'sonner';

const priorities: Record<string, string> = {
  Alta: 'bg-red-500/10 text-red-700',
  Media: 'bg-amber-500/10 text-amber-700',
  Baixa: 'bg-emerald-500/10 text-emerald-700'
};
const priorityOptions = ['Alta', 'Media', 'Baixa'];
const statusOptions = ['Planejado', 'Em andamento', 'Bloqueado', 'Concluido'];

type Activity = {
  id: string;
  name: string;
  issuedAt: string;
  dueAt: string;
  owner: string;
  ownerId?: string;
  status: string;
  priority: keyof typeof priorities;
  description: string;
};

type ProjectInfo = {
  id: string;
  name: string;
  client?: string;
  status?: string;
  start?: string;
  next?: string;
  value?: string;
  manager?: string;
};

type MemberOption = {
  id: string;
  name: string;
  role?: string;
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

export default function ProjetoPage() {
  const params = useParams();
  const projectId = Array.isArray(params.projectId)
    ? params.projectId[0]
    : params.projectId;
  const [activityList, setActivityList] = React.useState<Activity[]>([]);
  const [selectedId, setSelectedId] = React.useState('');
  const [projectInfo, setProjectInfo] = React.useState<ProjectInfo>({
    id: '',
    name: 'Projeto',
    client: '',
    status: '',
    start: '',
    next: '',
    value: '',
    manager: ''
  });
  const [isSavingActivity, setIsSavingActivity] = React.useState(false);
  const [memberOptions, setMemberOptions] = React.useState<MemberOption[]>([]);
  const [isMembersLoading, setIsMembersLoading] = React.useState(false);
  const [isOwnerOpen, setIsOwnerOpen] = React.useState(false);
  const ownerInputRef = React.useRef<HTMLInputElement | null>(null);
  const closeOwnerTimeout = React.useRef<NodeJS.Timeout | null>(null);
  const [isEditOpen, setIsEditOpen] = React.useState(false);
  const [isSavingEdit, setIsSavingEdit] = React.useState(false);
  const [isEditOwnerOpen, setIsEditOwnerOpen] = React.useState(false);
  const editOwnerInputRef = React.useRef<HTMLInputElement | null>(null);
  const closeEditOwnerTimeout = React.useRef<NodeJS.Timeout | null>(null);
  const [newActivity, setNewActivity] = React.useState({
    name: '',
    description: '',
    dueDate: '',
    owner: '',
    ownerId: '',
    status: statusOptions[1],
    priority: priorityOptions[1]
  });
  const [editActivity, setEditActivity] = React.useState({
    name: '',
    description: '',
    dueDate: '',
    owner: '',
    ownerId: '',
    status: statusOptions[1],
    priority: priorityOptions[1]
  });

  React.useEffect(() => {
    if (!firebaseDb) {
      return;
    }

    let isActive = true;
    const loadMembers = async () => {
      setIsMembersLoading(true);
      try {
        const snapshot = await getDocs(
          query(collection(firebaseDb, 'members'), orderBy('name', 'asc'))
        );
        if (!isActive) {
          return;
        }

        setMemberOptions(
          snapshot.docs.map((docSnapshot) => {
            const data = docSnapshot.data() as Partial<MemberOption>;
            return {
              id: docSnapshot.id,
              name: data.name ?? 'Sem nome',
              role: data.role
            };
          })
        );
      } catch (error) {
        console.error('Falha ao carregar membros:', error);
        toast.error('Nao foi possivel carregar membros.');
      } finally {
        if (isActive) {
          setIsMembersLoading(false);
        }
      }
    };

    loadMembers();

    return () => {
      isActive = false;
    };
  }, []);

  React.useEffect(() => {
    if (!firebaseDb || !projectId) {
      return;
    }

    let isActive = true;
    const loadActivities = async () => {
      try {
        const snapshot = await getDoc(doc(firebaseDb, 'projects', projectId));
        if (!snapshot.exists() || !isActive) {
          return;
        }

        const data = snapshot.data() as Partial<{
          name: string;
          client: string;
          status: string;
          start: Timestamp;
          next: string;
          value: string;
          manager: string;
          Activities: Activity[];
        }>;
        const startLabel =
          data.start instanceof Timestamp
            ? format(data.start.toDate(), 'dd/MM/yyyy')
            : '';

        setProjectInfo({
          id: snapshot.id,
          name: data.name ?? 'Projeto',
          client: data.client,
          status: data.status,
          start: startLabel,
          next: data.next,
          value: data.value,
          manager: data.manager
        });
        if (data.name) {
          try {
            sessionStorage.setItem(`project-name:${snapshot.id}`, data.name);
            window.dispatchEvent(
              new CustomEvent('project-name-updated', {
                detail: { id: snapshot.id, name: data.name }
              })
            );
          } catch (error) {
            console.warn('Falha ao salvar nome do projeto:', error);
          }
        }
        if (Array.isArray(data.Activities)) {
          setActivityList(data.Activities);
        } else {
          setActivityList([]);
        }
      } catch (error) {
        console.error('Falha ao carregar atividades:', error);
        toast.error('Nao foi possivel carregar atividades.');
      }
    };

    loadActivities();

    return () => {
      isActive = false;
    };
  }, [projectId]);

  React.useEffect(() => {
    if (activityList.length === 0) {
      return;
    }

    const exists = activityList.some((activity) => activity.id === selectedId);
    if (!exists) {
      setSelectedId(activityList[0].id);
    }
  }, [activityList, selectedId]);

  const selectedActivity =
    activityList.find((activity) => activity.id === selectedId) ??
    activityList[0];
  const activityUpdates = [];
  const filteredMembers = memberOptions.filter((member) =>
    member.name.toLowerCase().includes(newActivity.owner.toLowerCase().trim())
  );
  const filteredEditMembers = memberOptions.filter((member) =>
    member.name.toLowerCase().includes(editActivity.owner.toLowerCase().trim())
  );
  const closeOwnerPopover = React.useCallback(() => {
    if (closeOwnerTimeout.current) {
      clearTimeout(closeOwnerTimeout.current);
    }
    closeOwnerTimeout.current = setTimeout(() => {
      setIsOwnerOpen(false);
    }, 120);
  }, []);
  const closeEditOwnerPopover = React.useCallback(() => {
    if (closeEditOwnerTimeout.current) {
      clearTimeout(closeEditOwnerTimeout.current);
    }
    closeEditOwnerTimeout.current = setTimeout(() => {
      setIsEditOwnerOpen(false);
    }, 120);
  }, []);

  const handleCreateActivity = async () => {
    if (!newActivity.name.trim()) {
      toast.error('Informe o nome da atividade.');
      return;
    }
    if (!newActivity.owner.trim()) {
      toast.error('Informe o responsavel.');
      return;
    }
    if (!projectId) {
      toast.error('Projeto nao encontrado.');
      return;
    }
    if (!firebaseDb) {
      toast.error('Firebase nao configurado.');
      return;
    }

    const activityId =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `activity-${Date.now()}`;
    const issuedAt = format(new Date(), 'dd/MM/yyyy');
    const dueAt = formatDateLabel(newActivity.dueDate);
    const activityPayload: Activity = {
      id: activityId,
      name: newActivity.name.trim(),
      issuedAt,
      dueAt,
      owner: newActivity.owner.trim(),
      ownerId: newActivity.ownerId || undefined,
      status: newActivity.status,
      priority: newActivity.priority as Activity['priority'],
      description: newActivity.description.trim()
    };

    setIsSavingActivity(true);
    try {
      await updateDoc(doc(firebaseDb, 'projects', projectId), {
        Activities: arrayUnion(activityPayload),
        updatedAt: serverTimestamp()
      });
      setActivityList((current) => [activityPayload, ...current]);
      setSelectedId(activityPayload.id);
      setNewActivity({
        name: '',
        description: '',
        dueDate: '',
        owner: '',
        ownerId: '',
        status: statusOptions[1],
        priority: priorityOptions[1]
      });
      toast.success('Atividade adicionada.');
    } catch (error) {
      console.error('Falha ao salvar atividade:', error);
      toast.error('Nao foi possivel salvar a atividade.');
    } finally {
      setIsSavingActivity(false);
    }
  };

  const handleEditOpen = () => {
    if (!selectedActivity) {
      return;
    }

    setEditActivity({
      name: selectedActivity.name,
      description: selectedActivity.description,
      dueDate: toInputDate(selectedActivity.dueAt),
      owner: selectedActivity.owner,
      ownerId: selectedActivity.ownerId ?? '',
      status: selectedActivity.status ?? statusOptions[1],
      priority: selectedActivity.priority
    });
    setIsEditOpen(true);
  };

  const handleUpdateActivity = async () => {
    if (!selectedActivity) {
      return;
    }
    if (!editActivity.name.trim()) {
      toast.error('Informe o nome da atividade.');
      return;
    }
    if (!editActivity.owner.trim()) {
      toast.error('Informe o responsavel.');
      return;
    }
    if (!projectId) {
      toast.error('Projeto nao encontrado.');
      return;
    }
    if (!firebaseDb) {
      toast.error('Firebase nao configurado.');
      return;
    }

    const nextActivity: Activity = {
      ...selectedActivity,
      name: editActivity.name.trim(),
      description: editActivity.description.trim(),
      dueAt: formatDateLabel(editActivity.dueDate),
      owner: editActivity.owner.trim(),
      ownerId: editActivity.ownerId || undefined,
      status: editActivity.status,
      priority: editActivity.priority as Activity['priority']
    };
    const nextList = activityList.map((activity) =>
      activity.id === selectedActivity.id ? nextActivity : activity
    );

    setIsSavingEdit(true);
    try {
      await updateDoc(doc(firebaseDb, 'projects', projectId), {
        Activities: nextList,
        updatedAt: serverTimestamp()
      });
      setActivityList(nextList);
      setIsEditOpen(false);
      toast.success('Atividade atualizada.');
    } catch (error) {
      console.error('Falha ao atualizar atividade:', error);
      toast.error('Nao foi possivel atualizar a atividade.');
    } finally {
      setIsSavingEdit(false);
    }
  };

  return (
    <PageContainer
      pageTitle={projectInfo.name}
      pageDescription={
        projectInfo.manager ? `Gerente: ${projectInfo.manager}` : ''
      }
    >
      <div className='flex flex-1 flex-col space-y-4'>
        <div className='*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:grid-cols-2'>
          <Card className='h-full'>
            <CardHeader>
              <CardTitle>Atividades</CardTitle>
              <CardDescription>Selecione para ver detalhes</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className='h-56 pr-3'>
                <div className='space-y-2'>
                  {activityList.length === 0 ? (
                    <div className='text-muted-foreground text-sm'>
                      Nenhuma atividade registrada.
                    </div>
                  ) : (
                    activityList.map((activity) => (
                      <button
                        key={activity.id}
                        type='button'
                        onClick={() => setSelectedId(activity.id)}
                        className='hover:bg-accent focus-visible:ring-ring/50 flex w-full items-start justify-between gap-3 rounded-md border p-3 text-left transition-colors focus-visible:ring-[3px] focus-visible:outline-none'
                      >
                        <div className='flex flex-col'>
                          <span className='text-sm font-medium'>
                            {activity.name}
                          </span>
                          <span className='text-muted-foreground text-xs'>
                            Emissao {activity.issuedAt} - Prazo {activity.dueAt}
                          </span>
                          <span className='text-muted-foreground text-xs'>
                            Responsavel {activity.owner}
                          </span>
                        </div>
                        <Badge className={priorities[activity.priority]}>
                          {activity.priority}
                        </Badge>
                      </button>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          <Card className='h-full lg:col-start-1 lg:row-start-2'>
            <CardHeader>
              <CardTitle>Nova atividade</CardTitle>
              <CardDescription>Registrar novo item</CardDescription>
            </CardHeader>
            <CardContent className='space-y-3'>
              <div className='grid grid-cols-1 gap-2'>
                <div className='space-y-1'>
                  <label className='text-sm font-medium' htmlFor='activityName'>
                    Nome da atividade
                  </label>
                  <Input
                    id='activityName'
                    placeholder='Ex: Alinhamento com o time'
                    value={newActivity.name}
                    disabled={isSavingActivity}
                    onChange={(event) =>
                      setNewActivity((current) => ({
                        ...current,
                        name: event.target.value
                      }))
                    }
                  />
                </div>
                <div className='space-y-1'>
                  <label className='text-sm font-medium' htmlFor='activityDesc'>
                    Descricao
                  </label>
                  <Textarea
                    id='activityDesc'
                    placeholder='Detalhes da atividade'
                    className='min-h-16'
                    value={newActivity.description}
                    disabled={isSavingActivity}
                    onChange={(event) =>
                      setNewActivity((current) => ({
                        ...current,
                        description: event.target.value
                      }))
                    }
                  />
                </div>
                <div className='grid grid-cols-1 gap-2 sm:grid-cols-2'>
                  <div className='space-y-1'>
                    <label className='text-sm font-medium' htmlFor='activityDue'>
                      Prazo
                    </label>
                    <Input
                      id='activityDue'
                      type='date'
                      value={newActivity.dueDate}
                      disabled={isSavingActivity}
                      onChange={(event) =>
                        setNewActivity((current) => ({
                          ...current,
                          dueDate: event.target.value
                        }))
                      }
                    />
                  </div>
                  <div className='space-y-1'>
                    <label className='text-sm font-medium'>
                      Responsavel
                    </label>
                    <Popover open={isOwnerOpen} onOpenChange={setIsOwnerOpen}>
                      <PopoverAnchor asChild>
                        <div>
                          <Input
                            ref={ownerInputRef}
                            placeholder='Digite ou selecione'
                            value={newActivity.owner}
                            disabled={isSavingActivity}
                            onFocus={() => setIsOwnerOpen(true)}
                            onBlur={closeOwnerPopover}
                            onChange={(event) => {
                              const value = event.target.value;
                              setNewActivity((current) => ({
                                ...current,
                                owner: value
                              }));
                              if (!value) {
                                setNewActivity((current) => ({
                                  ...current,
                                  ownerId: ''
                                }));
                              }
                              if (!isOwnerOpen) {
                                setIsOwnerOpen(true);
                              }
                            }}
                          />
                        </div>
                      </PopoverAnchor>
                      <PopoverContent
                        align='start'
                        side='top'
                        className='w-[--radix-popover-trigger-width] p-1'
                        onOpenAutoFocus={(event) => event.preventDefault()}
                        onCloseAutoFocus={(event) => event.preventDefault()}
                        onMouseDown={(event) => event.preventDefault()}
                      >
                        {isMembersLoading ? (
                          <div className='text-muted-foreground px-2 py-2 text-sm'>
                            Carregando membros...
                          </div>
                        ) : filteredMembers.length === 0 ? (
                          <div className='text-muted-foreground px-2 py-2 text-sm'>
                            Nenhum membro encontrado.
                          </div>
                        ) : (
                          <ScrollArea className='max-h-48'>
                            <div className='flex flex-col gap-1 p-1'>
                              {filteredMembers.map((member) => (
                                <button
                                  key={member.id}
                                  type='button'
                                  className='hover:bg-accent flex flex-col rounded-md px-2 py-1.5 text-left text-sm'
                                  onMouseDown={(event) => event.preventDefault()}
                                  onClick={() => {
                                    setNewActivity((current) => ({
                                      ...current,
                                      owner: member.name,
                                      ownerId: member.id
                                    }));
                                    setIsOwnerOpen(false);
                                    ownerInputRef.current?.focus();
                                  }}
                                >
                                  <span className='font-medium'>
                                    {member.name}
                                  </span>
                                  {member.role ? (
                                    <span className='text-muted-foreground text-xs'>
                                      {member.role}
                                    </span>
                                  ) : null}
                                </button>
                              ))}
                            </div>
                          </ScrollArea>
                        )}
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
                <div className='grid grid-cols-1 gap-2 sm:grid-cols-2'>
                  <div className='space-y-1'>
                    <label className='text-sm font-medium'>
                      Prioridade
                    </label>
                    <Select
                      value={newActivity.priority}
                      disabled={isSavingActivity}
                      onValueChange={(value) =>
                        setNewActivity((current) => ({
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
                  <div className='flex items-end'>
                    <Button
                      type='button'
                      className='w-full'
                      onClick={handleCreateActivity}
                      disabled={isSavingActivity}
                    >
                      {isSavingActivity
                        ? 'Salvando...'
                        : 'Adicionar atividade'}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className='h-full lg:col-start-2 lg:row-span-2'>
            <CardHeader>
              <CardTitle>
                {selectedActivity?.name ?? 'Sem atividade selecionada'}
              </CardTitle>
              <CardDescription>
                {selectedActivity?.owner
                  ? `Responsavel: ${selectedActivity.owner}`
                  : 'Selecione uma atividade para ver os detalhes.'}
              </CardDescription>
              <CardAction>
                <div className='flex items-center gap-2'>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={handleEditOpen}
                    disabled={!selectedActivity}
                  >
                    Editar atividade
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant='outline' size='sm'>
                        Info do projeto
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align='end'>
                      <DropdownMenuLabel>
                        Informacoes do projeto
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>
                        Nome: {projectInfo.name}
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        Cliente: {projectInfo.client || '--'}
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        Status: {projectInfo.status || '--'}
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        Inicio: {projectInfo.start || '--'}
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        Proximo: {projectInfo.next || '--'}
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        Valor: {projectInfo.value || '--'}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardAction>
            </CardHeader>
            <CardContent className='space-y-2 text-sm'>
              <div className='grid grid-cols-1 gap-2 sm:grid-cols-2'>
                <div className='rounded-md border p-3'>
                  <div className='text-muted-foreground text-xs'>Prazo</div>
                  <div className='mt-1 font-medium'>
                    {selectedActivity?.dueAt ?? '--'}
                  </div>
                </div>
                <div className='rounded-md border p-3'>
                  <div className='text-muted-foreground text-xs'>
                    Prioridade
                  </div>
                  {selectedActivity ? (
                    <Badge className={priorities[selectedActivity.priority]}>
                      {selectedActivity.priority}
                    </Badge>
                  ) : (
                    <span className='text-muted-foreground text-xs'>--</span>
                  )}
                </div>
              </div>
              <div className='rounded-md border p-3'>
                <div className='text-muted-foreground text-xs'>Status</div>
                <div className='mt-1 font-medium'>
                  {selectedActivity?.status ?? '--'}
                </div>
              </div>
              <div className='rounded-md border p-3'>
                <div className='text-muted-foreground text-xs'>Descricao</div>
                <p className='mt-1'>
                  {selectedActivity?.description ?? '---'}
                </p>
              </div>
              <div className='rounded-md border p-3'>
                <div className='text-muted-foreground text-xs'>Atualizacoes</div>
                <div className='mt-2 space-y-2'>
                  {activityUpdates.length === 0 ? (
                    <div className='text-muted-foreground text-xs'>
                      Sem atualizacoes.
                    </div>
                  ) : (
                    activityUpdates.map((update) => (
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
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar atividade</DialogTitle>
            <DialogDescription>
              Atualize as informacoes da atividade selecionada.
            </DialogDescription>
          </DialogHeader>
          <div className='grid gap-3'>
            <Input
              placeholder='Nome da atividade'
              value={editActivity.name}
              disabled={isSavingEdit}
              onChange={(event) =>
                setEditActivity((current) => ({
                  ...current,
                  name: event.target.value
                }))
              }
            />
            <Textarea
              placeholder='Descricao'
              className='min-h-20'
              value={editActivity.description}
              disabled={isSavingEdit}
              onChange={(event) =>
                setEditActivity((current) => ({
                  ...current,
                  description: event.target.value
                }))
              }
            />
            <div className='grid gap-2 sm:grid-cols-2'>
              <Input
                type='date'
                value={editActivity.dueDate}
                disabled={isSavingEdit}
                onChange={(event) =>
                  setEditActivity((current) => ({
                    ...current,
                    dueDate: event.target.value
                  }))
                }
              />
              <Popover
                open={isEditOwnerOpen}
                onOpenChange={setIsEditOwnerOpen}
              >
                <PopoverAnchor asChild>
                  <div>
                    <Input
                      ref={editOwnerInputRef}
                      placeholder='Responsavel'
                      value={editActivity.owner}
                      disabled={isSavingEdit}
                      onFocus={() => setIsEditOwnerOpen(true)}
                      onBlur={closeEditOwnerPopover}
                      onChange={(event) => {
                        const value = event.target.value;
                        setEditActivity((current) => ({
                          ...current,
                          owner: value
                        }));
                        if (!value) {
                          setEditActivity((current) => ({
                            ...current,
                            ownerId: ''
                          }));
                        }
                        if (!isEditOwnerOpen) {
                          setIsEditOwnerOpen(true);
                        }
                      }}
                    />
                  </div>
                </PopoverAnchor>
                <PopoverContent
                  align='start'
                  side='top'
                  className='w-[--radix-popover-trigger-width] p-1'
                  onOpenAutoFocus={(event) => event.preventDefault()}
                  onCloseAutoFocus={(event) => event.preventDefault()}
                  onMouseDown={(event) => event.preventDefault()}
                >
                  {isMembersLoading ? (
                    <div className='text-muted-foreground px-2 py-2 text-sm'>
                      Carregando membros...
                    </div>
                  ) : filteredEditMembers.length === 0 ? (
                    <div className='text-muted-foreground px-2 py-2 text-sm'>
                      Nenhum membro encontrado.
                    </div>
                  ) : (
                    <ScrollArea className='max-h-48'>
                      <div className='flex flex-col gap-1 p-1'>
                        {filteredEditMembers.map((member) => (
                          <button
                            key={member.id}
                            type='button'
                            className='hover:bg-accent flex flex-col rounded-md px-2 py-1.5 text-left text-sm'
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={() => {
                              setEditActivity((current) => ({
                                ...current,
                                owner: member.name,
                                ownerId: member.id
                              }));
                              setIsEditOwnerOpen(false);
                              editOwnerInputRef.current?.focus();
                            }}
                          >
                            <span className='font-medium'>
                              {member.name}
                            </span>
                            {member.role ? (
                              <span className='text-muted-foreground text-xs'>
                                {member.role}
                              </span>
                            ) : null}
                          </button>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </PopoverContent>
              </Popover>
            </div>
            <Select
              value={editActivity.priority}
              disabled={isSavingEdit}
              onValueChange={(value) =>
                setEditActivity((current) => ({
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
            <Select
              value={editActivity.status}
              disabled={isSavingEdit}
              onValueChange={(value) =>
                setEditActivity((current) => ({
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
          <DialogFooter>
            <Button
              type='button'
              variant='outline'
              onClick={() => setIsEditOpen(false)}
              disabled={isSavingEdit}
            >
              Cancelar
            </Button>
            <Button
              type='button'
              onClick={handleUpdateActivity}
              disabled={isSavingEdit}
            >
              {isSavingEdit ? 'Salvando...' : 'Salvar alteracoes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
