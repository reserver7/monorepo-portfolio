## ADDED Requirements

### Requirement: Workspace member leave

승인된 멤버는 자신의 작업 공간 멤버십을 삭제할 수 있어야 하며, 소유자는 탈퇴할 수 없고 탈퇴한 멤버의 접근과 활성 세션은 SHALL 즉시 차단되어야 합니다.

#### Scenario: Accepted member leaves

- **WHEN** 승인된 멤버가 자신의 탈퇴를 요청한다
- **THEN** 멤버가 삭제되고 활동 로그에 탈퇴가 기록된다

#### Scenario: Owner cannot leave

- **WHEN** 소유자가 탈퇴를 요청한다
- **THEN** 서버는 요청을 거부하고 소유권을 유지한다

#### Scenario: Active session is revoked

- **WHEN** 접속 중인 멤버가 탈퇴한다
- **THEN** 해당 세션은 작업 공간에서 제거되고 더 이상 작업 요청을 수행할 수 없다
