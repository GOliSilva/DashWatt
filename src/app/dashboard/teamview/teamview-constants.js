'use client';

export const priorityStyles = {
  Alta: 'bg-red-500/10 text-red-700',
  Media: 'bg-amber-500/10 text-amber-700',
  Baixa: 'bg-emerald-500/10 text-emerald-700'
};

export const statusStyles = {
  'Em andamento': 'bg-primary/10 text-primary',
  Planejado: 'bg-muted text-muted-foreground',
  Bloqueado: 'bg-red-500/10 text-red-700',
  Concluido: 'bg-emerald-500/10 text-emerald-700'
};

export const priorityRank = {
  Alta: 3,
  Media: 2,
  Baixa: 1
};

export const normalizeLabel = (value) =>
  value
    ? value
        .toString()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
    : '';

export const normalizeSearch = (value) => normalizeLabel(value).toLowerCase();

export const parseDueDate = (value) => {
  if (!value) return null;
  const parts = value.split('/');
  if (parts.length !== 3) return null;
  const [day, month, year] = parts;
  const parsed = new Date(
    Number.parseInt(year, 10),
    Number.parseInt(month, 10) - 1,
    Number.parseInt(day, 10)
  );
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};
