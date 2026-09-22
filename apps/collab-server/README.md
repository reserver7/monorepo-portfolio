# Collab Server App

문서/화이트보드 협업용 REST + Socket 서버입니다.

## 역할

- 문서/보드 목록/상세 API
- 실시간 동기화 소켓 이벤트
- 권한(`viewer`/`editor`) + 보호 키 검증
- OpsLens 계정별 문서·화이트보드 소유권
- 기본 로깅/관측
- 파일 또는 PostgreSQL 상태 영속화
- Redis 기반 Socket.IO 수평 확장

## 실행

```bash
pnpm --filter @repo/collab-server dev
pnpm --filter @repo/collab-server build
pnpm --filter @repo/collab-server lint
pnpm --filter @repo/collab-server typecheck
pnpm test:collab-server
```

- Local: <http://localhost:4000>
- Domain: <https://monorepo-portfolio-server.onrender.com>

## 영속화와 수평 확장

- 기본 로컬 모드는 `STATE_BACKEND=file`이며 기존 JSON 파일을 사용합니다.
- PostgreSQL은 `STATE_BACKEND=postgres`와 `COLLAB_DATABASE_URL`을 설정합니다.
- 운영 계정별 작업 공간은 `AUTH_BRIDGE_SECRET`을 OpsLens 서버의 `AUTH_BRIDGE_SECRET`과 동일하게 설정해야 합니다.
- 운영 Supabase 프로젝트는 `postgresql://postgres:<password>@db.<project-ref>.supabase.co:5432/postgres?sslmode=require` 형식의 direct connection을 사용합니다.
- 여러 서버 인스턴스의 Socket.IO 이벤트 공유는 `REDIS_URL`을 설정합니다.
- 로컬 PostgreSQL 초기 스키마는 `migrations/001_collab_workspace_state.sql`, Supabase 스키마는 루트 `supabase/migrations/`에 있습니다.
- 초대 이메일은 `RESEND_ENABLED=false`가 기본값이며, 활성화해도 월 3,000통으로 제한됩니다. `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `COLLAB_WEB_URL`을 함께 설정해야 발송됩니다.
- 기존 JSON 상태 이전: `pnpm --filter @repo/collab-server migrate:state:postgres`

## 의존성

- `@repo/utils`, `express`, `socket.io`, `yjs`

## 관련 문서

- Collab Web: [`../collab-web/README.md`](../collab-web/README.md)
