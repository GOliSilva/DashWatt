 'use client';
import * as React from 'react';
import Link from 'next/link';
import PageContainer from '@/components/layout/page-container';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
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
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { PieGraph } from '@/features/overview/components/pie-graph';
import { firebaseDb } from '@/lib/firebase/client';
import {
  addDoc,
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp
} from 'firebase/firestore';
import { FirebaseError } from 'firebase/app';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { toast } from 'sonner';

type Project = {
  id: string;
  name: string;
  status: string;
  updated: string;
  health: string;
  scope: string;
  client?: string;
  manager?: string;
  managerId?: string;
  start?: string;
  next?: string;
  value?: string;
};

type Member = {
  id: string;
  name: string;
  email?: string;
  sector?: string;
  cpf?: string;
  role: string;
  activity: string;
  status: string;
  isLeadership?: boolean;
};

const initialMembers: Member[] = [
  {
    id: 'ana-costa',
    name: 'Ana Costa',
    role: 'Designer',
    activity: 'Atualizou prototipos',
    status: 'online'
  },
  {
    id: 'carlos-souza',
    name: 'Carlos Souza',
    role: 'Frontend',
    activity: 'Finalizou componentes',
    status: 'away'
  },
  {
    id: 'bruno-lima',
    name: 'Bruno Lima',
    role: 'Backend',
    activity: 'Revisou endpoints',
    status: 'online'
  },
  {
    id: 'marina-silva',
    name: 'Marina Silva',
    role: 'QA',
    activity: 'Executou testes',
    status: 'offline'
  },
  {
    id: 'paulo-melo',
    name: 'Paulo Melo',
    role: 'PM',
    activity: 'Atualizou cronograma',
    status: 'online'
  },
  {
    id: 'renata-alves',
    name: 'Renata Alves',
    role: 'UX',
    activity: 'Ajustou fluxos',
    status: 'away'
  }
];

const alerts = [
  {
    id: 'alert-1',
    title: 'API instavel',
    detail: 'Picos de erro no servico de pedidos',
    level: 'alto',
    time: 'ha 10 min'
  },
  {
    id: 'alert-2',
    title: 'Fila de emails',
    detail: 'Processamento acima do esperado',
    level: 'medio',
    time: 'ha 45 min'
  },
  {
    id: 'alert-3',
    title: 'Deploy pendente',
    detail: 'Aguardando aprovacao do time',
    level: 'baixo',
    time: 'ha 2 horas'
  }
];

const statusOptions = [
  'Todos',
  'Em andamento',
  'Revisao',
  'Planejamento',
  'Execucao',
  'Validacao'
];

const scopeOptions = ['Geral', 'Automacao', 'Eletrica'];
const projectStatusOptions = statusOptions.filter(
  (status) => status !== 'Todos'
);
const healthOptions = ['Estavel', 'Atencao', 'Ok'];
const defaultMemberStatus = 'online';
const roleOptions = [
  'Consultor',
  'Gerente',
  'Diretor',
  'Assessor',
  'Presidente'
];
const sectorOptions = [
  'Automacao',
  'Eletrica',
  'Comercial',
  'Marketing',
  'Institucional',
  'Executivo'
];

const memberStatusStyles: Record<string, string> = {
  online: 'bg-emerald-500/10 text-emerald-700',
  away: 'bg-amber-500/10 text-amber-700',
  offline: 'bg-muted text-muted-foreground'
};

const alertLevelStyles: Record<string, string> = {
  alto: 'bg-red-500/10 text-red-700',
  medio: 'bg-amber-500/10 text-amber-700',
  baixo: 'bg-emerald-500/10 text-emerald-700'
};

type ProjectFormState = {
  name: string;
  status: string;
  health: string;
  scope: string;
  client: string;
  manager: string;
  managerId: string;
  start: string;
  next: string;
  value: string;
};

type MemberFormState = {
  name: string;
  email: string;
  sector: string;
  cpf: string;
  role: string;
};

export default function AcompanhamentoPage() {
  const [scopeFilter, setScopeFilter] = React.useState('Geral');
  const [statusFilter, setStatusFilter] = React.useState('Todos');
  const [projectList, setProjectList] = React.useState<Project[]>([]);
  const [isProjectsLoading, setIsProjectsLoading] = React.useState(true);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [memberList, setMemberList] =
    React.useState<Member[]>(initialMembers);
  const [leadershipMembers, setLeadershipMembers] = React.useState<Member[]>(
    []
  );
  const [isMemberDialogOpen, setIsMemberDialogOpen] = React.useState(false);
  const [isSavingMember, setIsSavingMember] = React.useState(false);
  const [isMembersLoading, setIsMembersLoading] = React.useState(false);
  const [startDate, setStartDate] = React.useState<Date | undefined>(undefined);
  const [newProject, setNewProject] = React.useState<ProjectFormState>({
    name: '',
    status: projectStatusOptions[0],
    health: healthOptions[2],
    scope: scopeOptions[1],
    client: '',
    manager: '',
    managerId: '',
    start: '',
    next: '',
    value: ''
  });
  const [newMember, setNewMember] = React.useState<MemberFormState>({
    name: '',
    email: '',
    sector: sectorOptions[0],
    cpf: '',
    role: roleOptions[0]
  });
  const [emailHint, setEmailHint] = React.useState('@wattconsultoria.com.br');

  const handleEmailBlur = () => {
    const email = newMember.email.trim();
    if (!email) {
      setEmailHint('@wattconsultoria.com.br');
      return;
    }

    if (!email.includes('@')) {
      setNewMember((current) => ({
        ...current,
        email: `${email}@wattconsultoria.com.br`
      }));
    }
  };

  React.useEffect(() => {
    if (!firebaseDb) {
      return;
    }

    let isActive = true;
    const loadMembers = async () => {
      setIsMembersLoading(true);
      try {
        const baseCollection = collection(firebaseDb, 'members');
        const allMembersQuery = query(baseCollection, orderBy('name', 'asc'));
        const allSnapshot = await getDocs(allMembersQuery);
        if (!isActive) {
          return;
        }

        const mapMember = (docSnapshot: (typeof allSnapshot.docs)[number]) => {
          const data = docSnapshot.data() as Partial<Member>;
          return {
            id: docSnapshot.id,
            name: data.name ?? 'Sem nome',
            email: data.email,
            sector: data.sector,
            cpf: data.cpf,
            role: data.role ?? 'Sem cargo',
            activity: data.activity ?? 'Sem atividade',
            status: data.status ?? 'offline',
            isLeadership: data.isLeadership
          };
        };

        const allMembers = allSnapshot.docs.map(mapMember);
        setMemberList(allMembers);
        setLeadershipMembers(
          allMembers.filter((member) => member.isLeadership)
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
    if (!firebaseDb) {
      return;
    }

    let isActive = true;
    const loadProjects = async () => {
      setIsProjectsLoading(true);
      try {
        const snapshot = await getDocs(collection(firebaseDb, 'projects'));
        if (!isActive) {
          return;
        }

        const projectsFromDb = snapshot.docs.map((docSnapshot) => {
          const data = docSnapshot.data() as Partial<{
            name: string;
            status: string;
            updatedLabel: string;
            updatedAt: Timestamp;
            health: string;
            scope: string;
            client: string;
            manager: string;
            managerId: string;
            start: Timestamp;
            next: string;
            value: string;
          }>;
          const updatedLabel =
            typeof data.updatedLabel === 'string' && data.updatedLabel.trim()
              ? data.updatedLabel
              : data.updatedAt instanceof Timestamp
                ? format(data.updatedAt.toDate(), 'dd/MM/yyyy')
                : '---';
          const startLabel =
            data.start instanceof Timestamp
              ? format(data.start.toDate(), 'dd/MM/yyyy')
              : '';

          return {
            id: docSnapshot.id,
            name: data.name ?? 'Projeto sem nome',
            status: data.status ?? 'Planejamento',
            updated: updatedLabel,
            health: data.health ?? 'Ok',
            scope: data.scope ?? 'Geral',
            client: data.client,
            manager: data.manager,
            managerId: data.managerId,
            start: startLabel,
            next: data.next,
            value: data.value
          };
        });

        setProjectList(projectsFromDb);
      } catch (error) {
        console.error('Falha ao carregar projetos:', error);
        toast.error('Nao foi possivel carregar projetos.');
      } finally {
        if (isActive) {
          setIsProjectsLoading(false);
        }
      }
    };

    loadProjects();

    return () => {
      isActive = false;
    };
  }, []);

  React.useEffect(() => {
    if (leadershipMembers.length === 0) {
      return;
    }

    const managerExists = leadershipMembers.some(
      (member) => member.id === newProject.managerId
    );
    if (newProject.managerId && managerExists) {
      return;
    }

    setNewProject((current) => ({
      ...current,
      managerId: leadershipMembers[0].id,
      manager: leadershipMembers[0].name
    }));
  }, [leadershipMembers, newProject.managerId]);

  const filteredProjects = projectList.filter((project) => {
    const statusMatches =
      statusFilter === 'Todos' || project.status === statusFilter;
    const scopeMatches =
      scopeFilter === 'Geral' || project.scope === scopeFilter;

    return statusMatches && scopeMatches;
  });

  const handleCreateProject = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!newProject.name.trim()) {
      toast.error('Informe o nome do projeto.');
      return;
    }

    if (!newProject.managerId) {
      toast.error('Selecione um responsavel.');
      return;
    }

    if (!firebaseDb) {
      toast.error('Firebase nao configurado.');
      return;
    }

    const selectedManager = leadershipMembers.find(
      (member) => member.id === newProject.managerId
    );
    if (!selectedManager) {
      toast.error('Selecione um responsavel valido.');
      return;
    }
    const managerName = selectedManager.name;

    const projectPayload = {
      name: newProject.name.trim(),
      status: newProject.status,
      health: newProject.health,
      scope: newProject.scope,
      client: newProject.client.trim(),
      manager: managerName,
      managerId: newProject.managerId,
      start: startDate ? Timestamp.fromDate(startDate) : null,
      next: newProject.next.trim(),
      value: newProject.value.trim(),
      updatedLabel: 'agora',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    setIsSaving(true);
    try {
      const docRef = await addDoc(
        collection(firebaseDb, 'projects'),
        projectPayload
      );
      setProjectList((current) => [
        {
          id: docRef.id,
          name: projectPayload.name,
          status: projectPayload.status,
          updated: projectPayload.updatedLabel,
          health: projectPayload.health,
          scope: projectPayload.scope,
          client: projectPayload.client,
          manager: projectPayload.manager,
          managerId: projectPayload.managerId,
          start: newProject.start.trim(),
          next: projectPayload.next,
          value: projectPayload.value
        },
        ...current
      ]);
      toast.success('Projeto criado com sucesso.');
      setNewProject({
        name: '',
        status: projectStatusOptions[0],
        health: healthOptions[2],
        scope: scopeOptions[1],
        client: '',
        manager: leadershipMembers[0]?.name ?? '',
        managerId: leadershipMembers[0]?.id ?? '',
        start: '',
        next: '',
        value: ''
      });
      setStartDate(undefined);
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Falha ao salvar projeto:', error);
      if (error instanceof FirebaseError) {
        toast.error(`Nao foi possivel salvar o projeto: ${error.code}`);
      } else {
        toast.error('Nao foi possivel salvar o projeto.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateMember = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!newMember.name.trim()) {
      toast.error('Informe o nome do membro.');
      return;
    }

    if (
      !newMember.email.trim() ||
      !newMember.sector.trim() ||
      !newMember.cpf.trim() ||
      !newMember.role.trim()
    ) {
      toast.error('Preencha nome, email, setor, CPF e cargo.');
      return;
    }

    if (!firebaseDb) {
      toast.error('Firebase nao configurado.');
      return;
    }

    const roleValue = newMember.role.trim() || 'Sem cargo';
    const memberDoc = doc(collection(firebaseDb, 'members'));
    const isLeadership = newMember.role !== 'Consultor';
    const memberPayload = {
      id: memberDoc.id,
      name: newMember.name.trim(),
      email: newMember.email.trim(),
      sector: newMember.sector.trim(),
      cpf: newMember.cpf.trim(),
      role: roleValue,
      activity: 'Novo cadastro',
      status: defaultMemberStatus,
      isLeadership,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    setIsSavingMember(true);
    try {
      await setDoc(memberDoc, memberPayload);
      setMemberList((current) => [
        {
          id: memberPayload.id,
          name: memberPayload.name,
          email: memberPayload.email,
          sector: memberPayload.sector,
          cpf: memberPayload.cpf,
          role: memberPayload.role,
          activity: memberPayload.activity,
          status: memberPayload.status
        },
        ...current
      ]);
      toast.success('Membro criado com sucesso.');
      setNewMember({
        name: '',
        email: '',
        sector: '',
        cpf: '',
        role: roleOptions[0]
      });
      setIsMemberDialogOpen(false);
    } catch (error) {
      toast.error('Nao foi possivel salvar o membro.');
    } finally {
      setIsSavingMember(false);
    }
  };

  return (
    <PageContainer
      pageTitle='Acompanhamento'
      pageDescription='Visao geral das frentes em andamento'
      pageHeaderAction={
        <Select value={scopeFilter} onValueChange={setScopeFilter}>
          <SelectTrigger className='h-8 w-40' aria-label='Filtrar area'>
            <SelectValue placeholder='Area' />
          </SelectTrigger>
          <SelectContent align='end'>
            {scopeOptions.map((scope) => (
              <SelectItem key={scope} value={scope}>
                {scope}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      }
    >
      <div className='flex flex-1 flex-col space-y-4'>
        <div className='*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:shadow-xs lg:grid-cols-2'>
          <Card className='h-105'>
            <CardHeader>
              <CardTitle>Projetos em acompanhamento</CardTitle>
              <CardDescription>Lista priorizada com status</CardDescription>
              <CardAction>
                <div className='flex items-center gap-2'>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger
                      className='h-8 w-40'
                      aria-label='Filtrar por status'
                    >
                      <SelectValue placeholder='Status' />
                    </SelectTrigger>
                    <SelectContent align='end'>
                      {statusOptions.map((status) => (
                        <SelectItem key={status} value={status}>
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size='sm'>Novo projeto</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Novo projeto</DialogTitle>
                        <DialogDescription>
                          Adicione as informacoes principais do projeto.
                        </DialogDescription>
                      </DialogHeader>
                      <form
                        className='space-y-5'
                        onSubmit={handleCreateProject}
                      >
                        <div className='space-y-2'>
                          <div className='text-muted-foreground text-xs font-semibold uppercase'>
                            Resumo
                          </div>
                          <div className='grid gap-3 sm:grid-cols-2'>
                            <Input
                              placeholder='Nome do projeto'
                              value={newProject.name}
                              disabled={isSaving}
                              className='sm:col-span-2'
                              onChange={(event) =>
                                setNewProject((current) => ({
                                  ...current,
                                  name: event.target.value
                                }))
                              }
                            />
                            <Input
                              placeholder='Cliente'
                              value={newProject.client}
                              disabled={isSaving}
                              className='sm:col-span-2'
                              onChange={(event) =>
                                setNewProject((current) => ({
                                  ...current,
                                  client: event.target.value
                                }))
                              }
                            />
                          </div>
                        </div>
                        <div className='space-y-2'>
                          <div className='text-muted-foreground text-xs font-semibold uppercase'>
                            Gestao
                          </div>
                          <div className='grid gap-3 sm:grid-cols-2'>
                            <Select
                              value={newProject.managerId}
                              disabled={
                                isSaving ||
                                isMembersLoading ||
                                leadershipMembers.length === 0
                              }
                              onValueChange={(value) => {
                                const selected = leadershipMembers.find(
                                  (member) => member.id === value
                                );
                                setNewProject((current) => ({
                                  ...current,
                                  managerId: value,
                                  manager: selected?.name ?? ''
                                }));
                              }}
                            >
                              <SelectTrigger aria-label='Responsavel'>
                                <SelectValue
                                  placeholder={
                                    leadershipMembers.length === 0
                                      ? 'Sem usuarios'
                                      : 'Responsavel'
                                  }
                                />
                              </SelectTrigger>
                              <SelectContent>
                                {leadershipMembers.map((member) => (
                                  <SelectItem key={member.id} value={member.id}>
                                    {member.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Select
                              value={newProject.status}
                              disabled={isSaving}
                              onValueChange={(value) =>
                                setNewProject((current) => ({
                                  ...current,
                                  status: value
                                }))
                              }
                            >
                              <SelectTrigger aria-label='Status do projeto'>
                                <SelectValue placeholder='Status' />
                              </SelectTrigger>
                              <SelectContent>
                                {projectStatusOptions.map((status) => (
                                  <SelectItem key={status} value={status}>
                                    {status}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className='grid gap-3 sm:grid-cols-2'>
                            <Select
                              value={newProject.health}
                              disabled={isSaving}
                              onValueChange={(value) =>
                                setNewProject((current) => ({
                                  ...current,
                                  health: value
                                }))
                              }
                            >
                              <SelectTrigger aria-label='Saude do projeto'>
                                <SelectValue placeholder='Saude' />
                              </SelectTrigger>
                              <SelectContent>
                                {healthOptions.map((health) => (
                                  <SelectItem key={health} value={health}>
                                    {health}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Select
                              value={newProject.scope}
                              disabled={isSaving}
                              onValueChange={(value) =>
                                setNewProject((current) => ({
                                  ...current,
                                  scope: value
                                }))
                              }
                            >
                              <SelectTrigger aria-label='Escopo do projeto'>
                                <SelectValue placeholder='Escopo' />
                              </SelectTrigger>
                              <SelectContent>
                                {scopeOptions
                                  .filter((scope) => scope !== 'Geral')
                                  .map((scope) => (
                                    <SelectItem key={scope} value={scope}>
                                      {scope}
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className='space-y-2'>
                          <div className='text-muted-foreground text-xs font-semibold uppercase'>
                            Cronograma
                          </div>
                          <div className='grid gap-3 sm:grid-cols-2'>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  type='button'
                                  variant='outline'
                                  disabled={isSaving}
                                  className={`w-full justify-between ${
                                    startDate ? '' : 'text-muted-foreground'
                                  }`}
                                >
                                  {startDate
                                    ? format(startDate, 'dd/MM/yyyy')
                                    : 'Inicio do projeto'}
                                  <CalendarIcon className='ml-2 h-4 w-4 opacity-50' />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className='w-auto p-0' align='start'>
                                <Calendar
                                  mode='single'
                                  selected={startDate}
                                  onSelect={(date) => {
                                    setStartDate(date);
                                    setNewProject((current) => ({
                                      ...current,
                                      start: date
                                        ? format(date, 'dd/MM/yyyy')
                                        : ''
                                    }));
                                  }}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                            <Input
                              placeholder='Proximo marco'
                              value={newProject.next}
                              disabled={isSaving}
                              onChange={(event) =>
                                setNewProject((current) => ({
                                  ...current,
                                  next: event.target.value
                                }))
                              }
                            />
                          </div>
                        </div>
                        <div className='space-y-2'>
                          <div className='text-muted-foreground text-xs font-semibold uppercase'>
                            Financeiro
                          </div>
                          <Input
                            placeholder='Valor'
                            value={newProject.value}
                            disabled={isSaving}
                            onChange={(event) =>
                              setNewProject((current) => ({
                                ...current,
                                value: event.target.value
                              }))
                            }
                          />
                        </div>
                        <DialogFooter>
                          <Button
                            type='button'
                            variant='outline'
                            onClick={() => setIsDialogOpen(false)}
                            disabled={isSaving}
                          >
                            Cancelar
                          </Button>
                          <Button type='submit' disabled={isSaving}>
                            {isSaving ? 'Salvando...' : 'Criar projeto'}
                          </Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardAction>
            </CardHeader>
            <CardContent>
              <ScrollArea className='h-64 pr-3'>
                <div className='space-y-2'>
                  {isProjectsLoading ? (
                    <div className='space-y-2'>
                      {Array.from({ length: 4 }).map((_, index) => (
                        <div key={`project-skeleton-${index}`} className='rounded-md border p-3'>
                          <Skeleton className='h-4 w-2/3' />
                          <Skeleton className='mt-2 h-3 w-1/2' />
                        </div>
                      ))}
                    </div>
                  ) : (
                    filteredProjects.map((project) => (
                      <Link
                        key={project.id}
                        href={`/dashboard/acompanhamento/projetos/${project.id}`}
                        className='hover:bg-accent focus-visible:ring-ring/50 flex w-full items-start justify-between gap-3 rounded-md border p-3 text-left transition-colors focus-visible:ring-[3px] focus-visible:outline-none'
                      >
                        <div className='flex flex-col'>
                          <span className='text-sm font-medium'>
                            {project.name}
                          </span>
                          <span className='text-muted-foreground text-xs'>
                            {project.status} - Atualizado {project.updated}
                          </span>
                        </div>
                        <Badge variant='outline'>{project.health}</Badge>
                      </Link>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          <div className='h-105 [&>div]:h-full'>
            {isProjectsLoading ? (
              <Skeleton className='h-full w-full' />
            ) : (
              <PieGraph />
            )}
          </div>

          <Card className='h-105'>
            <CardHeader>
              <CardTitle>Membros da equipe</CardTitle>
              <CardDescription>Ultima atividade registrada</CardDescription>
              <CardAction>
                <Dialog
                  open={isMemberDialogOpen}
                  onOpenChange={setIsMemberDialogOpen}
                >
                  <DialogTrigger asChild>
                    <Button size='sm'>Novo membro</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Novo membro</DialogTitle>
                      <DialogDescription>
                        Adicione os dados principais do colaborador.
                      </DialogDescription>
                    </DialogHeader>
                    <form
                      className='grid gap-4'
                      onSubmit={handleCreateMember}
                    >
                      <div className='grid gap-3 sm:grid-cols-2'>
                        <Input
                          placeholder='Nome do membro'
                          value={newMember.name}
                          disabled={isSavingMember}
                          onChange={(event) =>
                            setNewMember((current) => ({
                              ...current,
                              name: event.target.value
                            }))
                          }
                        />
                        <div className='relative'>
                          <Input
                            placeholder='Email'
                            value={newMember.email}
                            disabled={isSavingMember}
                            className={emailHint ? 'pr-36' : undefined}
                            onChange={(event) => {
                              const nextValue = event.target.value;
                              setNewMember((current) => ({
                                ...current,
                                email: nextValue
                              }));
                              if (!nextValue) {
                                setEmailHint('@wattconsultoria.com.br');
                              } else {
                                setEmailHint('');
                              }
                            }}
                            onBlur={handleEmailBlur}
                          />
                          {emailHint ? (
                            <Badge
                              variant='outline'
                              className='text-muted-foreground pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 border-muted/60 bg-transparent text-[10px]'
                            >
                              {emailHint}
                            </Badge>
                          ) : null}
                        </div>
                      </div>
                      <div className='grid gap-3 sm:grid-cols-2'>
                        <Select
                          value={newMember.sector}
                          disabled={isSavingMember}
                          onValueChange={(value) =>
                            setNewMember((current) => ({
                              ...current,
                              sector: value
                            }))
                          }
                        >
                          <SelectTrigger aria-label='Setor'>
                            <SelectValue placeholder='Setor' />
                          </SelectTrigger>
                          <SelectContent>
                            {sectorOptions.map((sector) => (
                              <SelectItem key={sector} value={sector}>
                                {sector}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Select
                          value={newMember.role}
                          disabled={isSavingMember}
                          onValueChange={(value) =>
                            setNewMember((current) => ({
                              ...current,
                              role: value
                            }))
                          }
                        >
                          <SelectTrigger aria-label='Cargo'>
                            <SelectValue placeholder='Cargo' />
                          </SelectTrigger>
                          <SelectContent>
                            {roleOptions.map((role) => (
                              <SelectItem key={role} value={role}>
                                {role}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Input
                        placeholder='CPF'
                        value={newMember.cpf}
                        disabled={isSavingMember}
                        onChange={(event) =>
                          setNewMember((current) => ({
                            ...current,
                            cpf: event.target.value
                          }))
                        }
                      />
                      <DialogFooter>
                        <Button
                          type='button'
                          variant='outline'
                          onClick={() => setIsMemberDialogOpen(false)}
                          disabled={isSavingMember}
                        >
                          Cancelar
                        </Button>
                        <Button type='submit' disabled={isSavingMember}>
                          {isSavingMember ? 'Salvando...' : 'Criar membro'}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardAction>
            </CardHeader>
            <CardContent>
              <ScrollArea className='h-64 pr-3'>
                <div className='space-y-2'>
                  {isMembersLoading ? (
                    <div className='space-y-2'>
                      {Array.from({ length: 4 }).map((_, index) => (
                        <div key={`member-skeleton-${index}`} className='rounded-md border p-3'>
                          <Skeleton className='h-4 w-1/2' />
                          <Skeleton className='mt-2 h-3 w-2/3' />
                        </div>
                      ))}
                    </div>
                  ) : (
                    memberList.map((member) => (
                      <Link
                        key={member.id}
                        href={`/dashboard/acompanhamento/membros/${member.id}`}
                        className='hover:bg-accent focus-visible:ring-ring/50 flex w-full items-start justify-between gap-3 rounded-md border p-3 text-left transition-colors focus-visible:ring-[3px] focus-visible:outline-none'
                      >
                        <div className='flex flex-col'>
                          <span className='text-sm font-medium'>
                            {member.name}
                          </span>
                          <span className='text-muted-foreground text-xs'>
                            {member.role} - {member.activity}
                          </span>
                        </div>
                        <Badge className={memberStatusStyles[member.status]}>
                          {member.status}
                        </Badge>
                      </Link>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          <Card className='h-full'>
            <CardHeader>
              <CardTitle>Alertas recentes</CardTitle>
              <CardDescription>Eventos que exigem atencao</CardDescription>
            </CardHeader>
            <CardContent>
              <div className='space-y-3'>
                {alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className='flex items-start justify-between gap-3 rounded-md border p-3'
                  >
                    <div className='flex flex-col'>
                      <span className='text-sm font-medium'>{alert.title}</span>
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
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}
