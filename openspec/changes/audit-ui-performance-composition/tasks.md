## 1. Baseline 및 API 감사

- [x] 1.1 `packages/**` 모든 package의 public export, internal module, dependency, script, test, docs, barrel import를 목록화하고 baseline 검증 결과를 기록한다
- [x] 1.2 모든 package에서 dead code, 중복 API, single-use abstraction, boolean prop, inline component, effect/memo, waterfall, cache/listener/serialization 후보를 식별한다
- [x] 1.3 후보별 호출부·번들·렌더·요청 비용을 측정해 실제 변경 대상과 변경하지 않을 대상을 기록한다

## 2. Composition 및 API 리팩토링

- [x] 2.1 package별 중복·dead code·single-use abstraction·불필요한 dependency를 감사하고 근거가 있는 항목만 제거한 뒤 package lint/typecheck를 통과한다
- [x] 2.2 Modal의 중복 close prop과 TreeSelect 반복 탐색을 정리하고 overlay/DataTable은 중복 여부를 검증한 뒤 모든 사용처 typecheck를 통과한다
- [x] 2.3 공통 package의 public API·캐시·상태·이벤트·직렬화 경계를 감사하고 변경 근거가 있는 경계만 리팩토링한 뒤 관련 package 검증을 통과한다

## 3. React 성능 리팩토링

- [x] 3.1 모든 React package의 inline component와 불필요한 effect/derived state를 감사하고 실제 비용이 확인된 후보만 제거한 뒤 기존 callback·controlled 상태 검증을 통과한다
- [x] 3.2 고비용 tree/list 및 비 UI package의 반복 작업을 측정하고 적절한 후보만 memoization·viewport·cache·Promise 병렬화로 개선한 뒤 결과를 남긴다
- [x] 3.3 barrel import와 heavy module을 측정하고 개선 효과가 확인된 경계만 변경한 뒤 build 영향 여부를 확인한다

## 4. 통합 검증 및 spec 마무리

- [x] 4.1 전체 workspace lint/typecheck, Storybook build와 390px 전체 story 렌더 검사를 통과한다
- [x] 4.2 OpenSpec strict validation을 통과하고 main spec을 sync한다
- [x] 4.3 모든 task를 완료 표시하고 archive 전 상태를 확인한다
