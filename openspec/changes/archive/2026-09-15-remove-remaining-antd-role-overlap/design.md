## Context

현재 @repo/ui에는 AntD 업무 component와 shadcn/Radix 구현 primitive가 같은 public barrel과 manifest에 섞여 있다. 상세 요구사항은 변경 spec에 정의한다.

## Goals / Non-Goals

**Goals:**

- AntD 기준으로 소비자가 선택하는 public 역할을 하나씩 남긴다.
- internal primitive와 Storybook 문서 생성을 public API에서 분리한다.
- 기존 앱 사용처를 대체 API로 migration하고 전체 생성·검증 흐름을 통과시킨다.

**Non-Goals:**

- 각 component의 시각 디자인이나 AntD 전체 prop parity를 다시 설계하지 않는다.
- 새 데이터 모델이나 외부 dependency를 추가하지 않는다.

## Decisions

AntD의 분류와 사용 맥락을 public 경계의 기준으로 삼는다. 제품에서 직접 선택하는 것은 업무 목적 component로 제한하고, shadcn/Radix 조합에 필요한 저수준 primitive는 `packages/ui/components/internal` 또는 상위 component 내부에서만 사용한다.

| 역할                | Public                    | Internal                             |
| ------------------- | ------------------------- | ------------------------------------ |
| 데이터 그리드       | `DataTable`               | `Table` markup parts                 |
| blocking overlay    | `Modal`                   | Radix Dialog parts                   |
| side overlay        | `Drawer`                  | `Sheet` parts                        |
| 확인                | `Popconfirm`(anchored)    | `AlertConfirm` dialog implementation |
| imperative feedback | `message`, `notification` | `Toast` renderer                     |

## Risks / Trade-offs

- [Risk] `Table`, `Sheet`, `AlertConfirm`, `Toast` 직접 import가 있는 소비자는 breaking change를 겪는다. → 전체 workspace 검색으로 호출부를 먼저 migration하고 typecheck로 누락을 차단한다.
- [Risk] primitive를 숨기면 저수준 조합성이 줄어든다. → public 업무 API의 `DataTable`, `Drawer`, `Modal`, `Popconfirm`, `message`, `notification`을 유지한다.
- [Risk] generated story 수가 감소해 문서 링크가 바뀐다. → manifest 재생성과 Storybook discoverability check를 같은 변경에서 수행한다.

## Migration Plan

- `Table` 사용처는 단순 표면 `DataTable`로 올리거나 제품 로컬 `<table>` markup으로 전환한다.
- `Sheet` 조합은 `Drawer`로 전환하고, 내부 component 간 참조는 private relative import로 유지한다.
- `AlertConfirm` 호출은 `Modal` compound API 또는 `Popconfirm`으로 목적에 맞게 전환한다.
- `<Toast />` host는 앱 shell 내부 private provider로 이동하고, 소비자는 `message` 또는 `notification`만 사용한다.

## Verification

manifest에는 public component만 등록한다. generator는 internal-only symbol의 story를 만들지 않으며, public export·manifest·generated story의 집합 차이를 실패로 처리한다. 전체 재생성 후 lint, typecheck, Storybook build와 390px 렌더 검사를 수행한다.

\*\*\* Add File: /Users/luke/orca/workspaces/Monorepo-portfolio/lionfish/openspec/changes/remove-remaining-antd-role-overlap/specs/design-system-story-generation/spec.md

## MODIFIED Requirements

### Requirement: manifest가 Storybook 생성의 단일 입력이다

각 public component는 category, export path, 표시명, 기본 args, Controls 타입을 manifest에 등록해야 한다(MUST). manifest는 실제 public export와 일치해야 하며(MUST), Popconfirm을 포함한 모든 public component는 동일한 생성 경로와 문서 노출 계약을 가져야 한다(MUST). 삭제되거나 통합된 component는 manifest, props matrix, generated story에 남아서는 안 된다(MUST). internal-only primitive는 manifest와 generated story에 등록해서는 안 된다(MUST).

#### Scenario: 컴포넌트가 추가된다

- **WHEN** public component와 metadata를 등록하고 생성 명령을 실행한다
- **THEN** 해당 컴포넌트의 Playground와 Controls story가 정해진 경로에 생성된다

#### Scenario: 삭제된 component가 manifest에 남는다

- **WHEN** component가 public API에서 제거되었지만 manifest 또는 generated story에 entry가 남아 있다
- **THEN** drift check가 stale entry를 표시하고 실패한다

#### Scenario: internal primitive가 manifest에 등록된다

- **WHEN** `Table`, `Sheet` 또는 다른 internal-only primitive가 manifest에 등록된다
- **THEN** manifest check가 public 경계 위반을 표시하고 실패한다

### Requirement: 생성 결과의 drift를 검증한다

생성기는 동일한 manifest에 대해 결정적인 결과를 내야 하며(MUST), 생성 파일이 없거나 수동 변경되면 check 명령이 실패해야 한다(MUST). coverage check는 public export, manifest entry, generated story가 서로 일치하는지 전체 범위로 검사해야 한다(MUST).

#### Scenario: 생성 story가 오래되었다

- **WHEN** manifest 또는 generated story가 서로 일치하지 않는다
- **THEN** check 명령은 누락·불일치 파일을 표시하고 실패한다

#### Scenario: Popconfirm story가 누락된다

- **WHEN** Popconfirm이 public export와 manifest에는 있지만 generated story가 없다
- **THEN** 전체 coverage check가 Popconfirm을 누락 대상으로 표시하고 실패한다

#### Scenario: 전체 story를 재생성한다

- **WHEN** 컴포넌트 batch 구현 또는 metadata 변경 후 전체 생성 명령을 실행한다
- **THEN** 모든 public component story가 동일한 규칙으로 재생성되고 drift check가 통과한다
