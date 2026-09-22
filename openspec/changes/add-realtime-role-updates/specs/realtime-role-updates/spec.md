## ADDED Requirements

### Requirement: Realtime role updates

승인된 멤버의 역할이 변경되면 현재 연결된 해당 계정의 문서·화이트보드 세션은 새 역할을 즉시 반영해야 하며, 서버는 이후 쓰기 요청에 새 역할을 SHALL 적용해야 합니다.

#### Scenario: Demotion updates an active editor

- **WHEN** 소유자가 접속 중인 편집자의 역할을 viewer로 변경한다
- **THEN** 해당 세션은 즉시 viewer가 되고 편집 요청이 거부된다

#### Scenario: Promotion updates an active viewer

- **WHEN** 소유자가 접속 중인 viewer의 역할을 editor로 변경한다
- **THEN** 해당 세션은 즉시 editor 역할을 받는다

#### Scenario: Other sessions are unaffected

- **WHEN** 특정 멤버의 역할을 변경한다
- **THEN** 다른 멤버의 현재 역할은 변경되지 않는다
