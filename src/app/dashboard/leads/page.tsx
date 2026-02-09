'use client';

import * as React from 'react';
import PageContainer from '@/components/layout/page-container';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { useFirebaseData } from '@/contexts/firebase-data-context';
import { useAuth } from '@/features/auth/components/auth-provider';
import { firebaseDb } from '@/lib/firebase/client';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc
} from 'firebase/firestore';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPenToSquare } from '@fortawesome/free-regular-svg-icons';
import { faPhone, faXmark } from '@fortawesome/free-solid-svg-icons';
import { toast } from 'sonner';

type LeadContact = {
  name: string;
  email: string;
  phone: string;
  role: string;
};

type LeadFormState = {
  responsibleId: string;
  responsibleName: string;
  leadName: string;
  cnpj: string;
  contacts: LeadContact[];
  date: string;
  location: string;
  interestedServices: string;
  proposalLink: string;
  hasBeenContacted: boolean;
};

type Lead = {
  id: string;
  responsibleId: string;
  responsibleName: string;
  leadName: string;
  cnpj: string;
  contacts: LeadContact[];
  date: string;
  location: string;
  interestedServices: string[];
  proposalLink: string;
  hasBeenContacted?: boolean;
};

type LeadComment = {
  id: string;
  authorId: string | null;
  authorName: string;
  text: string;
  createdAt?: unknown;
};

const initialFormState: LeadFormState = {
  responsibleId: '',
  responsibleName: '',
  leadName: '',
  cnpj: '',
  contacts: [
    {
      name: '',
      email: '',
      phone: '',
      role: ''
    }
  ],
  date: '',
  location: '',
  interestedServices: '',
  proposalLink: '',
  hasBeenContacted: false
};

export default function LeadsPage() {
  const { members } = useFirebaseData();
  const { user } = useAuth();
  const [form, setForm] = React.useState<LeadFormState>(initialFormState);
  const [isSaving, setIsSaving] = React.useState(false);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [editingLeadId, setEditingLeadId] = React.useState<string | null>(null);
  const [deletingLeadId, setDeletingLeadId] = React.useState<string | null>(
    null
  );
  const [togglingLeadId, setTogglingLeadId] = React.useState<string | null>(
    null
  );
  const [leadToDelete, setLeadToDelete] = React.useState<Lead | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [leads, setLeads] = React.useState<Lead[]>([]);
  const [isLoadingLeads, setIsLoadingLeads] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [selectedLead, setSelectedLead] = React.useState<Lead | null>(null);
  const [comments, setComments] = React.useState<LeadComment[]>([]);
  const [isLoadingComments, setIsLoadingComments] = React.useState(false);
  const [commentText, setCommentText] = React.useState('');
  const [isSavingComment, setIsSavingComment] = React.useState(false);
  const formContacts = form.contacts ?? [];
  const selectedLeadId = selectedLead ? selectedLead.id : null;
  const hasFirebaseDb = Boolean(firebaseDb);

  const sortedMembers = React.useMemo(() => {
    return [...(members ?? [])].sort((a, b) =>
      a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' })
    );
  }, [members]);

  React.useEffect(() => {
    if (!firebaseDb) {
      setIsLoadingLeads(false);
      return;
    }

    if (!user) {
      setLeads([]);
      setIsLoadingLeads(false);
      return;
    }

    setIsLoadingLeads(true);
    let unsubscribe: (() => void) | undefined;

    try {
      const leadsQuery = query(
        collection(firebaseDb, 'leads'),
        orderBy('createdAt', 'desc')
      );

      unsubscribe = onSnapshot(
        leadsQuery,
        (snapshot) => {
          const data = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...(doc.data() as Omit<Lead, 'id'>)
          }));
          setLeads(data as Lead[]);
          setIsLoadingLeads(false);
        },
        (error) => {
          console.error('Erro ao escutar leads:', error);
          toast.error('Nao foi possivel carregar os leads.');
          setIsLoadingLeads(false);
        }
      );
    } catch (error) {
      console.error('Erro ao configurar listener de leads:', error);
      toast.error('Nao foi possivel carregar os leads.');
      setIsLoadingLeads(false);
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user]);

  const filteredLeads = React.useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return leads;
    return leads.filter((lead) =>
      [
        lead.leadName,
        lead.responsibleName,
        lead.cnpj,
        lead.location,
        lead.proposalLink,
        lead.interestedServices?.join(' '),
        lead.contacts?.map((item) => item.name).join(' '),
        lead.contacts?.map((item) => item.email).join(' '),
        lead.contacts?.map((item) => item.phone).join(' ')
      ]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(term))
    );
  }, [leads, searchTerm]);

  const formatLeadDate = (value: unknown) => {
    if (!value) return '-';

    if (typeof value === 'string') {
      const parts = value.split('-');
      if (parts.length !== 3) return value;
      const [year, month, day] = parts;
      return `${day}/${month}/${year}`;
    }

    if (typeof value === 'object') {
      const maybeTimestamp = value as { toDate?: () => Date };
      if (maybeTimestamp.toDate) {
        const date = maybeTimestamp.toDate();
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = String(date.getFullYear());
        return `${day}/${month}/${year}`;
      }
    }

    return '-';
  };

  const formatLeadDateInput = (value: unknown) => {
    if (!value) return '';

    if (typeof value === 'string') {
      return value;
    }

    if (typeof value === 'object') {
      const maybeTimestamp = value as { toDate?: () => Date };
      if (maybeTimestamp.toDate) {
        const date = maybeTimestamp.toDate();
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = String(date.getFullYear());
        return `${year}-${month}-${day}`;
      }
    }

    return '';
  };

  const formatCommentDate = (value: unknown) => {
    if (!value) return '-';

    if (typeof value === 'object') {
      const maybeTimestamp = value as { toDate?: () => Date };
      if (maybeTimestamp.toDate) {
        return maybeTimestamp.toDate().toLocaleString('pt-BR');
      }
    }

    if (typeof value === 'string') return value;

    return '-';
  };

  const openCreateLead = () => {
    setForm(initialFormState);
    setEditingLeadId(null);
    setIsDialogOpen(true);
  };

  const handleCancelDialog = () => {
    setForm(initialFormState);
    setEditingLeadId(null);
    setIsDialogOpen(false);
  };

  const openEditLead = (lead: Lead) => {
    setForm({
      responsibleId: lead.responsibleId ?? '',
      responsibleName: lead.responsibleName ?? '',
      leadName: lead.leadName ?? '',
      cnpj: lead.cnpj ?? '',
      contacts:
        lead.contacts?.length > 0
          ? lead.contacts.map((contact) => ({
              name: contact.name ?? '',
              email: contact.email ?? '',
              phone: contact.phone ?? '',
              role: contact.role ?? ''
            }))
          : [
              {
                name: '',
                email: '',
                phone: '',
                role: ''
              }
            ],
      date: formatLeadDateInput(lead.date),
      location: lead.location ?? '',
      interestedServices: lead.interestedServices?.join(', ') ?? '',
      proposalLink: lead.proposalLink ?? '',
      hasBeenContacted: lead.hasBeenContacted ?? false
    });
    setEditingLeadId(lead.id);
    setIsDialogOpen(true);
  };

  const addContact = () => {
    setForm((current) => ({
      ...current,
      contacts: [
        ...(current.contacts ?? []),
        { name: '', email: '', phone: '', role: '' }
      ]
    }));
  };

  const updateContact = (
    index: number,
    field: keyof LeadContact,
    value: string
  ) => {
    setForm((current) => {
      const next = [...(current.contacts ?? [])];
      if (!next[index]) {
        next[index] = { name: '', email: '', phone: '', role: '' };
      }
      next[index] = {
        ...next[index],
        [field]: value
      };
      return { ...current, contacts: next };
    });
  };

  const removeContact = (index: number) => {
    setForm((current) => {
      const next = (current.contacts ?? []).filter(
        (_, itemIndex) => itemIndex !== index
      );
      return {
        ...current,
        contacts: next.length
          ? next
          : [{ name: '', email: '', phone: '', role: '' }]
      };
    });
  };

  const openDeleteDialog = (lead: Lead) => {
    setLeadToDelete(lead);
    setIsDeleteDialogOpen(true);
  };

  const openLeadDetails = (lead: Lead) => {
    setSelectedLead(lead);
    setCommentText('');
  };

  React.useEffect(() => {
    if (!hasFirebaseDb || !selectedLeadId) {
      setComments([]);
      setIsLoadingComments(false);
      return;
    }

    setIsLoadingComments(true);
    const commentsQuery = query(
      collection(firebaseDb, 'leads', selectedLeadId, 'comments'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      commentsQuery,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<LeadComment, 'id'>)
        }));
        setComments(data as LeadComment[]);
        setIsLoadingComments(false);
      },
      (error) => {
        console.error('Erro ao carregar comentarios:', error);
        toast.error('Nao foi possivel carregar os comentarios.');
        setIsLoadingComments(false);
      }
    );

    return () => unsubscribe();
  }, [selectedLeadId, hasFirebaseDb]);

  const handleDeleteLead = async () => {
    if (!firebaseDb) {
      toast.error('Banco de dados indisponivel.');
      return;
    }

    if (!leadToDelete) {
      setIsDeleteDialogOpen(false);
      return;
    }

    setDeletingLeadId(leadToDelete.id);
    try {
      await deleteDoc(doc(firebaseDb, 'leads', leadToDelete.id));
      toast.success('Lead excluido.');
      setLeadToDelete(null);
      setIsDeleteDialogOpen(false);
      setSelectedLead(null);
    } catch (error) {
      console.log(error);
      toast.error('Nao foi possivel excluir o lead.');
    } finally {
      setDeletingLeadId(null);
    }
  };

  const handleToggleContacted = async (lead: Lead, value: boolean) => {
    if (!firebaseDb) {
      toast.error('Banco de dados indisponivel.');
      return;
    }

    setTogglingLeadId(lead.id);
    try {
      await updateDoc(doc(firebaseDb, 'leads', lead.id), {
        hasBeenContacted: value,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.log(error);
      toast.error('Nao foi possivel atualizar o lead.');
    } finally {
      setTogglingLeadId(null);
    }
  };

  const handleAddComment = async () => {
    if (!firebaseDb || !selectedLeadId) {
      toast.error('Banco de dados indisponivel.');
      return;
    }

    const message = commentText.trim();
    if (!message) {
      toast.error('Digite um comentario antes de salvar.');
      return;
    }

    const authorName =
      user?.displayName || user?.email || 'Usuario nao identificado';

    setIsSavingComment(true);
    try {
      await addDoc(
        collection(firebaseDb, 'leads', selectedLeadId, 'comments'),
        {
          text: message,
          authorId: user?.uid ?? null,
          authorName,
          createdAt: serverTimestamp()
        }
      );
      setCommentText('');
      toast.success('Comentario adicionado.');
    } catch (error) {
      console.log(error);
      toast.error('Nao foi possivel adicionar o comentario.');
    } finally {
      setIsSavingComment(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!firebaseDb) {
      toast.error('Banco de dados indisponivel.');
      return;
    }

    const contacts = formContacts
      .map((contact) => ({
        name: contact.name.trim(),
        email: contact.email.trim(),
        phone: contact.phone.trim(),
        role: contact.role.trim()
      }))
      .filter((contact) =>
        [contact.name, contact.email, contact.phone, contact.role].some(Boolean)
      );

    const interestedServices = form.interestedServices
      .split(',')
      .map((service) => service.trim())
      .filter(Boolean);

    const payload = {
      responsibleId: form.responsibleId.trim(),
      responsibleName: form.responsibleName.trim(),
      leadName: form.leadName.trim(),
      cnpj: form.cnpj.trim(),
      contacts,
      date: form.date.trim(),
      location: form.location.trim(),
      interestedServices,
      proposalLink: form.proposalLink.trim(),
      hasBeenContacted: form.hasBeenContacted
    };

    if (
      !payload.responsibleId ||
      !payload.leadName ||
      !payload.date ||
      !payload.location
    ) {
      toast.error('Preencha todos os campos obrigatorios.');
      return;
    }

    setIsSaving(true);
    try {
      if (editingLeadId) {
        await updateDoc(doc(firebaseDb, 'leads', editingLeadId), {
          ...payload,
          updatedAt: serverTimestamp()
        });
        toast.success('Lead atualizado com sucesso.');
      } else {
        await addDoc(collection(firebaseDb, 'leads'), {
          ...payload,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        toast.success('Lead registrado com sucesso.');
      }
      setForm(initialFormState);
      setEditingLeadId(null);
      setIsDialogOpen(false);
    } catch (error) {
      console.log(error);
      toast.error('Nao foi possivel registrar o lead.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <PageContainer
      pageTitle='Leads'
      pageDescription='Consulte e registre novos leads.'
      pageHeaderAction={
        <Button type='button' onClick={openCreateLead}>
          Novo lead
        </Button>
      }
    >
      <Card>
        <CardHeader className='gap-3 md:flex-row md:items-center md:justify-between'>
          <div>
            <CardTitle>Consulta de Leads</CardTitle>
            <CardDescription>
              Busque leads cadastrados e acompanhe os detalhes.
            </CardDescription>
          </div>
          <div className='w-full md:w-64'>
            <Input
              placeholder='Buscar por nome, contato ou tipo...'
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingLeads ? (
            <div className='text-muted-foreground text-sm'>
              Carregando leads...
            </div>
          ) : filteredLeads.length === 0 ? (
            <div className='text-muted-foreground text-sm'>
              Nenhum lead encontrado.
            </div>
          ) : (
            <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-3'>
              {filteredLeads.map((lead) => (
                <button
                  key={lead.id}
                  type='button'
                  onClick={() => openLeadDetails(lead)}
                  className='hover:bg-muted/50 active:bg-muted flex flex-col gap-3 rounded-lg border p-4 text-left transition-colors'
                >
                  <div className='flex items-start justify-between gap-2'>
                    <span className='text-sm leading-tight font-semibold'>
                      {lead.leadName}
                    </span>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        lead.hasBeenContacted
                          ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400'
                          : 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400'
                      }`}
                    >
                      {lead.hasBeenContacted ? 'Contatado' : 'Pendente'}
                    </span>
                  </div>
                  <div className='flex flex-col gap-0.5'>
                    <span className='text-muted-foreground text-xs'>
                      {lead.responsibleName || '-'}
                    </span>
                    <div className='flex items-center gap-2'>
                      <span className='text-muted-foreground text-xs'>
                        {formatLeadDate(lead.date)}
                      </span>
                      {lead.location ? (
                        <>
                          <span className='text-muted-foreground text-xs'>
                            •
                          </span>
                          <span className='text-muted-foreground truncate text-xs'>
                            {lead.location}
                          </span>
                        </>
                      ) : null}
                    </div>
                  </div>
                  {lead.interestedServices?.length ? (
                    <div className='flex flex-wrap gap-1.5'>
                      {lead.interestedServices.map((service) => (
                        <span
                          key={`${lead.id}-${service}`}
                          className='bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-[10px]'
                        >
                          {service}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={Boolean(selectedLead)}
        onOpenChange={(open) => {
          if (!open) setSelectedLead(null);
        }}
      >
        <DialogContent className='max-h-[90vh] w-[calc(100%-1.5rem)] max-w-2xl overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>Detalhes do Lead</DialogTitle>
            <DialogDescription>
              Informacoes completas para acompanhamento.
            </DialogDescription>
          </DialogHeader>
          {selectedLead ? (
            <div className='grid gap-4'>
              <div className='grid grid-cols-2 gap-3'>
                <div className='grid gap-0.5'>
                  <span className='text-muted-foreground text-xs'>
                    Responsável
                  </span>
                  <span className='text-sm font-medium'>
                    {selectedLead.responsibleName || '-'}
                  </span>
                </div>
                <div className='grid gap-0.5'>
                  <span className='text-muted-foreground text-xs'>Data</span>
                  <span className='text-sm font-medium'>
                    {formatLeadDate(selectedLead.date)}
                  </span>
                </div>
                <div className='grid gap-0.5'>
                  <span className='text-muted-foreground text-xs'>CNPJ</span>
                  <span className='text-sm font-medium'>
                    {selectedLead.cnpj || '-'}
                  </span>
                </div>
                <div className='grid gap-0.5'>
                  <span className='text-muted-foreground text-xs'>
                    Localização
                  </span>
                  <span className='text-sm font-medium'>
                    {selectedLead.location || '-'}
                  </span>
                </div>
              </div>

              {selectedLead.interestedServices?.length ? (
                <div className='grid gap-1'>
                  <span className='text-muted-foreground text-xs'>
                    Serviços
                  </span>
                  <div className='flex flex-wrap gap-1.5'>
                    {selectedLead.interestedServices.map((service) => (
                      <span
                        key={`${selectedLead.id}-${service}`}
                        className='bg-muted text-muted-foreground rounded-full px-2.5 py-0.5 text-xs'
                      >
                        {service}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}

              {selectedLead.proposalLink ? (
                <div className='grid gap-0.5'>
                  <span className='text-muted-foreground text-xs'>
                    Link dos arquivos
                  </span>
                  <a
                    href={
                      selectedLead.proposalLink.startsWith('http')
                        ? selectedLead.proposalLink
                        : `https://${selectedLead.proposalLink}`
                    }
                    target='_blank'
                    rel='noopener noreferrer'
                    className='text-sm break-all text-blue-600 underline dark:text-blue-400'
                  >
                    {selectedLead.proposalLink}
                  </a>
                </div>
              ) : null}

              <div className='grid gap-2'>
                <span className='text-muted-foreground text-xs'>Contatos</span>
                {selectedLead.contacts?.length ? (
                  <div className='grid gap-2'>
                    {selectedLead.contacts.map((contact, index) => (
                      <div
                        key={`${contact.email}-${index}`}
                        className='grid grid-cols-2 gap-x-3 gap-y-1 rounded-md border p-3 text-sm'
                      >
                        <div className='col-span-2 font-medium'>
                          {contact.name || '-'}
                        </div>
                        <span className='text-muted-foreground text-xs'>
                          {contact.role || '-'}
                        </span>
                        <span className='text-muted-foreground text-xs'>
                          {contact.phone || '-'}
                        </span>
                        <span className='text-muted-foreground col-span-2 truncate text-xs'>
                          {contact.email || '-'}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <span className='text-muted-foreground text-sm'>-</span>
                )}
              </div>

              <div className='grid gap-2'>
                <span className='text-muted-foreground text-xs'>
                  Comentarios
                </span>
                <div className='grid gap-2 rounded-md border p-3'>
                  <Textarea
                    value={commentText}
                    onChange={(event) => setCommentText(event.target.value)}
                    placeholder='Adicione um comentario sobre a evolucao do lead...'
                    rows={3}
                  />
                  <div className='flex justify-end'>
                    <Button
                      type='button'
                      size='sm'
                      onClick={handleAddComment}
                      disabled={isSavingComment}
                    >
                      {isSavingComment ? 'Salvando...' : 'Adicionar comentario'}
                    </Button>
                  </div>
                </div>

                {isLoadingComments ? (
                  <span className='text-muted-foreground text-sm'>
                    Carregando comentarios...
                  </span>
                ) : comments.length ? (
                  <div className='grid gap-2'>
                    {comments.map((comment) => (
                      <div
                        key={comment.id}
                        className='grid gap-1 rounded-md border p-3 text-sm'
                      >
                        <div className='flex flex-wrap items-center justify-between gap-2'>
                          <span className='font-medium'>
                            {comment.authorName || 'Usuario'}
                          </span>
                          <span className='text-muted-foreground text-xs'>
                            {formatCommentDate(comment.createdAt)}
                          </span>
                        </div>
                        <p className='text-muted-foreground text-sm whitespace-pre-wrap'>
                          {comment.text}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <span className='text-muted-foreground text-sm'>
                    Nenhum comentario registrado.
                  </span>
                )}
              </div>

              <div className='grid grid-cols-3 gap-2'>
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  className={`w-full ${
                    selectedLead.hasBeenContacted
                      ? 'text-green-600'
                      : 'text-red-600'
                  }`}
                  onClick={() =>
                    handleToggleContacted(
                      selectedLead,
                      selectedLead.hasBeenContacted !== true
                    )
                  }
                  disabled={togglingLeadId === selectedLead.id}
                >
                  <FontAwesomeIcon icon={faPhone} />
                  <span className='ml-1 hidden sm:inline'>
                    {selectedLead.hasBeenContacted
                      ? 'Nao contatado'
                      : 'Contatado'}
                  </span>
                </Button>
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  className='w-full'
                  onClick={() => openEditLead(selectedLead)}
                >
                  <FontAwesomeIcon icon={faPenToSquare} />
                  <span className='ml-1'>Editar</span>
                </Button>
                <Button
                  type='button'
                  variant='destructive'
                  size='sm'
                  className='w-full'
                  onClick={() => openDeleteDialog(selectedLead)}
                  disabled={deletingLeadId === selectedLead.id}
                >
                  <FontAwesomeIcon icon={faXmark} />
                  <span className='ml-1'>Excluir</span>
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className='max-h-[90vh] w-[calc(100%-1.5rem)] max-w-2xl overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>
              {editingLeadId ? 'Editar Lead' : 'Cadastrar Lead'}
            </DialogTitle>
            <DialogDescription>
              {editingLeadId
                ? 'Atualize os dados para editar o lead.'
                : 'Preencha os dados para registrar um novo lead.'}
            </DialogDescription>
          </DialogHeader>
          <form className='grid gap-4 md:grid-cols-2' onSubmit={handleSubmit}>
            <div className='grid min-w-0 gap-2'>
              <label className='text-sm font-medium' htmlFor='responsavel'>
                Responsável
              </label>
              <Select
                value={form.responsibleId}
                onValueChange={(value) => {
                  const selected = sortedMembers.find(
                    (member) => member.id === value
                  );
                  setForm((current) => ({
                    ...current,
                    responsibleId: value,
                    responsibleName: selected?.name ?? ''
                  }));
                }}
              >
                <SelectTrigger
                  id='responsavel'
                  className='w-full min-w-0 overflow-hidden'
                >
                  <SelectValue
                    placeholder='Selecione o responsável'
                    className='truncate'
                  />
                </SelectTrigger>
                <SelectContent>
                  {sortedMembers.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className='grid gap-2'>
              <label className='text-sm font-medium' htmlFor='leadName'>
                Nome do Lead
              </label>
              <Input
                id='leadName'
                value={form.leadName}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    leadName: event.target.value
                  }))
                }
                placeholder='Ex: Empresa Alfa'
              />
            </div>

            <div className='grid gap-2'>
              <label className='text-sm font-medium' htmlFor='cnpj'>
                CNPJ
              </label>
              <Input
                id='cnpj'
                value={form.cnpj}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    cnpj: event.target.value
                  }))
                }
                placeholder='00.000.000/0000-00'
              />
            </div>

            <div className='grid gap-2 md:col-span-2'>
              <label className='text-sm font-medium' htmlFor='contactName'>
                Contatos
              </label>
              <div className='grid gap-3'>
                {formContacts.map((contact, index) => (
                  <div
                    key={`contact-${index}`}
                    className='grid gap-3 rounded-md border p-3 md:grid-cols-2'
                  >
                    <div className='grid gap-2'>
                      <label
                        className='text-muted-foreground text-xs font-medium'
                        htmlFor={`contact-name-${index}`}
                      >
                        Nome
                      </label>
                      <Input
                        id={`contact-name-${index}`}
                        value={contact.name}
                        onChange={(event) =>
                          updateContact(index, 'name', event.target.value)
                        }
                        placeholder='Ex: Ariel'
                      />
                    </div>
                    <div className='grid gap-2'>
                      <label
                        className='text-muted-foreground text-xs font-medium'
                        htmlFor={`contact-role-${index}`}
                      >
                        Funcao
                      </label>
                      <Input
                        id={`contact-role-${index}`}
                        value={contact.role}
                        onChange={(event) =>
                          updateContact(index, 'role', event.target.value)
                        }
                        placeholder='Ex: Gerente'
                      />
                    </div>
                    <div className='grid gap-2'>
                      <label
                        className='text-muted-foreground text-xs font-medium'
                        htmlFor={`contact-email-${index}`}
                      >
                        Email
                      </label>
                      <Input
                        id={`contact-email-${index}`}
                        type='email'
                        value={contact.email}
                        onChange={(event) =>
                          updateContact(index, 'email', event.target.value)
                        }
                        placeholder='email@contato.com'
                      />
                    </div>
                    <div className='grid gap-2'>
                      <label
                        className='text-muted-foreground text-xs font-medium'
                        htmlFor={`contact-phone-${index}`}
                      >
                        Telefone
                      </label>
                      <Input
                        id={`contact-phone-${index}`}
                        value={contact.phone}
                        onChange={(event) =>
                          updateContact(index, 'phone', event.target.value)
                        }
                        placeholder='(00) 00000-0000'
                      />
                    </div>
                    <div className='md:col-span-2'>
                      <Button
                        type='button'
                        variant='outline'
                        size='sm'
                        onClick={() => removeContact(index)}
                      >
                        Remover contato
                      </Button>
                    </div>
                  </div>
                ))}
                <Button
                  type='button'
                  variant='secondary'
                  size='sm'
                  onClick={addContact}
                >
                  Adicionar contato
                </Button>
              </div>
            </div>

            <div className='grid gap-2'>
              <label className='text-sm font-medium' htmlFor='date'>
                Data
              </label>
              <Input
                id='date'
                type='date'
                value={form.date}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    date: event.target.value
                  }))
                }
              />
            </div>

            <div className='grid gap-2'>
              <label className='text-sm font-medium' htmlFor='location'>
                Localização
              </label>
              <Input
                id='location'
                value={form.location}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    location: event.target.value
                  }))
                }
                placeholder='Cidade/UF ou endereco'
              />
            </div>

            <div className='grid gap-2'>
              <label
                className='text-sm font-medium'
                htmlFor='interestedServices'
              >
                Serviços de interesse
              </label>
              <Input
                id='interestedServices'
                value={form.interestedServices}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    interestedServices: event.target.value
                  }))
                }
                placeholder='Ex: SPDA, Projeto Eletrico, Automacao'
              />
            </div>

            <div className='grid gap-2 md:col-span-2'>
              <label className='text-sm font-medium' htmlFor='proposalLink'>
                Link dos arquivos
              </label>
              <Input
                id='proposalLink'
                value={form.proposalLink}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    proposalLink: event.target.value
                  }))
                }
                placeholder='www.proposta.com'
              />
            </div>

            <div className='flex items-center gap-2 md:col-span-2'>
              <Checkbox
                id='hasBeenContacted'
                checked={form.hasBeenContacted}
                onCheckedChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    hasBeenContacted: value === true
                  }))
                }
              />
              <label htmlFor='hasBeenContacted' className='text-sm font-medium'>
                Lead já foi contatado
              </label>
            </div>

            <div className='flex flex-col-reverse gap-2 sm:flex-row sm:justify-end md:col-span-2'>
              <Button
                type='button'
                variant='outline'
                onClick={handleCancelDialog}
              >
                Cancelar
              </Button>
              <Button type='submit' disabled={isSaving}>
                {isSaving
                  ? 'Salvando...'
                  : editingLeadId
                    ? 'Salvar Alteracoes'
                    : 'Registrar Lead'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={(open) => {
          setIsDeleteDialogOpen(open);
          if (!open) setLeadToDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir lead</AlertDialogTitle>
            <AlertDialogDescription>
              {leadToDelete
                ? `Tem certeza que deseja excluir o lead "${leadToDelete.leadName}"?`
                : 'Tem certeza que deseja excluir este lead?'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteLead}
              disabled={!leadToDelete || deletingLeadId === leadToDelete.id}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageContainer>
  );
}
