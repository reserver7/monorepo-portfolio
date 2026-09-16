## 1. Baseline 및 분석 명령

- [x] 1.1 `opslens-web`과 `collab-web`의 현재 production build 및 bundle analyzer 실행 경로를 확인하고, 앱별 route/chunk baseline을 재현 가능한 산출물로 기록한다.
- [x] 1.2 두 앱에서 동일한 방식으로 analyzer를 실행할 수 있는 canonical root/app 명령을 추가하고, 정상 결과와 실패 결과를 각각 확인한다.

## 2. Package import 비용 최적화

- [x] 2.1 `@repo/ui`, `lucide-react` 및 기타 공통 package의 barrel/export 구조와 baseline bundle 영향을 분석하고, 변경 대상과 제외 대상을 근거와 함께 정한다.
- [x] 2.2 공통 Next 설정에 효과가 확인된 외부 package의 import 최적화를 적용하고 두 앱의 typecheck 및 production build가 통과하는지 확인한다.
- [x] 2.3 효과가 확인된 `@repo/ui` component group에만 호환 가능한 subpath export 또는 직접 import 경계를 추가하고, 기존 public root import와 Storybook 검증이 유지되는지 확인한다.
- [x] 2.4 두 앱의 `transpilePackages` 목록을 실제 소스 변환 필요성과 build 결과로 검증하고, 불필요한 package를 제거한 뒤 typecheck와 production build가 통과하는지 확인한다.

## 3. Route 및 Client boundary 최적화

- [x] 3.1 두 앱의 차트·협업·화이트보드·문서·대형 overlay route를 점검하고 초기 route에 포함되는 대형 module을 analyzer와 import graph로 확인한다.
- [x] 3.2 실제 초기 비용이 확인된 기능에만 dynamic import와 접근 가능한 loading/error fallback을 적용하고, 주요 interaction 및 390px viewport 검증을 통과한다.
- [x] 3.3 서버 렌더링 가능한 wrapper, 불필요한 Client boundary, 과도한 RSC props 및 독립적인 순차 fetch를 앱별로 점검하고 필요한 최소 변경을 적용한다.
- [x] 3.4 이미지·폰트·분석·로그·모니터링 리소스의 초기 로딩 우선순위와 hydration 차단 여부를 점검하고, 변경 후 주요 route의 LCP/interaction smoke가 유지되는지 확인한다.

## 4. 검증 및 회귀 방지

- [x] 4.1 두 Next 앱의 lint, typecheck, production build와 bundle analyzer를 실행하고 변경 전 baseline 대비 회귀 여부를 확인한다.
- [x] 4.2 `pnpm check`, `pnpm check:contracts`, `pnpm storybook:check` 및 관련 server/browser smoke 검증을 실행한다.
- [x] 4.3 analyzer 결과, 변경 파일, public API 호환성 및 최적화하지 않은 영역을 변경 문서에 기록하고 `openspec validate --specs --strict`를 통과한다.
