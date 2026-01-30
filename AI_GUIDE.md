# AI Guide (project context)

This file is a compact, AI-focused reference for future changes.
Keep it updated when structure or conventions change.

## Purpose
- Next.js dashboard starter with shadcn/ui and Tailwind.
- Key custom area: Acompanhamento pages and project detail flow.

## High-level structure
- `src/app`: Next.js app router pages and layouts.
- `src/components`: shared UI + layout components.
- `src/features`: feature-level components (charts, widgets).
- `src/config`: navigation config and app-level settings.
- `src/hooks`: custom hooks (navigation filtering, etc).
- `examples`: JSON payloads for Firebase seed data.

## Navigation
- Sidebar and Cmd+K use the same config in `src/config/nav-config.ts`.
- Nav items can include RBAC rules via `access` (currently not enforced).
- Icons are mapped in `src/components/icons.tsx`.

## Auth
- Clerk is removed; pages/components use local placeholders.
- Firebase auth lives in `src/lib/firebase/client.ts` with `AuthProvider` and
  `AuthGuard` under `src/features/auth/components`.
- Sign-in/sign-up views use `UserAuthForm` with email/password + GitHub/Google popup.

## Firebase data
- Acompanhamento overview (`src/app/dashboard/acompanhamento/page.tsx`) reads
  `projects` and `members` from Firestore.
- New projects are saved to `projects` with `start` as Firestore `Timestamp`.
- New members are saved to `members` with `isLeadership` and role/sector metadata.
- Project detail (`src/app/dashboard/acompanhamento/projetos/[projectId]/page.tsx`)
  reads `Activities` from Firestore and writes updates back to the same field.

### Firestore Schema

#### Collection: `projects`
```typescript
{
  id: string;                    // Document ID
  name: string;                  // Nome do projeto
  status: string;                // 'Em andamento' | 'Revisao' | 'Planejamento' | 'Execucao' | 'Validacao'
  health: string;                // 'Estavel' | 'Atencao' | 'Ok'
  area: string;                  // 'Automacao' | 'Eletrica'
  tipo: string;                  // Para Automacao: 'Domotica' | 'Industrial'
                                 // Para Eletrica: 'Projeto Eletrico' | 'Solar'
  client: string;                // Nome do cliente
  manager: string;               // Nome do gerente (referencia membro)
  managerId: string;             // ID do membro gerente
  start: Timestamp | null;       // Data de inicio do projeto
  next: string;                  // Proxima etapa/marco
  value: number;                 // Valor do projeto em reais
  updatedLabel?: string;         // Label de atualizacao ('agora', etc)
  createdAt: Timestamp;          // Data de criacao
  updatedAt: Timestamp;          // Data de ultima atualizacao
  Activities?: Array<{           // Lista de atividades do projeto
    id: string;                  // ID unico da atividade
    name: string;                // Nome da atividade
    issuedAt: string;            // Data de emissao (formato DD/MM/YYYY)
    dueAt: string;               // Prazo (formato DD/MM/YYYY)
    owner: string;               // Nome do responsavel
    ownerId?: string;            // ID do membro responsavel
    status: string;              // 'Planejado' | 'Em andamento' | 'Bloqueado' | 'Concluido'
    priority: string;            // 'Alta' | 'Media' | 'Baixa'
    description: string;         // Descricao da atividade
    updates?: Array<{            // Historico de atualizacoes
      id: string;                // ID da atualizacao
      author: string;            // Nome do autor
      authorId?: string;         // ID do autor
      note: string;              // Nota/comentario
      time: string;              // Timestamp (formato DD/MM/YYYY HH:mm)
    }>;
  }>;
}
```

#### Collection: `members`
```typescript
{
  id: string;                    // Document ID
  name: string;                  // Nome completo
  email: string;                 // Email (formato: nome@wattconsultoria.com.br)
  sector: string;                // 'Automacao' | 'Eletrica' | 'Comercial' | 'Marketing' | 'Institucional' | 'Executivo'
  cpf: string;                   // CPF do membro
  role: string;                  // 'Consultor' | 'Gerente' | 'Diretor' | 'Assessor' | 'Presidente'
  activity: string;              // Atividade atual
  status: string;                // 'online' | 'away' | 'offline'
  isLeadership: boolean;         // true se role != 'Consultor', false caso contrario
  createdAt: Timestamp;          // Data de criacao
  updatedAt: Timestamp;          // Data de ultima atualizacao
  agendaTasks?: Array<{          // Tarefas da agenda pessoal
    id: string;                  // ID unico da tarefa
    source: 'agenda';            // Sempre 'agenda' para tarefas pessoais
    title: string;               // Titulo da tarefa
    due: string;                 // Prazo (formato DD/MM/YYYY)
    status: string;              // 'Planejado' | 'Em andamento' | 'Bloqueado' | 'Concluido'
    priority: string;            // 'Alta' | 'Media' | 'Baixa'
    description: string;         // Descricao da tarefa
    updates?: Array<{            // Historico (mesmo formato de Activities)
      id: string;
      author: string;
      authorId?: string;
      note: string;
      time: string;
    }>;
  }>;
  alerts?: Array<{               // Alertas do membro
    id: string;                  // ID do alerta
    title: string;               // Titulo do alerta
    detail: string;              // Detalhes
    level: string;               // 'alto' | 'medio' | 'baixo'
    time: string;                // Tempo relativo ('ha 2 horas', etc)
  }>;
}
```

## Acompanhamento (custom)
- List page: `src/app/dashboard/acompanhamento/page.tsx`.
  - 2x2 grid with cards (projects, pie chart, members, alerts).
  - Project list uses a status dropdown filter.
  - Project links go to `/dashboard/acompanhamento/projetos/[projectId]`.
- Project detail: `src/app/dashboard/acompanhamento/projetos/[projectId]/page.tsx`.
  - 2x2 grid (left column: activities list + new activity form).
  - Right column: single details card spanning both rows.
  - Details card shows selected activity name, owner, due date, priority,
    description, updates list, and a project info dropdown.
  - Activities list is scrollable; page should not require overall scroll.
  - Data source: `src/data/acompanhamento-project.json`.

## Individual member dashboard
- Page: `src/app/dashboard/individual/page.tsx` (client component).
- Data sources:
  - Member doc in `members/{user.uid}` via Firebase Auth UID.
  - Project tasks from `projects` collection, filtered by `Activities[].ownerId === memberId`.
  - Member agenda tasks from `members/{uid}.agendaTasks`.
  - Time records from `members/{uid}.timeRecords` (used for "Ponto").
- Local cache:
  - `localStorage` keys `individual.member` and `individual.tasks`.
  - Cached time records are stored as ISO strings and rehydrated via `toDate()`.
- UI layout:
  - Mobile: tabs (Tarefas/Calendario/Agenda/Ponto).
  - Desktop: 2-column grid with cards for tasks, calendar/day tasks, agenda form, and ponto.
- Task actions:
  - "Detalhes" opens the details dialog (project or agenda).
  - Agenda tasks have edit/delete actions (Font Awesome icons).
  - Edit agenda uses its own dialog and updates `agendaTasks` in Firestore + cache.
  - Delete agenda uses a confirmation dialog and removes from Firestore + cache.
- Time tracking:
  - "Ponto" uses Entrada/Saida records to compute weekly hours.
  - Active entry runs a timer to show current elapsed time.

## Overview (dashboard)
- Main overview page component: `src/features/overview/components/overview.tsx`.
- Structure:
  - Header with greeting and optional Download button.
  - Tabs (Overview/Analytics) with Overview active.
  - Summary cards (4) with badges and trend icons.
  - Charts grid:
    - Bar graph: `BarGraph` (`src/features/overview/components/bar-graph.tsx`)
    - Recent sales card: `RecentSales` (`src/features/overview/components/recent-sales.tsx`)
    - Area graph: `AreaGraph` (`src/features/overview/components/area-graph.tsx`)
    - Pie chart: `PieGraph` (`src/features/overview/components/pie-graph.tsx`)
  - Skeletons available for bar, area, pie, and recent sales.

## Features (folder map)
- `src/features/auth`:
  - UI components for auth pages (`sign-in-view.tsx`, `sign-up-view.tsx`), currently placeholders (Clerk removed).
  - Supporting UI (`interactive-grid.tsx`, `github-auth-button.tsx`, `user-auth-form.tsx`).
- `src/features/kanban`:
  - `kanban-view-page.tsx` uses `PageContainer` and renders `KanbanBoard` with `NewTaskDialog`.
  - Drag-and-drop board via `@dnd-kit` (`kanban-board.tsx`, `board-column.tsx`, `task-card.tsx`).
  - State stored in Zustand with persistence (`utils/store.ts`), helpers in `utils/index.ts`.
- `src/features/overview`:
  - Dashboard cards + charts (`overview.tsx`).
  - Charts: `bar-graph.tsx`, `area-graph.tsx`, `pie-graph.tsx`, `line-graph.tsx`.
  - Table widget: `recent-sales.tsx`.
  - Skeletons: `bar-graph-skeleton.tsx`, `area-graph-skeleton.tsx`, `pie-graph-skeleton.tsx`, `recent-sales-skeleton.tsx`.
- `src/features/products`:
  - Listing via `product-listing.tsx` and `product-tables/*` (DataTable + filters).
  - Form for create/edit in `product-form.tsx`, view wrapper in `product-view-page.tsx`.
  - Uses mock data from `@/constants/mock-api`.
- `src/features/profile`:
  - `profile-view-page.tsx` is a placeholder card (Clerk removed).
  - Validation schema in `utils/form-schema.ts`.

## Layout and style conventions
- Page layouts typically use `PageContainer` with `pageTitle` and `pageDescription`.
- Cards use `Card`, `CardHeader`, `CardContent` and light gradient classes
  similar to overview page.
- Use shadcn/ui components from `src/components/ui`.
- Prefer Tailwind utility classes, keep spacing consistent with dashboard pages.

## Font Awesome sizing inside shadcn Button
- `src/components/ui/button.tsx` applies `[_svg:not([class*='size-'])]:size-4`, which can clamp SVG icons.
- Font Awesome SVGs scale via `font-size` / `size` prop (e.g. `size="2x"`).
- Override the button's SVG width/height back to `1em` so FA sizing works.
- Root layout already disables auto CSS injection for FA (`config.autoAddCss = false`).

Example:
```tsx
<Button
  size="icon"
  variant="ghost"
  className="h-10 w-10 ring-1 ring-white/60 [&_svg]:!h-[1em] [&_svg]:!w-[1em]"
>
  <FontAwesomeIcon icon={faPenToSquare} size="2x" />
</Button>
```

## Key components
- `PageContainer`: standard page wrapper with optional scrolling.
- `Sidebar`: layout in `src/components/layout/app-sidebar.tsx`.
- Charts: `src/features/overview/components`.
- Dropdowns/Selects: `src/components/ui/dropdown-menu.tsx`, `select.tsx`.

## Commands
- `npm run dev` (or `pnpm dev` / `bun dev`) for local dev.
- `npm run build` for production build.

## Deployment (Netlify)
- Base directory: repo root (empty or `.`).
- Build command: `npm run build` (or your package manager).
- Publish directory: `.next`.

## Git hooks
- Husky removed from `package.json`.
- `.husky/pre-commit` and `.husky/pre-push` removed.

## Change checklist (when editing)
- Update `AI_GUIDE.md` if structure or conventions change.
- Keep text ASCII-only unless the file already uses Unicode.
- Avoid adding dependencies without explicit request.
- Prefer small, focused edits and reuse existing components.

## Headless UI Combobox inside Shadcn Dialog
- **Problem**: When using `@headlessui/react` Combobox inside a Shadcn (Radix) Dialog, the dropdown options may be unresponsive to clicks ("frozen") because the Dialog blocks interaction with external portals.
- **Solution (Manual Positioning Strategy)**:
  1. **Disable Portal**: Set `portal={false}` on `ComboboxOptions`.
  2. **Remove Anchor**: Do NOT use the `anchor` prop.
  3. **Manual CSS Positioning**: Use absolute positioning to place the dropdown relative to the input container.
  4. **Z-Index Hierarchy**: Ensure specific stacking order (e.g., Overlay: 30, Content: 40, Combobox: 50).

  Example:
  ```tsx
  <div className="relative">
    <ComboboxInput ... />
    <ComboboxOptions
      portal={false}
      className="absolute top-full left-0 z-50 mt-1 w-full ..."
    >
      ...
    </ComboboxOptions>
  </div>
  ```
