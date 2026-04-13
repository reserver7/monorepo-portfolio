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

## 브랜드 확장 규칙

- 기본 스타일 가이드에 없는 옵션(`ghost`, `filled` 등)도 삭제하지 않고 브랜드 톤으로 파생
- 파생 옵션도 공통 의미를 유지
- `ghost`: 최소 시각 노이즈 + 인터랙션에서만 강조
- `filled`: 표면 대비로 입력/선택 가능 영역 강조
- `outline`: 경계 강조, 배경은 최소화
- 옵션값이 잘못 들어오면 컴포넌트가 깨지지 않도록 기본값으로 자동 폴백
