## ADDED Requirements

### Requirement: Member role management

작업 공간 소유자는 승인된 멤버의 역할을 `viewer` 또는 `editor`로 변경할 수 있어야 하며, 서버는 소유자가 아닌 요청을 SHALL 거부해야 합니다.

#### Scenario: Owner changes an accepted member role

- **WHEN** 소유자가 승인된 멤버의 역할 변경을 요청한다
- **THEN** 멤버 역할이 저장되고 이후 접근 판정에 반영된다

#### Scenario: Non-owner cannot change a member role

- **WHEN** 소유자가 아닌 계정이 역할 변경을 요청한다
- **THEN** 서버는 요청을 거부하고 멤버 역할을 변경하지 않는다

#### Scenario: Pending invitation role is unchanged by role management

- **WHEN** 대상 멤버가 아직 pending 초대 상태이다
- **THEN** 역할 변경 API는 승인된 멤버 관리 요청으로 처리하지 않고 거부한다
