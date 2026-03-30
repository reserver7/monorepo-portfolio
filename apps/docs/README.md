# Docs App

실시간 문서 협업 애플리케이션입니다.

## 역할
- Yjs 기반 문서 동기화
- 참여자 커서/접속 상태 공유
- 댓글 추가/수정/삭제
- 보기(`viewer`) / 편집(`editor`) 권한 분리

## 로컬 실행
```bash
pnpm --filter @repo/docs dev
```

- URL: <http://localhost:3000>

## 실제 도메인
- <https://monorepo-portfolio-docs.vercel.app>

## 주요 의존성
- `@repo/ui`
- `@repo/react-query`
- `@repo/forms`
- `@repo/theme`
- `@repo/utils`
- `@repo/zustand`
- `socket.io-client`
- `yjs`

## 자주 쓰는 명령
```bash
pnpm --filter @repo/docs dev
pnpm --filter @repo/docs build
pnpm --filter @repo/docs lint
pnpm --filter @repo/docs typecheck
```

## 관련 문서
- 루트 모노레포 가이드: [`../../README.md`](../../README.md)
- 서버 앱 문서: [`../server/README.md`](../server/README.md)
