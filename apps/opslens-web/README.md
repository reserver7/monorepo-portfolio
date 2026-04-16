# OpsLens Web App

운영 분석 대시보드 앱입니다.

## 역할

- 운영 현황 대시보드
- 로그 분석 요청/결과 조회
- 이슈 목록/상세/상태 관리
- QA 시나리오 조회
- 리포트/배포 영향 화면

## 실행

```bash
pnpm dev:opslens:web
pnpm --filter @repo/opslens-web lint
pnpm --filter @repo/opslens-web typecheck
```

- Local: <http://localhost:3002>
- Domain: 미배포

## 배포 단계별 실행 예시

### 로컬(Local)

```bash
pnpm dev:opslens:server
pnpm dev:opslens:web
```

### 스테이징(Staging)

```bash
pnpm --filter @repo/opslens-web build
pnpm --filter @repo/opslens-server build
pnpm --filter @repo/opslens-web start
```

- 스테이징에서는 `.env.local` 대신 스테이징 전용 환경변수 주입을 권장합니다.

### 운영(Production)

```bash
pnpm --filter @repo/opslens-web build
pnpm --filter @repo/opslens-server build
```

- Web: Vercel 배포
- Server: Render/Nest 런타임 배포
- 태그 기반 릴리스 시 CI/CD에서 위 빌드 단계를 동일하게 수행합니다.

## 구조

- `app/`: Next App Router 진입점/페이지
- `features/`: 도메인 화면/컴포넌트/상태관리
- `lib/config/env.ts`: 클라이언트 환경변수 단일 진입점
- `lib/navigation/routes.ts`: 사이드바 라우팅 단일 정의

## 의존성

- `@repo/ui`, `@repo/theme`, `@repo/forms`, `@repo/react-query`, `@repo/opslens`, `@repo/utils`, `@repo/zustand`, `recharts`

## 환경변수

- `NEXT_PUBLIC_APP_TITLE`
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_API_URL`

## 관련 문서

- API: [`../opslens-server/README.md`](../opslens-server/README.md)
- 루트: [`../../README.md`](../../README.md)
