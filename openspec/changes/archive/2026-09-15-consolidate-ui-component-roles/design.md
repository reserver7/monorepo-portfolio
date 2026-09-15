## Context

`packages/ui`는 공용 primitive와 제품 화면 조합 component가 같은 public namespace에 섞여 있다. 현재 `StatCard`, `StateView`, `Spinner`, `Segmented`는 공용 primitive와 책임이 겹치거나 별도 API를 만들 만큼 독립적인 역할이 아니며, 여러 제품과 generated Storybook이 이를 참조한다.

## Goals / Non-Goals

**Goals:**

- public API를 역할 중심의 최소 집합으로 줄인다.
- 삭제 대상의 모든 import, manifest, props matrix, story를 함께 정리한다.
- 남는 유사 component의 선택 기준과 조합 관계를 문서·타입·Storybook에 일관되게 반영한다.
- API 삭제 후 전체 workspace가 내부 경로 우회 없이 typecheck와 lint를 통과하게 한다.

**Non-Goals:**

- 새로운 UI library나 dependency 도입
- 남겨진 component의 시각 디자인 전면 개편
- 제품별 화면 조합을 다시 공용 component로 승격

## Decisions

1. **Tabs 유지, Segmented 제거**
   - Tabs는 콘텐츠 영역과 URL/문서 구조에 연결되는 탐색 primitive라 공용성이 높다.
   - Segmented는 Tabs와 시각·상태 모델이 겹치고 즉시 선택 UI는 Button group 또는 제품 로컬 조합으로 충분하다.

2. **StatCard·StateView·Spinner 제거**
   - StatCard는 Card와 Statistic의 조합이고, StateView는 Empty/Alert/Result의 조합이다.
   - Spinner는 Spin의 alias/중복 구현이므로 feedback의 `Spin`을 단일 로딩 API로 유지한다.
   - 실제 사용처는 제품 로컬 조합으로 이전하며 공용 package에는 대체 alias를 남기지 않는다.

3. **기능 차이가 있는 유사 component는 유지하되 계층을 문서화**
   - Sheet는 저수준 overlay primitive, Drawer는 Sheet의 업무용 preset으로 유지한다.
   - Table은 markup primitive, DataTable은 정렬·필터·pagination을 포함하는 고급 component, List는 반복 콘텐츠 component로 유지한다.
   - Input은 기본 field, Password/Search는 명확한 단일 기능 확장, AutoComplete는 suggestion interaction을 제공한다.
   - Toast는 상태 저장/렌더링 기반이며 Message/Notification은 호출 편의 API로 유지한다.

4. **삭제는 단일 migration pass로 처리**
   - public export → 내부 import → manifest/props matrix → generated story 순서로 정리하고, 마지막에 deterministic generator를 실행한다.
   - 삭제된 API를 호환 alias로 남기지 않아 이후 신규 코드가 이전 역할을 재사용하지 못하게 한다.

## Risks / Trade-offs

- [Risk] 제품 앱의 import가 많아 일괄 삭제 시 typecheck가 깨질 수 있다. → 모든 caller를 먼저 검색하고 남은 primitive 조합으로 치환한 뒤 workspace typecheck를 실행한다.
- [Risk] Segmented 제거로 짧은 보기 전환 UX가 사라질 수 있다. → Tabs를 콘텐츠 전환에 사용하고 단순 상호 배타 선택은 제품 로컬 Button group으로 명시한다.
- [Risk] generated story 삭제가 수동 문서와 충돌할 수 있다. → manifest를 단일 입력으로 유지하고 전체 재생성·drift check를 함께 실행한다.
