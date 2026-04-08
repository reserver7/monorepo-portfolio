# Docs App

실시간 문서 협업 앱입니다.

## 역할

- 문서 생성/입장/삭제
- Yjs 기반 동기화
- 댓글/변경 이력/이벤트 로그
- 권한(`viewer`/`editor`) + 보호 키 플로우

## 실행

```bash
pnpm --filter @repo/docs dev
pnpm --filter @repo/docs build
pnpm --filter @repo/docs lint
pnpm --filter @repo/docs typecheck
```

- Local: <http://localhost:3000>
- Domain: <https://monorepo-portfolio-docs.vercel.app>

## 의존성

- `@repo/ui`, `@repo/theme`, `@repo/forms`, `@repo/react-query`, `@repo/utils`, `@repo/zustand`

## 관련 문서

- 서버: [`../server/README.md`](../server/README.md)
- 루트: [`../../README.md`](../../README.md)
