# Collab Server App

문서/화이트보드 협업용 REST + Socket 서버입니다.

## 역할

- 문서/보드 목록/상세 API
- 실시간 동기화 소켓 이벤트
- 권한(`viewer`/`editor`) + 보호 키 검증
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
- 여러 서버 인스턴스의 Socket.IO 이벤트 공유는 `REDIS_URL`을 설정합니다.
- PostgreSQL 초기 스키마는 `migrations/001_collab_workspace_state.sql`에 있습니다.
- 기존 JSON 상태 이전: `pnpm --filter @repo/collab-server migrate:state:postgres`

## 의존성

- `@repo/utils`, `express`, `socket.io`, `yjs`

## 관련 문서

- Collab Web: [`../collab-web/README.md`](../collab-web/README.md)
