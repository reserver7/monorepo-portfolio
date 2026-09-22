## ADDED Requirements

### Requirement: Comment mention notifications

댓글 작성자가 승인된 문서 멤버를 `@멘션`하면 해당 계정의 알림 센터에 알림을 생성해야 합니다. The implementation MUST not notify the author or unauthorized accounts.

#### Scenario: Mentioned member receives a notification

- **WHEN** 승인된 멤버의 이메일 local-part 또는 계정 ID와 일치하는 멘션이 포함된 댓글이 생성된다
- **THEN** 해당 멤버의 알림 센터에 문서와 댓글 위치를 가리키는 읽지 않은 알림이 표시된다

#### Scenario: Author and unmatched mentions are excluded

- **WHEN** 작성자 자신 또는 승인되지 않은 계정을 가리키는 멘션이 포함된다
- **THEN** 해당 계정에는 멘션 알림이 생성되지 않는다

#### Scenario: Realtime delivery

- **WHEN** 멘션 알림이 생성된다
- **THEN** 해당 계정의 연결된 알림 센터가 기존 실시간 알림 이벤트를 수신한다

#### Scenario: New mention added while editing

- **WHEN** 기존 댓글을 수정해 새로운 승인된 멤버를 처음 멘션한다
- **THEN** 새로 멘션된 멤버에게만 알림이 생성되고 기존 멘션 대상에게는 중복 알림이 생성되지 않는다

#### Scenario: Mention candidate matches an account

- **WHEN** 사용자가 댓글 입력창에서 멘션 후보를 확인한다
- **THEN** 승인된 문서 멤버의 계정 이메일 local-part가 후보로 표시되고 서버의 알림 대상과 일치한다

#### Scenario: Mention autocomplete inserts a candidate

- **WHEN** 사용자가 댓글 입력창에서 `@`와 멤버 이름 일부를 입력하고 후보를 선택한다
- **THEN** 선택한 계정 멘션이 현재 입력 위치에 삽입된다

#### Scenario: Mention autocomplete keyboard controls

- **WHEN** 자동완성 목록이 열린 상태에서 사용자가 방향키·Enter·Escape를 누른다
- **THEN** 후보를 이동·선택하거나 목록을 닫을 수 있다
