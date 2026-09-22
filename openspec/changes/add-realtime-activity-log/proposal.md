## Why

공유 패널의 활동 로그는 처음 열거나 작업을 직접 수행할 때만 갱신됩니다. 다른 협업자의 멤버십 변경을 즉시 확인할 수 있어야 합니다.

## What Changes

- 문서·화이트보드 room에 활동 로그 갱신 이벤트를 추가합니다.
- 멤버십 변경 성공 시 해당 workspace room에 활동 이벤트를 전파합니다.
- 공유 패널이 현재 workspace room을 구독하고 활동 로그를 다시 조회합니다.

## Capabilities

### New Capabilities

- `realtime-activity-log`: 공유 패널의 실시간 활동 로그 갱신

## Impact

- Socket.IO 공용 이벤트 타입 및 협업 서버
- 공유 및 권한 패널
