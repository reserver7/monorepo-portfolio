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

## 운영 배포

Storybook은 아래 2가지 방식으로 함께 운영합니다.

1. Chromatic (시각 회귀 + PR 리뷰)
- 워크플로: `CI` 내 `Chromatic Visual Tests`
- 필요 시크릿: `CHROMATIC_PROJECT_TOKEN`

2. Vercel (운영 공유 URL)
- 워크플로: `CD - Storybook (Vercel Release Tag)`
- 트리거: `sb-v*` 태그 푸시 또는 수동 실행
- 필요 시크릿:
  - `VERCEL_TOKEN`
  - `VERCEL_ORG_ID`
  - `VERCEL_PROJECT_ID_STORYBOOK`
