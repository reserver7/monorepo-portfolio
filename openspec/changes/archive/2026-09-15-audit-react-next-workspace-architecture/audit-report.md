# React/Next Workspace Architecture Audit

## Baseline

- Workspace inventory: 15 packages/apps including `templates/next-app`.
- JSON inventory: 53 JSON files parsed successfully.
- i18n: 2 app groups; locale key parity and extracted-key checks passed.
- `@repo/configs` already centralizes Next defaults; app-specific headers/analyzer settings remain explicit exceptions.
- `dynamic import` is already used for collaboration panels, OpsLens charts and modal controls.
- Pre-change Next builds passed: `collab-web` first load 102 kB shared, `opslens-web` first load 102 kB shared.

## Changes

- `templates/next-app/next.config.mjs` now consumes `@repo/configs/next/create-config`, matching real apps and avoiding a source-relative config boundary.
- `collab-web` now has root `loading.tsx` and `error.tsx` boundaries with retry UX.
- Added `check:contracts` and `scripts/check-workspace-contracts.mjs` for JSON parse, package name/export/main/type targets, i18n parity, manifest and foundations checks.
- No broad Server/Client boundary rewrite, blanket memoization or barrel-import rewrite was made: the inventory found no measured, low-risk change that justified it.

## Verification

- `pnpm check:contracts`: passed.
- `pnpm check:lint`: 13 tasks passed.
- `pnpm check:typecheck`: 12 tasks passed.
- `pnpm --filter @repo/collab-web build`: passed.
- `pnpm --filter @repo/opslens-web build`: passed.
- `templates/next-app` is a source template, not a workspace member; standalone `next build` is intentionally not runnable before `scripts/new-app.sh` copies it into `apps/*` and installs dependencies.
- `pnpm test:e2e:smoke`: 4 passed.
- `pnpm test:e2e:opslens`: 8 passed after applying the 9 pending local DB migrations.
- Build output retained the baseline shared First Load JS sizes.
