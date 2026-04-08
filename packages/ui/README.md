# @repo/ui

공통 디자인시스템 패키지입니다.

## 구성

- 컴포넌트: `packages/ui/components`
- 훅: `packages/ui/hooks`
- 스토리: `packages/ui/stories`
- 공개 API: `packages/ui/components/index.ts`, `packages/ui/index.ts`

## 주요 명령

```bash
pnpm --filter @repo/ui lint
pnpm --filter @repo/ui typecheck
pnpm storybook:gen
pnpm storybook:check
pnpm dev:storybook
pnpm build:storybook
```

## 원칙

- 앱에서는 컴포넌트 내부 경로가 아닌 `@repo/ui` 공개 API 사용
- 토큰 기반 스타일 사용
- 컴포넌트 변경 시 스토리 자동 동기화 후 검증
- generated 스토리는 수동 편집하지 않음
