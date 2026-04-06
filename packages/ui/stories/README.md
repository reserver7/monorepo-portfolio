# Storybook Structure

디자인시스템 스토리는 아래 3계층만 사용합니다.

## 1) Foundations

- 토큰(색상, 타이포그래피, spacing 등) 문서화

## 2) Components

- 재사용 가능한 단일 컴포넌트
- `generated`는 `packages/ui/components/index.ts` 기반 자동 생성 스토리(단일 소스)
  - 각 모듈의 대표 컴포넌트 1개만 자동 생성
  - 하위 조합(예: `*Trigger`, `*Content`, `*Header`)은 자동 대상에서 제외
  - 성격별 폴더로 분류(`actions`, `forms-primitives`, `overlays`, `feedback`, `data`, `navigation`, `layout`, `misc`)

## 3) Patterns

- 실제 화면에서 반복되는 조합 패턴
- 단일 컴포넌트 스펙이 아닌 "사용 방식" 검증용

## 규칙

- Story import는 내부 경로가 아니라 `@repo/ui` 공개 API(`index.ts`) 기준으로 작성
- 스토리는 컴포넌트 구현 디렉터리와 분리해 `stories/`에서만 관리
- 자동 생성/검증 명령
  - `pnpm storybook:gen`
  - `pnpm storybook:check`
