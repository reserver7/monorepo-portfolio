## ADDED Requirements

### Requirement: Membership notifications

시스템은 계정이 확정된 멤버십 변경 이벤트를 대상 계정의 알림으로 저장하고, 대상 계정만 자신의 알림을 조회·읽음 처리할 수 있도록 SHALL 보장해야 합니다.

#### Scenario: Member receives a notification

- **WHEN** 멤버의 수락, 권한 변경, 소유권 이전, 제거 또는 탈퇴 이벤트가 성공한다
- **THEN** 관련 계정의 읽지 않은 알림이 생성된다

#### Scenario: Member reads notifications

- **WHEN** 로그인한 계정이 알림 목록을 조회한다
- **THEN** 자신의 알림만 최신순으로 반환된다

#### Scenario: Member marks notification as read

- **WHEN** 대상 계정이 알림을 읽음 처리한다
- **THEN** 해당 알림의 읽음 시각이 저장되고 읽지 않은 수에서 제외된다
