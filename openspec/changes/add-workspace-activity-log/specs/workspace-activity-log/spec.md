## ADDED Requirements

### Requirement: Workspace activity log

시스템은 멤버 초대, 재전송, 수락, 거절, 권한 변경, 제거 이벤트를 작업 공간별로 기록하고, 소유자에게만 최근 활동을 SHALL 반환해야 합니다.

#### Scenario: Membership event is recorded

- **WHEN** 멤버 관리 이벤트가 성공한다
- **THEN** 작업 공간 활동 로그에 대상 이메일, 이벤트 종류, 수행자, 시각이 추가된다

#### Scenario: Owner reads recent activity

- **WHEN** 소유자가 활동 로그를 요청한다
- **THEN** 최근 활동이 최신순으로 반환된다

#### Scenario: Non-owner cannot read activity

- **WHEN** 소유자가 아닌 사용자가 활동 로그를 요청한다
- **THEN** 서버는 요청을 거부한다
