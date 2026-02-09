'use client';

import * as React from 'react';
import { useFirebaseData, Member } from '@/contexts/firebase-data-context';
import { useAuth } from '@/features/auth/components/auth-provider';
import { firebaseDb } from '@/lib/firebase/client';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  where,
  serverTimestamp
} from 'firebase/firestore';
import { toast } from 'sonner';

import PageContainer from '@/components/layout/page-container';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  IconChevronLeft,
  IconChevronRight,
  IconCheck,
  IconCircleCheck,
  IconClipboardList,
  IconChartBar
} from '@tabler/icons-react';
import { cn } from '@/lib/utils';

// ─── Types ───────────────────────────────────────────────────────────
const CRITERIA = [
  { key: 'lideranca', label: 'Liderança' },
  { key: 'comunicacao', label: 'Comunicação' },
  { key: 'proatividade', label: 'Proatividade' },
  { key: 'organizacao', label: 'Organização' },
  { key: 'conhecimento', label: 'Conhecimento na Área' },
  { key: 'responsabilidade', label: 'Responsabilidade' }
] as const;

const SCORE_LABELS = [
  '',
  'Ruim',
  'Regular',
  'Bom',
  'Muito Bom',
  'Ótimo'
] as const;

type CriterionKey = (typeof CRITERIA)[number]['key'];

type Ratings = Record<CriterionKey, number>;

const EMPTY_RATINGS: Ratings = {
  lideranca: 0,
  comunicacao: 0,
  proatividade: 0,
  organizacao: 0,
  conhecimento: 0,
  responsabilidade: 0
};

// Period key: YYYY-MM
function getCurrentPeriod() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function getPeriodLabel(period: string) {
  const [year, month] = period.split('-');
  const monthNames = [
    'Janeiro',
    'Fevereiro',
    'Março',
    'Abril',
    'Maio',
    'Junho',
    'Julho',
    'Agosto',
    'Setembro',
    'Outubro',
    'Novembro',
    'Dezembro'
  ];
  return `${monthNames[parseInt(month) - 1]} ${year}`;
}

// ─── Score Selector Component ───────────────────────────────────────
function ScoreSelector({
  value,
  onChange,
  disabled = false
}: {
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className='flex flex-col gap-1'>
      <div className='flex gap-1'>
        {[1, 2, 3, 4, 5].map((score) => {
          const isSelected = score === value;
          const isFilled = score <= value;
          return (
            <button
              key={score}
              type='button'
              disabled={disabled}
              className={cn(
                'flex h-8 flex-1 items-center justify-center rounded-md border text-sm font-medium transition-all duration-150',
                disabled ? 'cursor-default' : 'cursor-pointer',
                isSelected
                  ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                  : isFilled
                    ? 'border-primary/40 bg-primary/10 text-primary'
                    : 'border-border bg-background text-muted-foreground hover:border-primary/40 hover:bg-muted'
              )}
              onClick={() => !disabled && onChange(score)}
            >
              {score}
            </button>
          );
        })}
      </div>
      {value > 0 && (
        <span className='text-muted-foreground text-[11px]'>
          {SCORE_LABELS[value]}
        </span>
      )}
    </div>
  );
}

// ─── Member Card (Gallery) ──────────────────────────────────────────
function MemberEvaluationCard({
  member,
  ratings,
  onRatingChange,
  alreadySubmitted,
  isCurrentUser
}: {
  member: Member;
  ratings: Ratings;
  onRatingChange: (key: CriterionKey, value: number) => void;
  alreadySubmitted: boolean;
  isCurrentUser: boolean;
}) {
  const initials =
    member.name
      ?.split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || '??';

  const allRated = CRITERIA.every((c) => ratings[c.key] > 0);
  const average =
    CRITERIA.reduce((sum, c) => sum + ratings[c.key], 0) / CRITERIA.length;

  return (
    <Card
      className={cn(
        'overflow-hidden transition-all duration-200',
        alreadySubmitted && 'border-green-500/20'
      )}
    >
      <div className='flex flex-col md:flex-row'>
        {/* Left: Member info */}
        <div className='flex flex-col items-center px-6 pt-6 pb-4 md:w-52 md:shrink-0 md:justify-center md:border-r md:py-5'>
          <Avatar className='mb-2 h-14 w-14'>
            <AvatarFallback className='bg-primary/10 text-primary text-lg font-semibold'>
              {initials}
            </AvatarFallback>
          </Avatar>
          <h3 className='text-center text-sm font-semibold'>{member.name}</h3>
          {isCurrentUser && (
            <Badge variant='outline' className='mt-1 text-[11px] font-normal'>
              Autoavaliação
            </Badge>
          )}
          <div className='mt-1.5 flex flex-wrap items-center justify-center gap-1'>
            {member.sector && (
              <Badge variant='secondary' className='text-[11px] font-normal'>
                {member.sector}
              </Badge>
            )}
            {member.role && (
              <Badge variant='outline' className='text-[11px] font-normal'>
                {member.role}
              </Badge>
            )}
          </div>
          {alreadySubmitted && (
            <Badge
              variant='default'
              className='mt-3 bg-green-600 hover:bg-green-600'
            >
              <IconCircleCheck className='mr-1 h-3.5 w-3.5' />
              Enviada
            </Badge>
          )}
          {!alreadySubmitted && allRated && (
            <p className='text-muted-foreground mt-2 text-xs'>
              Média:{' '}
              <strong className='text-foreground'>{average.toFixed(1)}</strong>{' '}
              / 5.0
            </p>
          )}
        </div>

        {/* Right: Criteria grid */}
        <div className='flex-1 px-5 pt-4 pb-5 md:py-4'>
          <div className='mb-3 flex items-center justify-between'>
            <span className='text-muted-foreground text-[11px] font-medium tracking-wider uppercase'>
              Critérios de avaliação
            </span>
            <span className='text-muted-foreground text-[11px]'>
              1 = Ruim · 5 = Ótimo
            </span>
          </div>
          <div className='grid grid-cols-1 gap-x-6 gap-y-3 md:grid-cols-2 lg:grid-cols-3'>
            {CRITERIA.map((criterion) => (
              <div key={criterion.key} className='space-y-1'>
                <label className='text-sm font-medium'>{criterion.label}</label>
                <ScoreSelector
                  value={ratings[criterion.key]}
                  onChange={(v) => onRatingChange(criterion.key, v)}
                  disabled={alreadySubmitted}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}

// ─── My Results View ───────────────────────────────────────────
function MyResultsView({
  averages,
  totalEvaluators,
  isLoading,
  memberName
}: {
  averages: Ratings;
  totalEvaluators: number;
  isLoading: boolean;
  memberName: string;
}) {
  if (isLoading) {
    return (
      <div className='flex flex-1 flex-col items-center justify-center gap-3'>
        <Skeleton className='h-6 w-48' />
        <Skeleton className='h-40 w-full max-w-2xl rounded-xl' />
      </div>
    );
  }

  const overallAvg =
    totalEvaluators === 0
      ? 0
      : CRITERIA.reduce((sum, c) => sum + averages[c.key], 0) / CRITERIA.length;

  return (
    <div className='flex flex-1 items-start justify-center md:items-center'>
      <Card className='w-full max-w-2xl'>
        <CardContent className='p-6'>
          <div className='mb-5 flex items-center justify-between'>
            <div>
              <h3 className='text-base font-semibold'>Sua Avaliação</h3>
              <p className='text-muted-foreground text-xs'>
                {totalEvaluators === 0
                  ? 'Nenhuma avaliação recebida ainda'
                  : `Baseada em ${totalEvaluators} avaliaç${totalEvaluators === 1 ? 'ão' : 'ões'} recebida${totalEvaluators === 1 ? '' : 's'}`}
              </p>
            </div>
            <div className='text-right'>
              <p className='text-2xl font-bold'>{overallAvg.toFixed(1)}</p>
              <p className='text-muted-foreground text-xs'>Média geral</p>
            </div>
          </div>

          <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
            {CRITERIA.map((criterion) => {
              const val = averages[criterion.key];
              const pct = (val / 5) * 100;
              return (
                <div key={criterion.key} className='space-y-2'>
                  <div className='flex items-center justify-between'>
                    <span className='text-sm font-medium'>
                      {criterion.label}
                    </span>
                    <span className='text-sm font-semibold'>
                      {val.toFixed(1)}
                    </span>
                  </div>
                  <div className='bg-muted h-2 overflow-hidden rounded-full'>
                    <div
                      className='bg-primary h-full rounded-full transition-all duration-500'
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className='text-muted-foreground text-[11px]'>
                    {val >= 4.5
                      ? 'Ótimo'
                      : val >= 3.5
                        ? 'Muito Bom'
                        : val >= 2.5
                          ? 'Bom'
                          : val >= 1.5
                            ? 'Regular'
                            : val > 0
                              ? 'Ruim'
                              : '—'}
                  </p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────
export default function Feedback360Page() {
  const {
    members,
    isLoading: membersLoading,
    currentMember
  } = useFirebaseData();
  const { user } = useAuth();

  const period = getCurrentPeriod();

  // Tab: 'evaluate' or 'results'
  const [activeTab, setActiveTab] = React.useState<'evaluate' | 'results'>(
    'evaluate'
  );

  // Members to evaluate (including self-evaluation)
  const evaluatableMembers = React.useMemo(() => members, [members]);

  // Current gallery index
  const [currentIndex, setCurrentIndex] = React.useState(0);

  // Map of memberId -> Ratings
  const [ratingsMap, setRatingsMap] = React.useState<Record<string, Ratings>>(
    {}
  );

  // Set of memberIds already submitted this period
  const [submittedSet, setSubmittedSet] = React.useState<Set<string>>(
    new Set()
  );

  // Loading state for fetching existing feedbacks
  const [loadingFeedbacks, setLoadingFeedbacks] = React.useState(true);

  // Submitting state
  const [submitting, setSubmitting] = React.useState(false);

  // My results state
  const [myAverages, setMyAverages] = React.useState<Ratings>({
    ...EMPTY_RATINGS
  });
  const [myTotalEvaluators, setMyTotalEvaluators] = React.useState(0);
  const [loadingMyResults, setLoadingMyResults] = React.useState(true);

  // Load existing feedbacks for this period
  React.useEffect(() => {
    async function loadExisting() {
      if (!firebaseDb || !user?.uid) return;

      try {
        const q = query(
          collection(firebaseDb, 'feedback360'),
          where('evaluatorId', '==', user.uid),
          where('period', '==', period)
        );
        const snapshot = await getDocs(q);
        const submitted = new Set<string>();
        const existing: Record<string, Ratings> = {};

        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          const evaluatedId = data.evaluatedId as string;
          submitted.add(evaluatedId);
          existing[evaluatedId] = {
            lideranca: data.lideranca ?? 0,
            comunicacao: data.comunicacao ?? 0,
            proatividade: data.proatividade ?? 0,
            organizacao: data.organizacao ?? 0,
            conhecimento: data.conhecimento ?? 0,
            responsabilidade: data.responsabilidade ?? 0
          };
        });

        setSubmittedSet(submitted);
        setRatingsMap(existing);
      } catch (err) {
        console.error('Erro ao carregar feedbacks existentes:', err);
      } finally {
        setLoadingFeedbacks(false);
      }
    }

    loadExisting();
  }, [user?.uid, period]);

  // Load feedbacks received about me
  React.useEffect(() => {
    async function loadMyResults() {
      if (!firebaseDb || !user?.uid) return;

      try {
        const q = query(
          collection(firebaseDb, 'feedback360'),
          where('evaluatedId', '==', user.uid),
          where('period', '==', period)
        );
        const snapshot = await getDocs(q);
        const totals: Ratings = { ...EMPTY_RATINGS };
        let count = 0;

        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          count++;
          for (const c of CRITERIA) {
            totals[c.key] += (data[c.key] as number) ?? 0;
          }
        });

        if (count > 0) {
          const avgs: Ratings = { ...EMPTY_RATINGS };
          for (const c of CRITERIA) {
            avgs[c.key] = totals[c.key] / count;
          }
          setMyAverages(avgs);
        }
        setMyTotalEvaluators(count);
      } catch (err) {
        console.error('Erro ao carregar resultados:', err);
      } finally {
        setLoadingMyResults(false);
      }
    }

    loadMyResults();
  }, [user?.uid, period]);

  // Get/set ratings for a specific member
  function getRatings(memberId: string): Ratings {
    return ratingsMap[memberId] ?? { ...EMPTY_RATINGS };
  }

  function handleRatingChange(
    memberId: string,
    key: CriterionKey,
    value: number
  ) {
    setRatingsMap((prev) => ({
      ...prev,
      [memberId]: {
        ...(prev[memberId] ?? { ...EMPTY_RATINGS }),
        [key]: value
      }
    }));
  }

  // Submit evaluation for a single member
  async function handleSubmit(member: Member) {
    if (!firebaseDb || !user?.uid || !currentMember) return;

    const ratings = getRatings(member.id);
    const allRated = CRITERIA.every((c) => ratings[c.key] > 0);

    if (!allRated) {
      toast.error('Preencha todas as avaliações antes de enviar.');
      return;
    }

    setSubmitting(true);

    try {
      // Document ID = evaluatorId_evaluatedId_period
      const docId = `${user.uid}_${member.id}_${period}`;

      await setDoc(doc(firebaseDb, 'feedback360', docId), {
        evaluatorId: user.uid,
        evaluatorName: currentMember.name,
        evaluatedId: member.id,
        evaluatedName: member.name,
        period,
        lideranca: ratings.lideranca,
        comunicacao: ratings.comunicacao,
        proatividade: ratings.proatividade,
        organizacao: ratings.organizacao,
        conhecimento: ratings.conhecimento,
        responsabilidade: ratings.responsabilidade,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      setSubmittedSet((prev) => new Set(prev).add(member.id));
      toast.success(`Avaliação de ${member.name} enviada com sucesso!`);

      // Automatically move to next unevaluated member
      const nextUnevaluated = evaluatableMembers.findIndex(
        (m, i) =>
          i > currentIndex && !submittedSet.has(m.id) && m.id !== member.id
      );
      if (nextUnevaluated >= 0) {
        setTimeout(() => setCurrentIndex(nextUnevaluated), 500);
      }
    } catch (err: any) {
      console.error('Erro ao enviar avaliação:', err);
      toast.error('Erro ao enviar avaliação. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  }

  // Navigation
  const currentMemberToEval = evaluatableMembers[currentIndex];
  const totalMembers = evaluatableMembers.length;
  const submittedCount = evaluatableMembers.filter((m) =>
    submittedSet.has(m.id)
  ).length;
  const allSubmitted = submittedCount === totalMembers;

  const isLoadingPage = membersLoading || loadingFeedbacks;

  return (
    <PageContainer
      scrollable={false}
      pageTitle='Feedback 360°'
      pageDescription={`Avaliação mensal — ${getPeriodLabel(period)}`}
      pageHeaderAction={
        <div className='flex items-center rounded-lg border p-1'>
          <button
            onClick={() => setActiveTab('evaluate')}
            className={cn(
              'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
              activeTab === 'evaluate'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <IconClipboardList className='h-4 w-4' />
            Avaliar
          </button>
          <button
            onClick={() => setActiveTab('results')}
            className={cn(
              'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
              activeTab === 'results'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <IconChartBar className='h-4 w-4' />
            Meus Resultados
          </button>
        </div>
      }
    >
      {activeTab === 'results' ? (
        <MyResultsView
          averages={myAverages}
          totalEvaluators={myTotalEvaluators}
          isLoading={loadingMyResults}
          memberName={currentMember?.name ?? ''}
        />
      ) : isLoadingPage ? (
        <div className='space-y-4'>
          <Skeleton className='h-8 w-60' />
          <Skeleton className='h-64 w-full rounded-xl' />
        </div>
      ) : evaluatableMembers.length === 0 ? (
        <Card>
          <CardContent className='py-12 text-center'>
            <p className='text-muted-foreground'>
              Nenhum membro disponível para avaliação.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className='flex min-h-0 flex-1 flex-col gap-3'>
          {/* Progress row */}
          <div className='mx-auto flex w-full max-w-xs items-center gap-3'>
            <span className='text-xs font-medium whitespace-nowrap'>
              {submittedCount}/{totalMembers}
            </span>
            <Progress
              value={(submittedCount / totalMembers) * 100}
              className='h-1.5 flex-1'
            />
            {allSubmitted && (
              <Badge
                variant='default'
                className='bg-green-600 whitespace-nowrap'
              >
                <IconCheck className='mr-1 h-3 w-3' />
                Completo
              </Badge>
            )}
          </div>

          {/* Gallery navigation + card */}
          <div className='flex min-h-0 flex-1 items-start gap-3 md:items-center'>
            <Button
              variant='outline'
              size='icon'
              onClick={() =>
                setCurrentIndex((i) =>
                  i <= 0 ? evaluatableMembers.length - 1 : i - 1
                )
              }
              className='mt-auto mb-auto shrink-0'
            >
              <IconChevronLeft className='h-5 w-5' />
            </Button>

            <div className='min-h-0 flex-1 overflow-y-auto md:overflow-visible'>
              {currentMemberToEval && (
                <>
                  <MemberEvaluationCard
                    member={currentMemberToEval}
                    ratings={getRatings(currentMemberToEval.id)}
                    onRatingChange={(key, value) =>
                      handleRatingChange(currentMemberToEval.id, key, value)
                    }
                    alreadySubmitted={submittedSet.has(currentMemberToEval.id)}
                    isCurrentUser={currentMemberToEval.id === user?.uid}
                  />

                  {/* Bottom: submit + counter */}
                  <div className='mt-2 flex items-center justify-between'>
                    <p className='text-muted-foreground text-sm'>
                      {currentIndex + 1} de {totalMembers}
                    </p>
                    {!submittedSet.has(currentMemberToEval.id) ? (
                      <Button
                        size='default'
                        onClick={() => handleSubmit(currentMemberToEval)}
                        disabled={
                          submitting ||
                          !CRITERIA.every(
                            (c) => getRatings(currentMemberToEval.id)[c.key] > 0
                          )
                        }
                      >
                        {submitting ? <>Enviando...</> : <>Enviar Avaliação</>}
                      </Button>
                    ) : (
                      <span className='text-sm font-medium text-green-600'>
                        Avaliação enviada
                      </span>
                    )}
                  </div>
                </>
              )}
            </div>

            <Button
              variant='outline'
              size='icon'
              onClick={() =>
                setCurrentIndex((i) =>
                  i >= evaluatableMembers.length - 1 ? 0 : i + 1
                )
              }
              className='mt-auto mb-auto shrink-0'
            >
              <IconChevronRight className='h-5 w-5' />
            </Button>
          </div>

          {/* Summary when all done */}
          {allSubmitted && (
            <div className='rounded-lg border border-green-500/20 bg-green-50/10 px-4 py-3 text-center'>
              <p className='text-sm font-medium'>
                Todas as avaliações de {getPeriodLabel(period)} foram enviadas!
              </p>
            </div>
          )}
        </div>
      )}
    </PageContainer>
  );
}
