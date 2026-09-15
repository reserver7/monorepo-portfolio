## 1. Public API 및 사용처 정리

- [x] 1.1 `StatCard`, `StateView`, `Spinner`, `Segmented`의 모든 export와 직접 사용처를 검색해 migration 목록을 만들고 누락 0건을 typecheck로 확인한다
- [x] 1.2 제품 화면의 삭제 대상 사용처를 `Card`/`Statistic`, `Empty`/`Alert`/`Result`, `Spin`, `Tabs` 또는 로컬 Button group 조합으로 치환하고 전체 workspace typecheck를 통과한다
- [x] 1.3 삭제 대상 component 디렉터리와 public type/export를 제거하고 삭제된 symbol 검색 결과가 0건인지 확인한다

## 2. 역할 경계 및 문서 정리

- [x] 2.1 `Sheet`/`Drawer`, `Table`/`DataTable`/`List`, `Input` 확장 계열의 역할·선택 기준을 public docs와 props matrix에 반영하고 중복 prop 목록을 제거한다
- [x] 2.2 `Tabs`를 유일한 공용 navigation selection component로 정리하고 관련 타입·manifest·사용 예시를 검증한다
- [x] 2.3 `Spin`을 유일한 공용 loading indicator로 정리하고 `Spinner` alias와 import를 제거한 뒤 UI lint/typecheck를 통과한다

## 3. Storybook 및 생성물 동기화

- [x] 3.1 manifest에서 삭제 대상을 제거하고 generated Storybook을 전체 재생성한다
- [x] 3.2 public export ↔ manifest ↔ generated story drift check를 실행해 stale entry와 중복 0건을 확인한다
- [x] 3.3 삭제된 component story와 문서가 노출되지 않고 남은 Tabs/Spin 대체 story가 discoverable한지 Storybook check로 확인한다

## 4. 통합 검증 및 spec 마무리

- [x] 4.1 전체 workspace lint/typecheck와 390px Storybook 렌더 검사를 실행해 실패 0건을 확인한다
- [x] 4.2 OpenSpec strict validation을 통과하고 변경된 main spec을 sync한다
- [x] 4.3 모든 task를 완료 표시하고 archive 전 상태 및 migration 결과를 기록한다
