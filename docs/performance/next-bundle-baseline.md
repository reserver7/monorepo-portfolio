# Next bundle baseline

이 문서는 `optimize-next-bundle-performance` 변경의 production bundle 기준선과 비교 결과를 기록한다. `.next` 내부 analyzer 산출물은 생성 파일이므로 Git에 커밋하지 않는다.

## 재현 명령

```bash
pnpm analyze:next
```

## 2026-09-16 기준선

### `@repo/opslens-web`

| Route              |    Size | First Load JS |
| ------------------ | ------: | ------------: |
| `/`                |  2.1 kB |        316 kB |
| `/command-center`  | 6.87 kB |        320 kB |
| `/issues`          |   184 B |        376 kB |
| `/issues/[id]`     |   184 B |        376 kB |
| `/logs`            |   499 B |        338 kB |
| `/services/[name]` |    5 kB |        319 kB |
| `/settings`        | 2.15 kB |        316 kB |
| Shared             |       - |        102 kB |

### `@repo/collab-web`

| Route              |    Size | First Load JS |
| ------------------ | ------: | ------------: |
| `/`                |   120 B |        102 kB |
| `/docs`            | 5.98 kB |        231 kB |
| `/docs/[id]`       | 33.1 kB |        266 kB |
| `/whiteboard`      | 5.88 kB |        231 kB |
| `/whiteboard/[id]` | 11.6 kB |        251 kB |
| Shared             |       - |        102 kB |

## 해석 기준

- 개선 여부는 동일한 Next/pnpm 환경에서 route별 First Load JS와 shared chunk를 비교한다.
- analyzer가 실패하거나 route 결과가 생성되지 않으면 성능 개선으로 간주하지 않는다.
- 숫자 감소만으로 완료하지 않고 주요 interaction, 접근성, 390px viewport 검증을 함께 통과해야 한다.

## 2026-09-16 최적화 적용 후

- 공통 Next 설정에 `optimizePackageImports` 대상으로 `@repo/ui`, `lucide-react`를 추가했다.
- 두 앱 모두 동일한 `pnpm analyze:next` 명령으로 analyzer client report와 route 결과를 생성했다.
- Collab route 결과는 baseline과 동일했다.
- OpsLens의 `/issues`, `/issues/[id]`는 376 kB에서 375 kB로 소폭 감소했고, `/logs`는 route chunk 분할 차이로 route size가 499 B에서 2.22 kB로 표시되었지만 First Load JS는 338 kB로 유지됐다.
- shared First Load JS는 두 앱 모두 102 kB로 유지되어, 현재 측정 범위에서 `@repo/ui` subpath export를 추가할 충분한 효과는 확인되지 않았다.

## 감사 결과

- `transpilePackages` 대상 workspace package는 모두 source-only(`main`/`types`가 `src` 또는 TypeScript entry)라 현재 목록을 유지한다.
- Chart.js, 문서 협업 패널, whiteboard side panel은 이미 dynamic import와 loading fallback을 사용한다.
- 별도 analytics/logging third-party script는 없고, theme font preload 목록은 비어 있다.
- 앱 이미지 사용은 확인된 범위에서 `next/image`를 사용하므로 추가 변경하지 않았다.
- `@repo/ui` root import는 public API 호환성을 위해 유지하고, analyzer에서 실질적 이득이 확인될 때 subpath export를 별도 변경으로 진행한다.
