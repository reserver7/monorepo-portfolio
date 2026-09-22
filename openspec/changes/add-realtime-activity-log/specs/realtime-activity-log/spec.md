## ADDED Requirements

### Requirement: Realtime activity log

공유 패널은 현재 문서 또는 화이트보드 room의 활동 변경을 실시간으로 반영해야 합니다. The implementation MUST preserve workspace access boundaries.

#### Scenario: Activity updates in the current workspace

- **WHEN** 현재 room에 연결된 협업자가 멤버십 변경을 완료한다
- **THEN** 공유 패널은 활동 조회 API를 다시 호출하고 최신 활동을 표시한다

#### Scenario: Activity updates stay within the workspace

- **WHEN** 다른 문서 또는 화이트보드의 멤버십 변경이 발생한다
- **THEN** 현재 패널은 활동 로그를 갱신하지 않는다
