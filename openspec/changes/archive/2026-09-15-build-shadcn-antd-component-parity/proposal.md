## Why

현재 `@repo/ui`는 shadcn/Radix와 기존 공용 컴포넌트를 사용하지만, Ant Design에서 익숙한 업무용 옵션과 상호작용을 일관된 API로 제공하지 못한다. 컴포넌트 구현과 Storybook 문서 생성을 자동화하되, 최종 품질 게이트에서 전체 coverage와 drift를 검증한다.

## What Changes

- shadcn/Radix를 구현 기반으로 유지하면서 AntD의 업무용 컴포넌트 범위와 주요 props, 이벤트, 상태 모델을 제공한다.
- **BREAKING** 신규 public component API를 `@repo/ui` 중심으로 정리하고 컴포넌트별 typed props, controlled/uncontrolled 계약을 고정한다.
- Data Entry, Data Display, Feedback, Navigation 컴포넌트를 단계별로 추가하며 loading, disabled, validation, empty, error, keyboard 동작을 포함한다.
- 컴포넌트 메타데이터 manifest를 단일 입력으로 두고, 컴포넌트 변경 시 Storybook Playground와 Controls를 자동 생성하며 최종 단계에서 전체 문서를 재생성한다.
- AntD의 소스, CSS, 아이콘, 브랜드 및 고유 시각 자산은 복제하지 않는다.
- 전체 public component를 대상으로 공통 primitive 우선의 UI/UX audit을 수행하고, 모달 잘림·모호한 입력 affordance·긴 콘텐츠·좁은 viewport 문제를 일괄 개선한다.

## Capabilities

### New Capabilities

- `shadcn-antd-component-parity`: shadcn 기반 공용 컴포넌트의 AntD 수준 props, 동작, 접근성, 상태 계약
- `design-system-story-generation`: 컴포넌트 manifest에서 Storybook 문서를 생성하고 coverage와 drift를 검증하는 도구

### Modified Capabilities

- 없음

## Impact

- `packages/ui/components` public exports, component types, tokens, hooks 및 테스트
- `scripts`의 manifest 기반 Storybook 생성·검증 도구
- `apps/storybook`은 generator 결과를 소비하며, generated story는 수동 수정하지 않는다.
- 추가 의존성은 필요성을 검토한 뒤 최소화하며, 날짜·가상화·업로드 등 기능별 경계에 기록한다.
