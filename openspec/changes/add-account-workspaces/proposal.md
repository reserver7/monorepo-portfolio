## Why

현재 Collab의 문서와 화이트보드는 하나의 공용 상태로 관리되어 로그인한 계정과 작업 데이터의 관계가 없습니다. OpsLens 인증이 연결된 지금 계정별 작업 공간을 제공해야 사용자가 자신의 작업을 찾고 관리할 수 있습니다.

## What Changes

- 로그인 계정을 문서와 화이트보드의 소유자로 저장합니다.
- Collab 홈에서 현재 계정의 문서와 화이트보드만 조회합니다.
- 현재 계정이 문서와 화이트보드를 생성하고 삭제할 수 있게 합니다.
- 기존 데이터는 시스템 소유 데이터로 보존하여 기존 상태와 호환합니다.
- 소유권이 필요한 목록·생성·삭제 요청은 서버에서 OpsLens 서명 세션을 검증합니다.

## Capabilities

### New Capabilities

- `account-workspaces`: 계정별 문서·화이트보드 소유권과 작업 공간 CRUD 동작

### Modified Capabilities

- 없음

## Impact

- `apps/collab-server`: 인증된 계정 식별, 소유권 필터링, 생성·삭제 권한, 상태 저장 형식
- `apps/collab-web`: 계정별 목록 화면과 서버 프록시 API
- `packages/utils`: 문서·화이트보드 요약/레코드 소유자 필드
- `supabase`: 기존 JSONB 작업 공간 상태에 소유자 식별자 저장
- 기존 보호 키 기반 실시간 편집과 방 접근 흐름은 유지합니다.
