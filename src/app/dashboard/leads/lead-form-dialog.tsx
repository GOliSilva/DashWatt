import * as React from 'react';
import { Button } from '@/components/ui/button';
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
import { Checkbox } from '@/components/ui/checkbox';
import type { LeadContact, LeadFormState } from './types';

type LeadFormDialogProps = {
  isOpen: boolean;
  editingLeadId: string | null;
  form: LeadFormState;
  formContacts: LeadContact[];
  sortedMembers: Array<{ id: string; name: string }>;
  isSaving: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
  onResponsibleChange: (value: string) => void;
  onFieldChange: (field: keyof LeadFormState, value: string) => void;
  onToggleContacted: (value: boolean) => void;
  onAddContact: () => void;
  onUpdateContact: (
    index: number,
    field: keyof LeadContact,
    value: string
  ) => void;
  onRemoveContact: (index: number) => void;
};

export function LeadFormDialog({
  isOpen,
  editingLeadId,
  form,
  formContacts,
  sortedMembers,
  isSaving,
  onOpenChange,
  onSubmit,
  onCancel,
  onResponsibleChange,
  onFieldChange,
  onToggleContacted,
  onAddContact,
  onUpdateContact,
  onRemoveContact
}: LeadFormDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
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
        <form className='grid gap-4 md:grid-cols-2' onSubmit={onSubmit}>
          <div className='grid min-w-0 gap-2'>
            <label className='text-sm font-medium' htmlFor='responsavel'>
              Responsável
            </label>
            <Select
              value={form.responsibleId}
              onValueChange={onResponsibleChange}
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
                onFieldChange('leadName', event.target.value)
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
              onChange={(event) => onFieldChange('cnpj', event.target.value)}
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
                        onUpdateContact(index, 'name', event.target.value)
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
                        onUpdateContact(index, 'role', event.target.value)
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
                        onUpdateContact(index, 'email', event.target.value)
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
                        onUpdateContact(index, 'phone', event.target.value)
                      }
                      placeholder='(00) 00000-0000'
                    />
                  </div>
                  <div className='md:col-span-2'>
                    <Button
                      type='button'
                      variant='outline'
                      size='sm'
                      onClick={() => onRemoveContact(index)}
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
                onClick={onAddContact}
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
              onChange={(event) => onFieldChange('date', event.target.value)}
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
                onFieldChange('location', event.target.value)
              }
              placeholder='Cidade/UF ou endereco'
            />
          </div>

          <div className='grid gap-2'>
            <label className='text-sm font-medium' htmlFor='interestedServices'>
              Serviços de interesse
            </label>
            <Input
              id='interestedServices'
              value={form.interestedServices}
              onChange={(event) =>
                onFieldChange('interestedServices', event.target.value)
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
                onFieldChange('proposalLink', event.target.value)
              }
              placeholder='www.proposta.com'
            />
          </div>

          <div className='flex items-center gap-2 md:col-span-2'>
            <Checkbox
              id='hasBeenContacted'
              checked={form.hasBeenContacted}
              onCheckedChange={(value) => onToggleContacted(value === true)}
            />
            <label htmlFor='hasBeenContacted' className='text-sm font-medium'>
              Lead já foi contatado
            </label>
          </div>

          <div className='flex flex-col-reverse gap-2 sm:flex-row sm:justify-end md:col-span-2'>
            <Button type='button' variant='outline' onClick={onCancel}>
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
  );
}
