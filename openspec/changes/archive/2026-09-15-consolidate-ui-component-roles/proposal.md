## Why

현재 공용 UI 패키지에는 같은 목적을 다른 이름으로 표현하는 컴포넌트가 함께 노출되어 사용자가 적절한 선택을 하기 어렵고, Storybook과 props 문서에도 중복이 생긴다. 제품별 화면 컴포넌트와 공용 primitive의 경계를 분리해 API를 작게 유지하고 유지보수 비용을 줄인다.

## What Changes

- **BREAKING** `StatCard`, `StateView`, `Spinner`를 `@repo/ui` public API에서 제거한다.
- **BREAKING** `Segmented`를 제거하고 콘텐츠 탐색용 `Tabs`만 공용 navigation 선택 컴포넌트로 유지한다.
- `Sheet` 기반 preset인 `Drawer`, `Toast` 기반 알림 API, 기본 `Table`과 고급 `DataTable`, 단순 `List`의 역할 경계를 문서화한다.
- `Input`을 기반으로 한 `Search`, `Password`, `AutoComplete`의 확장 관계와 선택 컴포넌트의 데이터 모델 차이를 명확히 한다.
- 삭제 컴포넌트의 내부 사용처를 남은 공용 primitive 또는 제품 로컬 컴포넌트로 전환한다.
- manifest, props matrix, generated Storybook, export drift check를 중복 없는 목록으로 재생성한다.

## Capabilities

### New Capabilities

없음.

### Modified Capabilities

- `design-system-story-generation`: 삭제된 public component와 역할 통합 결과가 Storybook manifest 및 generated story에 반영되어야 한다.
- `shadcn-antd-component-parity`: public component의 역할 경계와 중복 없는 export 계약을 정의해야 한다.

## Impact

- `packages/ui` public exports, component directories, manifest, props matrix, generated Storybook에 breaking change가 발생한다.
- `apps/collab-web`, `apps/opslens-web`, `packages/ui/components/data-table`의 내부 import와 화면 구성이 영향을 받는다.
- 새 dependency는 추가하지 않는다. 삭제 대상의 기능은 기존 `Card`, `Empty`, `Alert`, `Spin` 및 제품별 조합으로 대체한다.
