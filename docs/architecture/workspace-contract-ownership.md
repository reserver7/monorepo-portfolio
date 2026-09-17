# Workspace Contract Ownership

`consolidate-workspace-contracts`의 기준선과 canonical owner를 기록한다. 새 공통 코드는 아래 표의 owner를 먼저 확인하고, 한 소비자만 가진 값은 해당 도메인에 남긴다.

| 계약 영역           | Canonical owner                                                | 소비자/예외                                     | 공개 경계                                                  |
| ------------------- | -------------------------------------------------------------- | ----------------------------------------------- | ---------------------------------------------------------- |
| Next 설정           | `packages/configs/src/next`                                    | 각 Next 앱의 보안 헤더·제품별 차이              | `@repo/configs/next/create-config`                         |
| Tailwind/PostCSS    | `packages/configs/src/tailwind`                                | 앱별 content와 제품별 token만 override          | `@repo/configs/tailwind/*`, `@repo/configs/postcss.config` |
| TypeScript          | `packages/configs/src/typescript`, 루트 `tsconfig.base.json`   | 앱의 `include`, Next plugin, server `outDir`    | package별 `tsconfig`                                       |
| ESLint              | `packages/eslint-config/src`                                   | 제품별 제한 rule만 앱에 선언                    | `@repo/eslint-config/*`                                    |
| API transport/query | `packages/react-query/src/http`                                | OpsLens GraphQL client와 Collab resource client | `@repo/react-query`                                        |
| API error/response  | `packages/configs/src/errors`, `packages/react-query/src/http` | 서버 도메인 오류는 서버 내부                    | `@repo/configs/errors`, `@repo/react-query/http`           |
| locale/timezone     | `packages/configs/src/i18n`                                    | 앱 메시지와 화면 정책은 앱 내부                 | `@repo/configs/i18n`                                       |
| 순수 유틸리티       | `packages/utils/src`                                           | 도메인 전용 helper는 해당 feature               | 명시된 subpath 우선                                        |
| UI/theme 계약       | `packages/ui`, `packages/theme`                                | 제품 화면 조합은 앱 feature                     | package manifest exports                                   |
| 환경변수            | 앱별 `lib/config/env` 및 template example                      | server-only 값은 server 앱 내부                 | public 값만 `NEXT_PUBLIC_*`                                |
| CI toolchain        | `.github/actions/setup-workspace/action.yml`                   | workflow별 검증 단계                            | composite action                                           |

현재 기준선:

- `pnpm audit:workspace`: 통과
- `pnpm check:contracts`: `UiLocale` type-only export를 component manifest로 해석하던 오류가 있었음
- 동일한 의미의 공통 설정은 앱에 복사하지 않고 canonical owner에서 import한다.
- public API에 필요한 export만 package manifest에 등록하고 내부 barrel은 public 경계로 사용하지 않는다.
