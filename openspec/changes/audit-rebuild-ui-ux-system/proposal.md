## Why

현재 public component는 기능 구현 범위는 넓지만 컴포넌트 간 시각 언어와 상호작용 규칙이 충분히 정리되지 않아, 의미가 다른 상태 색상·중복되는 선택 패턴·복합 컴포넌트의 불명확한 affordance가 함께 노출된다. Popconfirm처럼 manifest, export, generated story 중 하나가 누락되어 Storybook에서 확인할 수 없는 문제도 있어, 전체 시스템을 기능군 단위로 감사하고 실무 기준으로 재정의해야 한다.

## What Changes

- **BREAKING** 전체 public component를 기능군별로 전수 감사하고, 중복 props·중복 시각 패턴·역할이 겹치는 API를 통합 또는 제거한다.
- **BREAKING** Timeline, Steps, Progress, Tag, Badge 등 상태 표현의 의미 색상과 기본 스타일을 재설계해 임의의 초록·파랑 구분을 제거한다.
- **BREAKING** Tabs와 Segmented의 정보 구조·사용 목적·키보드 동작·API 경계를 명확히 분리한다.
- 공통 primitive, semantic token, focus, overlay, empty/loading/error, narrow viewport 규칙을 하나의 품질 기준으로 통일한다.
- 모든 public export와 Storybook manifest/generated story의 일관성을 전수 검증하고 Popconfirm을 포함한 누락·drift를 차단한다.
- 각 컴포넌트의 실제 props Controls, 상태 전환, 키보드, 긴 콘텐츠, dark mode, reduced-motion 동작을 기능군 batch로 검증한다.

## Capabilities

### New Capabilities

- 없음

### Modified Capabilities

- `shadcn-antd-component-parity`: public component의 의미론적 UI/UX, 중복 제거, 상태 토큰, 접근성 및 전수 동작 검증 계약을 추가한다.
- `design-system-story-generation`: 전체 public export와 manifest/generated story의 누락·drift 없는 노출 및 batch 재생성 계약을 강화한다.

## Impact

- `packages/ui/components/**`: public component 구조, props 타입, 공통 primitive와 semantic token 사용
- `packages/ui/metadata/component-manifest.json`, `scripts/generate-ui-stories.mjs`, `scripts/lib/**`: export/manifest/story coverage와 deterministic generation
- `packages/ui/stories/**`: 컴포넌트별 Controls 및 상호작용 fixture
- UI typecheck, lint, Storybook build, Playwright 기반 narrow/dark/keyboard/reduced-motion audit
- 의도적인 breaking change이므로 내부 import와 기존 시각 스타일에 의존하는 consumer를 함께 정리한다.
