## ADDED Requirements

### Requirement: Realtime notification center

로그인한 계정의 알림 센터는 새 멤버십 알림을 Socket.IO로 즉시 갱신해야 하며, 사용자는 자신의 읽지 않은 알림을 모두 읽음 처리할 수 있어야 합니다. The implementation MUST satisfy these behaviors.
서버는 유효한 realtime account token 없이 알림 room 구독을 허용해서는 안 됩니다.

#### Scenario: Notification badge updates in realtime

- **WHEN** 대상 계정의 멤버십 알림이 생성된다
- **THEN** 연결된 알림 센터가 목록과 읽지 않은 수를 갱신한다

#### Scenario: Mark all notifications as read

- **WHEN** 사용자가 모두 읽음을 선택한다
- **THEN** 자신의 읽지 않은 알림이 모두 읽음 상태가 된다

#### Scenario: Unauthenticated client cannot subscribe

- **WHEN** 유효하지 않은 계정 토큰으로 알림 채널을 구독한다
- **THEN** 서버는 구독을 거부한다
