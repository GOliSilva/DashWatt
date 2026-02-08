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

type LeadFormState = {
  responsibleId: string;
  responsibleName: string;
  leadName: string;
  contact: string;
  date: string;
  location: string;
  leadType: string;
  hasBeenContacted: boolean;
};

type Lead = {
  id: string;
  responsibleId: string;
  responsibleName: string;
  leadName: string;
  contact: string;
  date: string;
  location: string;
  leadType: string;
  hasBeenContacted?: boolean;
};

const initialFormState: LeadFormState = {
  responsibleId: '',
  responsibleName: '',
  leadName: '',
  contact: '',
  date: '',
  location: '',
  leadType: '',
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
        lead.contact,
        lead.location,
        lead.leadType
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
      contact: lead.contact ?? '',
      date: formatLeadDateInput(lead.date),
      location: lead.location ?? '',
      leadType: lead.leadType ?? '',
      hasBeenContacted: lead.hasBeenContacted ?? false
    });
    setEditingLeadId(lead.id);
    setIsDialogOpen(true);
  };

  const openDeleteDialog = (lead: Lead) => {
    setLeadToDelete(lead);
    setIsDeleteDialogOpen(true);
  };

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

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!firebaseDb) {
      toast.error('Banco de dados indisponivel.');
      return;
    }

    const payload = {
      responsibleId: form.responsibleId.trim(),
      responsibleName: form.responsibleName.trim(),
      leadName: form.leadName.trim(),
      contact: form.contact.trim(),
      date: form.date.trim(),
      location: form.location.trim(),
      leadType: form.leadType.trim(),
      hasBeenContacted: form.hasBeenContacted
    };

    if (
      !payload.responsibleId ||
      !payload.leadName ||
      !payload.contact ||
      !payload.date ||
      !payload.location ||
      !payload.leadType
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
            <div className='rounded-md border'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Lead</TableHead>
                    <TableHead>Responsável</TableHead>
                    <TableHead>Contato</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Localizacão</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className='text-right'>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLeads.map((lead) => (
                    <TableRow key={lead.id}>
                      <TableCell className='font-medium'>
                        <div className='flex flex-col'>
                          <span>{lead.leadName}</span>
                          <span
                            className={`text-xs ${
                              lead.hasBeenContacted
                                ? 'text-green-600'
                                : 'text-red-600'
                            }`}
                          >
                            {lead.hasBeenContacted
                              ? 'Contatado'
                              : 'Não contatado'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{lead.responsibleName || '-'}</TableCell>
                      <TableCell>{lead.contact}</TableCell>
                      <TableCell>{formatLeadDate(lead.date)}</TableCell>
                      <TableCell>{lead.location}</TableCell>
                      <TableCell>{lead.leadType}</TableCell>
                      <TableCell className='text-right'>
                        <div className='flex items-center justify-end gap-2'>
                          <Button
                            type='button'
                            variant='ghost'
                            size='icon'
                            onClick={() =>
                              handleToggleContacted(
                                lead,
                                lead.hasBeenContacted !== true
                              )
                            }
                            aria-label={
                              lead.hasBeenContacted
                                ? 'Marcar como nao contatado'
                                : 'Marcar como contatado'
                            }
                            disabled={togglingLeadId === lead.id}
                            className={
                              lead.hasBeenContacted
                                ? 'text-green-600'
                                : 'text-red-600'
                            }
                          >
                            <FontAwesomeIcon icon={faPhone} />
                          </Button>
                          <Button
                            type='button'
                            variant='ghost'
                            size='icon'
                            onClick={() => openEditLead(lead)}
                            aria-label='Editar lead'
                          >
                            <FontAwesomeIcon icon={faPenToSquare} />
                          </Button>
                          <Button
                            type='button'
                            variant='ghost'
                            size='icon'
                            onClick={() => openDeleteDialog(lead)}
                            aria-label='Excluir lead'
                            disabled={deletingLeadId === lead.id}
                          >
                            <FontAwesomeIcon icon={faXmark} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

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
            <div className='grid gap-2'>
              <label className='text-sm font-medium' htmlFor='responsavel'>
                Responsavel
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
                <SelectTrigger id='responsavel'>
                  <SelectValue placeholder='Selecione o responsavel' />
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
              <label className='text-sm font-medium' htmlFor='contact'>
                Contato
              </label>
              <Input
                id='contact'
                value={form.contact}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    contact: event.target.value
                  }))
                }
                placeholder='Telefone, email ou nome do contato'
              />
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
                Localizacao
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
              <label className='text-sm font-medium' htmlFor='leadType'>
                Tipo
              </label>
              <Input
                id='leadType'
                value={form.leadType}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    leadType: event.target.value
                  }))
                }
                placeholder='Ex: Residencial, Comercial...'
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
