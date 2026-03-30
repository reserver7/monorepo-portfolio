# Bundle Splitting Report

Last updated: 2026-03-30

## Current Dynamic Splits

- `apps/opslens-dashboard/app/(app)/page.tsx`
  - `SeverityDistributionChart`
  - `ErrorTrendChart`
  - `TopRepeatedErrorsChart`
- `apps/whiteboard/app/board/[id]/page.tsx`
  - `BoardSidePanel`
- `apps/docs/app/doc/[id]/page.tsx`
  - `PresencePanel`
  - `CommentsPanel`
  - `HistoryPanel`
  - `ActivityLogPanel`

## Heavy Files (LOC)

- `apps/server/src/index.ts` (~1359)
- `apps/server/src/features/collab/store.ts` (~1046)
- `apps/whiteboard/app/board/[id]/page.tsx` (~1036)
- `apps/docs/features/collaboration/hooks/use-collaboration.ts` (~716)
- `apps/opslens-api/src/features/ops/ops.service.ts` (~661)

## Applied This Round

- Added dynamic split for whiteboard side panel:
  - `apps/whiteboard/app/board/[id]/page.tsx`
- Reduced AppShell sync overhead:
  - merged redundant form/store synchronization effects in `apps/opslens-dashboard/app/(app)/app-shell.tsx`
- Narrowed ops feature barrel:
  - `apps/opslens-dashboard/features/ops/index.ts` now re-exports component layer only.

## Next Practical Split Targets

- Extract server bootstrap and routes from:
  - `apps/server/src/index.ts`
- Split whiteboard room page into view model + canvas surface modules:
  - `apps/whiteboard/app/board/[id]/page.tsx`
- Split collaboration hook into transport/state/editor modules:
  - `apps/docs/features/collaboration/hooks/use-collaboration.ts`
