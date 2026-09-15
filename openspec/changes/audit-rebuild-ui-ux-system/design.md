## Context

현재 `packages/ui`는 public component, 기능군별 barrel, metadata manifest, generated Storybook이 이미 존재한다. 하지만 여러 컴포넌트가 같은 시각·상태 패턴을 각자 구현하고 있고, navigation/data-display/overlay의 역할 경계와 Storybook coverage를 한 번에 판단할 수 있는 품질 계약이 부족하다. 구현은 기존 스타일을 보존하는 마이그레이션이 아니라 breaking change를 허용한 전면 재정의로 진행한다.

## Goals / Non-Goals

**Goals:**

- 75개 public component를 기능군 batch로 감사하고 공통 primitive, semantic token, API taxonomy를 재정렬한다.
- Timeline/Steps/Progress 등의 상태 표현에서 색상·아이콘·텍스트의 의미를 일관되게 정의한다.
- Tabs와 Segmented의 정보 구조 및 interaction boundary를 분리한다.
- 모든 public export ↔ manifest ↔ generated story coverage를 자동으로 검증한다.
- 실제 Controls 변경과 키보드·responsive·dark/reduced-motion audit을 완료 기준으로 삼는다.

**Non-Goals:**

- 특정 제품(Opslens)의 화면이나 브랜드를 디자인하는 일
- Ant Design의 내부 구현을 복제하거나 모든 외부 API를 무조건 유지하는 일
- 새 컴포넌트를 추가하는 일을 품질 문제가 확인된 기존 컴포넌트보다 먼저 진행하는 일

## Decisions

### 1. 기능군 batch와 공통 계약을 기준으로 재작업

입력·선택, navigation, overlay, feedback, data display, layout/media 순으로 inventory를 고정하고 각 batch에서 공통 props, focus, 상태, empty/loading/error를 함께 검토한다. 컴포넌트 하나씩 독립 수정하는 방식은 중복을 재생산하므로 선택하지 않는다.

### 2. semantic token 우선, 컴포넌트별 임의 색상 금지

색상은 `success`, `warning`, `danger`, `info`, `neutral` 같은 의미 토큰으로만 소비한다. Timeline/Steps의 완료·현재·대기·오류는 색상 외에 구조, 아이콘 또는 텍스트로도 표현한다. 제품별 브랜드 색은 token layer에서 교체할 수 있도록 하고 component CSS에 직접 고정하지 않는다.

### 3. 역할 기반 navigation 경계

Tabs는 페이지 또는 콘텐츠 영역의 지속적인 탐색과 panel 관계를 담당하고, Segmented는 짧은 선택 집합의 즉시 상태 전환만 담당한다. 둘을 동일한 pill 스타일이나 API로 통합하지 않고, 사용 목적이 코드에서 드러나는 최소 API로 분리한다.

### 4. manifest 기반 Storybook 일괄 재생성

generated story는 수동 편집 대상이 아니며, manifest를 단일 입력으로 전체 재생성한다. 복합 상호작용은 별도 custom story로 유지하고, checker는 public export·manifest·generated story를 동시에 비교한다. Popconfirm은 overlay batch의 필수 coverage fixture로 고정한다.

### 5. 시각·동작 검증을 같은 완료 기준으로 사용

UI audit은 DOM/접근성 검사만으로 끝내지 않고 390px narrow viewport, dark mode, focus-visible, keyboard-only, reduced-motion, 긴 콘텐츠 및 각 Controls prop 변경을 포함한다. 실패는 컴포넌트 단위가 아니라 기능군 단위로 수정해 공통 원인을 한 번만 고친다.

## Risks / Trade-offs

- [Breaking API] 기존 consumer가 기존 variant나 색상에 의존할 수 있음 → public props matrix를 갱신하고 내부 사용처를 함께 전환한 뒤 typecheck로 잔여 사용을 차단한다.
- [Scope] 75개 component의 전수 audit은 한 번에 큰 변경이 됨 → 기능군 batch와 deterministic checklist로 진행하고 각 batch마다 검증한다.
- [Visual preference] 개인 취향 중심의 스타일 논쟁이 생길 수 있음 → semantic meaning, task clarity, contrast, keyboard flow를 우선 acceptance 기준으로 둔다.
- [Generated drift] story 수동 수정이 재발할 수 있음 → generator/check를 CI 품질 gate로 유지하고 generated 파일에는 수동 편집 금지를 명시한다.
