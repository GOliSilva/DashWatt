import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPenToSquare } from '@fortawesome/free-regular-svg-icons';
import { faPhone, faXmark } from '@fortawesome/free-solid-svg-icons';
import type { Lead, LeadComment } from './types';

type LeadDetailsDialogProps = {
  selectedLead: Lead | null;
  comments: LeadComment[];
  isLoadingComments: boolean;
  commentText: string;
  isSavingComment: boolean;
  togglingLeadId: string | null;
  deletingLeadId: string | null;
  onClose: () => void;
  onEdit: (lead: Lead) => void;
  onDelete: (lead: Lead) => void;
  onToggleContacted: (lead: Lead, value: boolean) => void;
  onCommentTextChange: (value: string) => void;
  onAddComment: () => void;
  formatLeadDate: (value: unknown) => string;
  formatCommentDate: (value: unknown) => string;
};

export function LeadDetailsDialog({
  selectedLead,
  comments,
  isLoadingComments,
  commentText,
  isSavingComment,
  togglingLeadId,
  deletingLeadId,
  onClose,
  onEdit,
  onDelete,
  onToggleContacted,
  onCommentTextChange,
  onAddComment,
  formatLeadDate,
  formatCommentDate
}: LeadDetailsDialogProps) {
  return (
    <Dialog
      open={Boolean(selectedLead)}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className='max-h-[90vh] w-[calc(100%-1.5rem)] max-w-2xl overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>Detalhes do Lead</DialogTitle>
          <DialogDescription>
            Informações completas para acompanhamento.
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
                <span className='text-muted-foreground text-xs'>Serviços</span>
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
              <span className='text-muted-foreground text-xs'>Comentarios</span>
              <div className='grid gap-2 rounded-md border p-3'>
                <Textarea
                  value={commentText}
                  onChange={(event) => onCommentTextChange(event.target.value)}
                  placeholder='Adicione um comentario sobre a evolucao do lead...'
                  rows={3}
                />
                <div className='flex justify-end'>
                  <Button
                    type='button'
                    size='sm'
                    onClick={onAddComment}
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
                  onToggleContacted(
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
                onClick={() => onEdit(selectedLead)}
              >
                <FontAwesomeIcon icon={faPenToSquare} />
                <span className='ml-1'>Editar</span>
              </Button>
              <Button
                type='button'
                variant='destructive'
                size='sm'
                className='w-full'
                onClick={() => onDelete(selectedLead)}
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
  );
}
