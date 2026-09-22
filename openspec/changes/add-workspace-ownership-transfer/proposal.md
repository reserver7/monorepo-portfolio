## Why

현재 소유자는 작업 공간을 나갈 수 없어, 소유권을 넘기지 않는 한 참여를 종료할 수 없습니다.

## What Changes

- 소유자가 승인된 멤버에게 소유권을 이전합니다.
- 기존 소유자는 편집자로 전환되어 이후 작업 공간을 나갈 수 있습니다.
- 소유권 이전을 활동 로그와 연결 세션에 즉시 반영합니다.

## Capabilities

### New Capabilities

- `workspace-ownership-transfer`: 작업 공간 소유권 이전

## Impact

- 문서·화이트보드 ownerId와 멤버 저장소
- 소유자 전용 API와 공유 패널
- 활동 로그와 실시간 권한 이벤트
