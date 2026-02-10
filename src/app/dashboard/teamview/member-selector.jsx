'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

export function MemberSelector({
  isLoading,
  sortedMembers,
  filteredMembers,
  searchTerm,
  onSearchChange,
  selectedMemberId,
  onMemberChange,
  selectedMemberInfo
}) {
  const showResults = searchTerm.trim().length > 0;

  return (
    <Card>
      <CardHeader className='pb-3'>
        <CardTitle className='text-lg md:text-xl'>Selecionar membro</CardTitle>
        <CardDescription className='text-xs md:text-sm'>
          Escolha um membro para visualizar o calendário
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className='h-10 w-full' />
        ) : sortedMembers.length === 0 ? (
          <div className='text-muted-foreground py-4 text-center text-sm'>
            Nenhum membro encontrado.
          </div>
        ) : (
          <div className='space-y-3'>
            <Input
              placeholder='Buscar membro...'
              value={searchTerm}
              onChange={(event) => onSearchChange(event.target.value)}
              className='h-11'
            />
            {showResults ? (
              <div className='max-h-48 overflow-y-auto rounded-md border p-1'>
                {filteredMembers.length === 0 ? (
                  <div className='text-muted-foreground px-3 py-2 text-sm'>
                    Nenhum membro encontrado.
                  </div>
                ) : (
                  filteredMembers.map((member) => (
                    <button
                      key={member.id}
                      type='button'
                      onClick={() => {
                        onMemberChange(member.id);
                        onSearchChange(member.name || '');
                      }}
                      className={`hover:bg-accent focus-visible:ring-ring/50 flex w-full min-w-0 flex-col gap-0.5 rounded-md px-3 py-2 text-left text-sm transition-colors focus-visible:ring-2 focus-visible:outline-none sm:flex-row sm:items-center sm:gap-2 ${
                        selectedMemberId === member.id ? 'bg-accent' : ''
                      }`}
                    >
                      <span className='min-w-0 truncate font-medium sm:flex-1'>
                        {member.name}
                      </span>
                      {member.sector ? (
                        <span className='text-muted-foreground shrink-0 text-[11px] sm:text-xs'>
                          {member.sector}
                        </span>
                      ) : null}
                    </button>
                  ))
                )}
              </div>
            ) : (
              <div className='text-muted-foreground text-xs'>
                Digite para buscar membros.
              </div>
            )}

            {selectedMemberInfo.name ? (
              <div className='min-w-0 rounded-lg border p-3'>
                <div className='truncate text-sm font-medium'>
                  {selectedMemberInfo.name}
                </div>
                <div className='text-muted-foreground mt-0.5 truncate text-xs'>
                  {selectedMemberInfo.email || '-'}
                </div>
                <div className='mt-2 flex flex-wrap gap-1.5'>
                  {selectedMemberInfo.role ? (
                    <Badge variant='secondary' className='text-[10px]'>
                      {selectedMemberInfo.role}
                    </Badge>
                  ) : null}
                  {selectedMemberInfo.sector ? (
                    <Badge variant='outline' className='text-[10px]'>
                      {selectedMemberInfo.sector}
                    </Badge>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
