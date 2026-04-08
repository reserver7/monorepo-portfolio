# Storybook App

`@repo/ui` 디자인시스템을 검증하는 중앙 Storybook 앱입니다.

## 실행

```bash
pnpm dev:storybook
pnpm build:storybook
```

또는

```bash
pnpm --filter @repo/storybook dev
pnpm --filter @repo/storybook build
```

## 구조

- Storybook 설정: `apps/storybook/.storybook`
- 스토리 소스: `packages/ui/stories`
- 컴포넌트 소스: `packages/ui/components`

## 자동화

```bash
pnpm storybook:gen
pnpm storybook:check
pnpm storybook:watch
```

- `storybook:gen`: 공개 컴포넌트 기준 generated 스토리 동기화
- `storybook:check`: 누락/불일치 검증
- `storybook:watch`: 컴포넌트 변경 시 generated 스토리 자동 갱신
