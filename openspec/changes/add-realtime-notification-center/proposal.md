## Why

현재 알림 센터는 페이지 로드 시점에만 갱신되고 개별 알림만 읽음 처리할 수 있습니다.

## What Changes

- 계정별 Socket.IO 알림 채널로 새 알림을 즉시 반영합니다.
- 모든 알림을 한 번에 읽음 처리합니다.
- 알림 센터에 `모두 읽음` 동작을 추가합니다.

## Capabilities

### New Capabilities

- `realtime-notification-center`: 실시간 알림 갱신과 일괄 읽음 처리

## Impact

- Socket.IO 계정 알림 room과 멤버십 이벤트
- 알림 API와 웹 알림 센터
