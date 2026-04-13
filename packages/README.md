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

## 브랜드 디자인시스템 적용 범위

- 직접 적용(완료): `@repo/ui`
  - 브랜드 스타일 토큰(색상/타이포/반경/그림자)과 컴포넌트 스타일을 직접 관리
- 연동 적용(완료): `@repo/configs`, `@repo/theme`
  - `@repo/configs`는 Tailwind/Global CSS 경로를 통해 UI 토큰을 앱에 주입
  - `@repo/theme`는 light/dark 테마 상태와 동기화 정책을 담당
  - 폰트는 `@repo/theme` 번들(`fonts.css`) 기준으로 주입하며, 앱별 `public/fonts` 복사 정책은 사용하지 않음
- 비시각 패키지(대상 아님, 구조 정리 완료): `@repo/react-query`, `@repo/forms`, `@repo/zustand`, `@repo/utils`, `@repo/eslint-config`
  - 데이터/상태/유틸/설정 패키지로, 시각 스타일 대신 API/구조 일관성이 적용 대상

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
- React Query 패키지: [`./react-query/README.md`](./react-query/README.md)
- Zustand 패키지: [`./zustand/README.md`](./zustand/README.md)
- Utils 패키지: [`./utils/README.md`](./utils/README.md)
- Forms 패키지: [`./forms/README.md`](./forms/README.md)
- Theme 패키지: [`./theme/README.md`](./theme/README.md)
- Configs 패키지: [`./configs/README.md`](./configs/README.md)
- ESLint Config 패키지: [`./eslint-config/README.md`](./eslint-config/README.md)
