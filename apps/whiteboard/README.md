# Whiteboard App

실시간 화이트보드 협업 앱입니다.

## 역할

- 보드 생성/입장/삭제
- 도형/연결선 편집
- Undo/Redo
- 참여자/변경 이력/이벤트 로그
- 권한(`viewer`/`editor`) + 보호 키 플로우

## 실행

```bash
pnpm --filter @repo/whiteboard dev
pnpm --filter @repo/whiteboard build
pnpm --filter @repo/whiteboard lint
pnpm --filter @repo/whiteboard typecheck
```

- Local: <http://localhost:3001>
- Domain: <https://monorepo-portfolio-whiteboard.vercel.app>

## 의존성

- `@repo/ui`, `@repo/theme`, `@repo/forms`, `@repo/react-query`, `@repo/utils`, `@repo/zustand`

## 관련 문서

- 서버: [`../server/README.md`](../server/README.md)
- 루트: [`../../README.md`](../../README.md)
