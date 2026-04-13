# Collab Web App

문서와 화이트보드를 단일 도메인에서 제공하는 실시간 협업 앱입니다.

## 역할

- 문서/화이트보드 생성/입장/삭제
- Yjs 기반 동기화
- 댓글/변경 이력/이벤트 로그
- 권한(`viewer`/`editor`) + 보호 키 플로우

## 실행

```bash
pnpm --filter @repo/collab-web dev
pnpm --filter @repo/collab-web build
pnpm --filter @repo/collab-web lint
pnpm --filter @repo/collab-web typecheck
```

- Local: <http://localhost:3000>
- Domain: <https://monorepo-portfolio-collab-web.vercel.app>

## 의존성

- `@repo/ui`, `@repo/theme`, `@repo/forms`, `@repo/react-query`, `@repo/utils`, `@repo/zustand`

## 관련 문서

- 서버: [`../collab-server/README.md`](../collab-server/README.md)
- 루트: [`../../README.md`](../../README.md)
