## Context

공유 패널은 이미 멤버 목록을 불러오고 POST로 초대하며 DELETE로 멤버를 제거합니다. 서버의 pending upsert는 초대 이메일 발송을 다시 수행하므로 별도 API나 저장 모델을 추가하지 않습니다.

## Goals / Non-Goals

**Goals:**

- pending 초대에 재전송과 취소를 명확히 제공한다.
- accepted 멤버의 기존 제거 흐름을 보존한다.

**Non-Goals:**

- 재전송 횟수 제한이나 만료 정책은 포함하지 않는다.

## Decisions

- pending 재전송은 기존 POST endpoint를 같은 이메일·역할로 호출한다.
- pending 취소는 기존 DELETE endpoint를 호출한다.
- UI에서 상태별 버튼을 분기해 accepted 멤버의 동작을 변경하지 않는다.

## Risks / Trade-offs

- 재전송 횟수 제한이 없으므로 무료 이메일 한도는 기존 발송 가드가 보호한다.
