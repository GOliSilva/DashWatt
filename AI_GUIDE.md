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

## Navigation
- Sidebar and Cmd+K use the same config in `src/config/nav-config.ts`.
- Nav items can include RBAC rules via `access` (currently not enforced).
- Icons are mapped in `src/components/icons.tsx`.

## Auth
- Clerk is removed; pages/components use local placeholders.
- Firebase auth lives in `src/lib/firebase/client.ts` with `AuthProvider` and
  `AuthGuard` under `src/features/auth/components`.
- Sign-in/sign-up views use `UserAuthForm` with email/password + GitHub/Google popup.

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
