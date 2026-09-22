## Why

현재 소유자는 pending 초대를 잘못 보냈을 때 취소하거나 같은 초대 이메일을 다시 보낼 수 없습니다. 공유 패널에서 pending 초대를 관리할 수 있도록 합니다.

## What Changes

- pending 초대에 재전송 동작을 추가합니다.
- pending 초대에 취소 동작을 추가합니다.
- accepted 멤버 제거 동작은 기존처럼 유지합니다.

## Capabilities

### New Capabilities

- `invitation-management`: pending 초대 재전송과 취소

### Modified Capabilities

- 없음

## Impact

- Collab web 공유 패널
- 기존 멤버 POST/DELETE API 재사용
