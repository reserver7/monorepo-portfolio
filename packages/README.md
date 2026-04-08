# Packages Guide

공용 재사용 코드(`@repo/*`)를 관리합니다.

## 목적

- 앱 간 중복 제거
- 디자인/상태/데이터 처리 일관성 확보
- 앱에서는 공개 API만 사용

## 주요 패키지

- `@repo/ui`
- `@repo/theme`
- `@repo/react-query`
- `@repo/forms`
- `@repo/zustand`
- `@repo/utils`
- `@repo/configs`

## 점검 명령

```bash
pnpm --filter @repo/ui lint
pnpm --filter @repo/ui typecheck
pnpm --filter @repo/react-query lint
pnpm --filter @repo/react-query typecheck
pnpm --filter @repo/utils lint
pnpm --filter @repo/utils typecheck
```

## 관련 문서

- 루트 가이드: [`../README.md`](../README.md)
- UI 패키지: [`./ui/README.md`](./ui/README.md)
