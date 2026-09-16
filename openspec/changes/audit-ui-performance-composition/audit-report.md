# UI Performance and Composition Audit

## Baseline

- Scope: all nine packages under `packages/**` (including non-React packages).
- Inventory: `configs` 16 files, `eslint-config` 8, `forms` 12, `opslens` 12, `react-query` 23, `theme` 18, `ui` 350, `utils` 43, `zustand` 11.
- Baseline and post-change `pnpm check:lint`: passed.
- Baseline and post-change `pnpm check:typecheck`: passed.

## Findings and disposition

| Package                                        | Finding                                                                                       | Disposition                                                                               |
| ---------------------------------------------- | --------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `ui`                                           | Modal exposed opposing `closeOn*` and `prevent*` props                                        | Removed the duplicate `prevent*` API and kept the positive `closeOn*` API.                |
| `ui`                                           | Modal/AlertConfirm built-in-action checks used `useMemo` for a boolean                        | Replaced both with direct boolean derivation; no state or identity contract was involved. |
| `ui`                                           | TreeSelect flattened the complete tree and searched selected labels on every render           | Memoized the flattened tree and value map; selection behavior is unchanged.               |
| `ui`                                           | `clsx` and `tailwind-merge` were declared but not imported by the package                     | Removed the unused direct dependencies and updated the lockfile.                          |
| `react-query`                                  | Flattening infinite-query pages is derived data and already memoized                          | No change; existing memo boundary is appropriate.                                         |
| `forms`, `theme`, `zustand`                    | Effects/callbacks are lifecycle or controlled-state boundaries, not derived-state duplication | No speculative rewrite.                                                                   |
| `configs`, `eslint-config`, `opslens`, `utils` | No high-confidence performance or composition defect found from the package-wide inventory    | No speculative abstraction or dependency change.                                          |

## Deliberately unchanged

Barrel imports were not rewritten wholesale: the package export surface is intentional and no bundle measurement identified a heavy module boundary in this audit. Existing memoization was not removed or added without a render-cost signal. Visual/API redesign is outside this change.
