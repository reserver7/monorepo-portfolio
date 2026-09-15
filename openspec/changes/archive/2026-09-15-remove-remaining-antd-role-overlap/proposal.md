## Why

현재 디자인시스템은 1차 중복 제거 이후에도 AntD 기준으로 `Table`/`DataTable`, `Sheet`/`Drawer`, dialog 확인 흐름, toast API가 동시에 public으로 노출되어 선택 기준이 흐려져 있다. 공용 API를 역할 중심으로 줄여 제품 팀의 선택 비용과 Storybook 탐색 중복을 낮춘다.

## What Changes

- `DataTable`을 업무용 데이터 그리드 public component로 유지하고 `Table`은 내부 markup primitive로 전환한다. **BREAKING**
- `Drawer`를 AntD 호환 public overlay로 유지하고 `Sheet`는 내부 구현 primitive로 전환한다. **BREAKING**
- `Modal`을 blocking dialog의 단일 public API로 유지하고 `AlertConfirm` public API를 제거한다. **BREAKING**
- `Popconfirm`은 앵커 주변의 경량 확인용으로 유지해 Modal과 역할을 분리한다.
- `message`와 `notification`을 imperative feedback API로 유지하고 `Toast`는 내부 renderer로 전환한다. **BREAKING**
- manifest, props matrix, generated Storybook, import migration을 한 번에 동기화한다.

## Capabilities

### New Capabilities

### Modified Capabilities

- `design-system-story-generation`: public 역할 변경에 맞춰 manifest·generated story drift와 internal primitive 노출을 검증한다.
- `shadcn-antd-component-parity`: AntD 기준 public component 역할과 중복 없는 선택 계약을 명시한다.

## Impact

- `packages/ui` public exports, component barrel files, overlay/data/table/feedback 구현
- 제품 앱의 `Table`, `Sheet`, `AlertConfirm`, `Toast` 직접 import migration
- component manifest, props matrix, Storybook generator와 generated stories
- 기존 해당 symbol을 직접 import하는 소비자는 대체 API로 마이그레이션해야 한다.
