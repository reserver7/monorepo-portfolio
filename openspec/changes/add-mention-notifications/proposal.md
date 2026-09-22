## Why

댓글의 `@멘션`은 현재 협업 화면의 토스트로만 안내되어, 나중에 접속한 사용자나 다른 화면에 있는 사용자에게 전달되지 않습니다.

## What Changes

- 댓글 멘션 대상 계정에 알림을 저장합니다.
- 기존 알림 센터와 실시간 알림 채널로 멘션을 전달합니다.
- 멘션 작성자 자신에게는 알림을 만들지 않습니다.

## Capabilities

### New Capabilities

- `mention-notifications`: 댓글 멘션 알림

## Impact

- 댓글 저장소와 문서 댓글 API/Socket.IO 경로
- 공용 알림 타입과 알림 센터
