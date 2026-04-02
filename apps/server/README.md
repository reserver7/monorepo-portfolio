# Server App

문서/화이트보드 협업을 위한 REST + Socket 서버입니다.

## 역할

- 문서/화이트보드 목록 및 상세 API 제공
- Socket 이벤트 기반 실시간 동기화
- 권한 모델(`viewer` / `editor`) 검증
- CORS/보안 설정과 기본 관측 로그 제공

## 로컬 실행

```bash
pnpm --filter @repo/server dev
```

- URL: <http://localhost:4000>

## 실제 도메인

- <https://monorepo-portfolio-server.onrender.com>

## 주요 의존성

- `@repo/utils`
- `express`
- `socket.io`
- `yjs`

## 자주 쓰는 명령

```bash
pnpm --filter @repo/server dev
pnpm --filter @repo/server build
pnpm --filter @repo/server lint
pnpm --filter @repo/server typecheck
pnpm test:server
```

## 관련 문서

- 루트 모노레포 가이드: [`../../README.md`](../../README.md)
- 문서 앱: [`../docs/README.md`](../docs/README.md)
- 화이트보드 앱: [`../whiteboard/README.md`](../whiteboard/README.md)
