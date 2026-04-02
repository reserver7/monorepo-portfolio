# Whiteboard App

실시간 화이트보드 협업 애플리케이션입니다.

## 역할

- 도형 생성/이동/리사이즈/삭제
- 연결선 생성 및 편집
- Undo/Redo
- 참여자 커서 공유
- 보기(`viewer`) / 편집(`editor`) 권한 분리

## 로컬 실행

```bash
pnpm --filter @repo/whiteboard dev
```

- URL: <http://localhost:3001>

## 실제 도메인

- <https://monorepo-portfolio-whiteboard.vercel.app>

## 주요 의존성

- `@repo/ui`
- `@repo/react-query`
- `@repo/forms`
- `@repo/theme`
- `@repo/utils`
- `@repo/zustand`
- `socket.io-client`

## 자주 쓰는 명령

```bash
pnpm --filter @repo/whiteboard dev
pnpm --filter @repo/whiteboard build
pnpm --filter @repo/whiteboard lint
pnpm --filter @repo/whiteboard typecheck
```

## 관련 문서

- 루트 모노레포 가이드: [`../../README.md`](../../README.md)
- 서버 앱 문서: [`../server/README.md`](../server/README.md)
