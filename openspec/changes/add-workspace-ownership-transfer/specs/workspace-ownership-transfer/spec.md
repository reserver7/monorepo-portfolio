## ADDED Requirements

### Requirement: Workspace ownership transfer

소유자는 승인된 멤버에게 작업 공간 소유권을 이전할 수 있어야 하며, 기존 소유자는 editor 멤버로 전환되고 연결 세션은 SHALL 새 역할을 즉시 반영해야 합니다.

#### Scenario: Owner transfers ownership

- **WHEN** 소유자가 승인된 멤버를 대상으로 소유권 이전을 요청한다
- **THEN** 대상자가 owner가 되고 기존 소유자는 editor 멤버가 된다

#### Scenario: Pending member cannot receive ownership

- **WHEN** 소유자가 pending 멤버에게 소유권 이전을 요청한다
- **THEN** 서버는 요청을 거부하고 ownerId를 변경하지 않는다

#### Scenario: Transfer is logged

- **WHEN** 소유권 이전이 성공한다
- **THEN** 활동 로그에 소유권 이전 대상과 수행자가 기록된다
