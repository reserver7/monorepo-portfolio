## Why

현재 pending 초대가 무기한 유지되어 오래된 링크가 계속 유효할 수 있습니다. 초대에 유효 기간을 두어 오래된 권한 요청을 자동으로 무효화합니다.

## What Changes

- pending 초대에 7일 만료 시각을 저장합니다.
- 만료된 초대의 접근과 수락을 차단합니다.
- pending 초대를 재전송하면 만료 시각을 7일 연장합니다.
- 공유 화면에 만료 상태를 표시합니다.

## Capabilities

### New Capabilities

- `invitation-expiration`: 작업 공간 초대의 만료와 재전송 연장

### Modified Capabilities

- 없음

## Impact

- Collab 멤버 타입, 저장소, 접근 판정, 초대 응답 API
- Collab 공유 패널
