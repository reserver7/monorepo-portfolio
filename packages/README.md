# Packages Guide

공용 재사용 코드(설정/디자인/유틸)를 관리합니다.

## 역할
- 여러 앱에서 공통 사용하는 코드를 단일 소스로 관리
- 앱 간 중복/편차를 줄이고 유지보수 비용 절감
- `@repo/*` 공개 API 중심으로 의존성 단순화

## 로컬 실행
```bash
# 개별 패키지 개발/점검
pnpm --filter @repo/ui lint
pnpm --filter @repo/ui typecheck
```

## 주요 의존성
- `@repo/configs`
- `@repo/eslint-config`
- `@repo/ui`
- `@repo/theme`
- `@repo/react-query`
- `@repo/forms`
- `@repo/zustand`
- `@repo/utils`

## 자주 쓰는 명령
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
- 구조/계층 규칙: [`../CONTRIBUTING.md`](../CONTRIBUTING.md)
