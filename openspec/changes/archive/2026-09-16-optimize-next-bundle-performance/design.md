## Context

`apps/opslens-web`과 `apps/collab-web`은 Next.js 앱이며, `apps/storybook`은 이미 Storybook의 Vite builder를 사용한다. 공통 Next 설정은 `packages/configs`에 있고, `packages/ui`는 많은 컴포넌트를 하나의 public barrel에서 export한다. 일부 차트·협업 기능은 이미 dynamic import를 사용하지만 앱별 동일한 측정 명령과 bundle 회귀 기준은 없다.

## Goals / Non-Goals

**Goals:**

- 두 Next 앱의 production bundle을 동일한 방식으로 측정한다.
- 실제 bundle 비용이 확인된 공통 import와 대형 기능만 최소 변경으로 분리한다.
- Client Component 경계와 서버 데이터 전달을 점검해 초기 로딩 비용을 줄인다.
- UI 동작, 접근성, route 계약을 보존한다.

**Non-Goals:**

- Next.js를 Vite 앱으로 교체하지 않는다.
- 측정 근거 없이 전체 파일의 import·memo·dynamic 구조를 일괄 변경하지 않는다.
- 새 상태관리·번들러·분석 서비스를 추가하지 않는다.
- 성능 개선을 이유로 public component API를 재설계하지 않는다.

## Decisions

### 1. 측정 우선

각 앱의 기존 production build와 bundle analyzer 결과를 기준선으로 만든다. 수치가 확인된 route/chunk만 변경 대상으로 삼고, analyzer 실행은 개발자용 canonical 명령으로 제공한다. CI의 모든 PR에 전체 production analyzer를 강제하지 않아 기존의 빠른 검증 목표를 해치지 않는다.

### 2. 공통 Next 설정에서 package import 최적화

`packages/configs`의 공통 Next 설정에서 아이콘처럼 실제로 barrel 비용이 확인된 외부 package부터 `optimizePackageImports`를 적용한다. `@repo/ui`는 내부 package exports와 TypeScript source 구조를 먼저 검토한 후, 효과가 확인된 컴포넌트 그룹에 한해서 subpath export 또는 소비 import를 도입한다. 모든 import를 한 번에 바꾸지 않는다.

### 3. 대형 기능은 사용 시점 로딩

차트, 협업/화이트보드, 문서 편집기, 대형 overlay처럼 초기 화면에 필요하지 않은 기능은 기존 `next/dynamic` 패턴을 재사용한다. `ssr: false`는 브라우저 전용 모듈에만 사용하고, loading/error 상태와 접근 가능한 fallback을 함께 유지한다.

### 4. Client boundary는 작은 island로 유지

페이지와 서버 레이아웃은 가능한 한 Server Component로 남긴다. 상호작용이 필요한 subtree만 Client Component로 유지하고, 서버에서 가져온 객체는 실제로 필요한 primitive/좁은 DTO만 전달한다. 단순한 `useMemo`/`memo` 추가는 profiler 또는 bundle/렌더링 근거가 있을 때만 한다.

### 5. 검증은 기능 보존과 함께 수행

변경마다 lint, typecheck, 관련 Storybook/interaction 검사와 앱 build를 수행한다. 최종적으로 두 앱의 analyzer 결과, 주요 route smoke, 좁은 viewport 및 `git diff --check`를 확인한다.

### 6. 초기 리소스와 workspace transpile 범위

`transpilePackages`는 실제로 raw TypeScript/JSX 또는 변환이 필요한 workspace package만 남긴다. 이미지·폰트는 기존 Next 최적화 경로와 우선순위를 확인하고, 분석·로그·모니터링 같은 비핵심 third-party는 hydration 이후 로딩 여부를 점검한다. 새 리소스 최적화 도구는 추가하지 않는다.

## Risks / Trade-offs

- [Risk] package import 경계를 바꾸면 public export 또는 TypeScript resolution이 깨질 수 있다. → 기존 root import 호환을 유지하고, subpath는 단계적으로 추가하며 typecheck와 build로 검증한다.
- [Risk] dynamic import가 loading 중 layout shift를 만들 수 있다. → 기존 화면 크기에 맞는 skeleton/fallback을 사용하고 좁은 viewport smoke를 실행한다.
- [Risk] Client Component를 과도하게 줄이면 hydration 또는 브라우저 이벤트가 깨질 수 있다. → 실제 client-only API를 사용하는 subtree만 변경하고 interaction 검증을 통과시킨다.
- [Risk] analyzer 자체가 build 시간을 늘릴 수 있다. → 일반 CI 기본 경로에는 강제하지 않고 명시적 분석 명령으로 실행한다.

## Migration Plan

1. 두 앱의 baseline build/analyzer를 생성하고 큰 route/chunk를 기록한다.
2. 공통 Next 설정과 package import 구조를 우선 변경한다.
3. 측정된 대형 기능과 Client boundary를 앱별로 최소 수정한다.
4. 전체 검증을 통과한 뒤 변경 전후 결과를 기록한다.
5. 회귀가 확인되면 해당 import/dynamic 변경만 되돌리고 baseline 설정은 유지한다.
