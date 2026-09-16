## Why

현재 두 개의 Next.js 앱은 공통 UI barrel import, 넓은 Client Component 경계, 일부 대형 기능의 초기 로딩으로 인해 실제 번들 비용을 추적하고 줄일 수 있는 기준이 부족합니다. 컴포넌트와 기능이 계속 추가되기 전에 앱별 측정 기준과 최소 비용의 최적화 경계를 확립해야 합니다.

## What Changes

- 두 Next.js 앱에서 동일한 방식으로 번들 분석과 결과 비교를 수행할 수 있는 canonical 명령을 추가한다.
- `@repo/ui` 및 아이콘 등 공통 패키지 import 비용을 측정하고, 효과가 확인된 경로부터 tree-shaking 가능한 import 구조로 개선한다.
- 차트, 협업/화이트보드, 문서 편집기, 대형 overlay 등 초기 화면에 필요하지 않은 기능은 사용 시점에만 로드되도록 점검·개선한다.
- Server/Client Component 경계, 서버 데이터 병렬 조회, RSC 전달 데이터 크기를 앱별로 감사하고 필요한 부분만 수정한다.
- `transpilePackages`, 이미지·폰트·분석/로그 등 초기 로딩 리소스를 점검하고 실제 필요 범위만 유지한다.
- 최적화 전후의 빌드·런타임·접근성·public component 동작을 검증한다.
- Storybook의 Vite 사용과 Next.js 앱 구조는 유지하며, 앱 전체를 Vite로 전환하지 않는다.

## Capabilities

### New Capabilities

없음.

### Modified Capabilities

- `react-next-workspace-architecture`: 앱별 번들 비용, Client 경계, 지연 로딩 및 데이터 직렬화에 대한 실행 계약을 측정 가능하게 강화한다.
- `ui-performance-composition-audit`: 공통 UI barrel import와 실제 사용 시점 기반 모듈 로딩을 전체 workspace 성능 감사 범위에 포함한다.

## Impact

- 대상 앱: `apps/opslens-web`, `apps/collab-web`
- 대상 공통 패키지: `packages/ui`, `packages/theme`, `packages/configs`
- 대상 설정·스크립트: 공통 Next 설정, root/package scripts, 필요 시 package exports
- public 컴포넌트 API와 사용자 동작은 변경하지 않는다.
- 새 런타임 의존성은 추가하지 않으며, Storybook과 Vite는 기존 용도로 유지한다.
