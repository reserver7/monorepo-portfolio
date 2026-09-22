## Why

현재 멤버 변경은 즉시 반영되지만 누가 언제 초대·수락·권한 변경·제거를 했는지 확인할 수 없습니다.

## What Changes

- 작업 공간 멤버 관리 이벤트를 저장합니다.
- 소유자만 최근 활동 로그를 조회할 수 있습니다.
- 공유 패널에 최근 멤버 활동을 표시합니다.

## Capabilities

### New Capabilities

- `workspace-activity-log`: 멤버 관리 활동 기록과 조회

## Impact

- 문서·화이트보드 저장 타입과 RealtimeStore
- 멤버 관리 HTTP API
- 공유 패널 UI와 테스트
