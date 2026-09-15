## Context

감사 범위는 `packages/**` 전체다. 현재 UI에서 Modal의 반대 의미 close prop, Tree/TreeSelect의 반복 로직, overlay 구현 중복, DataTable의 큰 boolean surface, 앱 barrel import와 inline 렌더링 후보가 확인됐으며, 다른 package에서도 같은 문제를 탐색한다. 모든 파일을 기계적으로 바꾸지 않고 측정 가능한 비용과 중복이 있는 항목만 변경한다.

## Goals / Non-Goals

**Goals:**

- 모든 package의 public API와 dependency 경계를 확인하고 의미 중복·dead code·single-use abstraction을 정리한다.
- 실제 렌더링·요청·번들 비용이 있는 코드만 최적화한다.
- API migration과 동작 보존을 자동 검증한다.

**Non-Goals:**

- 시각 디자인 토큰이나 AntD 기능 범위를 다시 설계하지 않는다.
- 근거 없이 모든 barrel import, memo, cache, dynamic import를 일괄 변경하지 않는다.

## Decisions

- Modal은 allow-list 의미의 close 옵션을 기준으로 정리하고, prevent 계열과 동시 제공하지 않는다.
- Tree와 TreeSelect는 컴포넌트별 차이를 props로 남기고, node traversal과 keyboard utility만 internal helper로 공유한다.
- DataTable은 무리한 prop 삭제보다 toolbar/pagination/selection 같은 확장 지점을 children 또는 명시적인 sub-component로 분리할 수 있는지 먼저 측정한다.
- barrel import는 번들 분석 또는 build 결과로 효과가 확인되는 앱 경계에서만 직접 import로 변경한다.
- React 성능 최적화는 profiler 또는 렌더 카운트·interaction 테스트로 회귀를 검증한다.
- packages/forms, react-query, utils, zustand, theme, configs, opslens 등 비 UI package도 dependency·캐시·이벤트·직렬화·public API를 같은 기준으로 감사한다.

## Risks / Trade-offs

- [Risk] public prop 통합은 소비자 breaking change를 만든다. → migration 문서와 typecheck를 같은 변경에서 처리한다.
- [Risk] 과도한 memoization이 오히려 복잡도를 높인다. → 고비용 목록·트리와 실제 반복이 확인된 컴포넌트에만 적용한다.
- [Risk] 동적 import가 초기 UX를 늦출 수 있다. → fallback과 preload가 필요한 경우에만 적용하고 build 결과를 비교한다.

## Migration Plan

1. `packages/**`의 모든 package에 대해 API·dependency·사용처를 전수 검색하고 baseline lint/typecheck/build/test 결과를 기록한다.
2. 감사 결과를 삭제·단순화·API·성능·테스트 보강으로 분류하고 batch 단위로 리팩토링한다.
3. 앱 migration, package test, Storybook interaction 및 390px 렌더를 실행하고 main spec에 결과를 sync한다.
