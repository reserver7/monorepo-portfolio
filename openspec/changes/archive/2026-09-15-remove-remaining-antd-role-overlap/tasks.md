## 1. Public 역할 및 사용처 정리

- [x] 1.1 `Table`, `Sheet`, `AlertConfirm`, `Toast`의 export와 모든 사용처를 검색하고 migration 목록을 작성해 누락 0건을 확인한다
- [x] 1.2 제품 사용처를 `DataTable`, `Drawer`, `Modal`/`Popconfirm`, `message`/`notification`으로 치환하고 workspace typecheck를 통과한다
- [x] 1.3 internal primitive의 public barrel export와 package-level type export를 제거하고 직접 import 검색 결과가 0건인지 확인한다

## 2. 구현 경계 및 문서 동기화

- [x] 2.1 `Table`은 DataTable 내부 markup primitive로, `Sheet`는 Drawer 내부 primitive로 제한하고 UI lint를 통과한다
- [x] 2.2 `AlertConfirm` 확인 흐름과 `Toast` host를 private 구현으로 이동하고 Modal/Popconfirm 및 message/notification 동작 검사를 통과한다
- [x] 2.3 AntD 기준 역할 경계와 대체 API를 props matrix 및 public 문서에 반영하고 문서 생성 명령을 통과한다

## 3. Storybook 및 manifest 정리

- [x] 3.1 manifest에서 internal-only component를 제거하고 전체 Storybook을 재생성한다
- [x] 3.2 public export·manifest·generated story drift check를 통과하고 internal story가 생성되지 않음을 확인한다
- [x] 3.3 남은 public component의 Controls/interaction story discoverability를 확인한다

## 4. 통합 검증 및 spec 마무리

- [x] 4.1 전체 workspace lint/typecheck, Storybook build와 390px 렌더 검사를 실행해 실패 0건을 확인한다
- [x] 4.2 OpenSpec strict validation을 통과하고 main spec을 sync한다
- [x] 4.3 모든 task를 완료 표시하고 archive 전 상태를 확인한다
