## Why

현재 승인된 멤버의 권한은 초대 시점에만 정할 수 있어, 작업 공간 소유자가 협업 중 권한을 조정할 수 없습니다.

## What Changes

- 소유자가 승인된 멤버의 보기·편집 권한을 변경할 수 있습니다.
- 문서와 화이트보드에 동일한 권한 변경 API를 제공합니다.
- 공유 패널에서 승인된 멤버의 권한을 선택할 수 있습니다.

## Capabilities

### New Capabilities

- `member-role-management`: 작업 공간 멤버 권한 변경

## Impact

- Collab 멤버 저장소와 HTTP 라우트
- Collab 공유 패널과 관련 테스트
