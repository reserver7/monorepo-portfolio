# Collab Server App

문서/화이트보드 협업용 REST + Socket 서버입니다.

## 역할

- 문서/보드 목록/상세 API
- 실시간 동기화 소켓 이벤트
- 권한(`viewer`/`editor`) + 보호 키 검증
- 기본 로깅/관측

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

## 의존성

- `@repo/utils`, `express`, `socket.io`, `yjs`

## 관련 문서

- Collab Web: [`../collab-web/README.md`](../collab-web/README.md)
