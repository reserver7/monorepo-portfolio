# OpsLens Web App

운영 분석 대시보드 앱입니다.

## 역할

- 운영 현황 대시보드
- 로그 분석 요청/결과 조회
- 이슈 목록/상세/상태 관리
- 배포 등록/영향 분석/배포 후 에러 확인
- QA 산출물 생성/조회/삭제
- 운영 리포트 생성/공유용 요약 확인
- 운영 알림/필터/설정 관리

## 실행

```bash
pnpm db:opslens:generate
pnpm dev:opslens:web
pnpm --filter @repo/opslens-web lint
pnpm --filter @repo/opslens-web typecheck
```

- Local: <http://localhost:3002>
- Domain: 미배포

## 배포 단계별 실행 예시

### 로컬(Local)

```bash
pnpm db:opslens:migrate:deploy
pnpm db:opslens:seed
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
- `features/<domain>/screens`: 페이지 단위 화면 조립
- `features/<domain>/components`: 도메인 전용 UI 조각
- `features/<domain>/hooks`: 화면/도메인 상태와 mutation/query 조합
- `features/<domain>/utils`: 표시 포맷, 필터, 계산 유틸
- `features/<domain>/types`: 화면 전용 타입
- `features/common`: OpsLens 공통 컴포넌트/스토어/훅/유틸
- `lib/config/env.ts`: 클라이언트 환경변수 단일 진입점
- `lib/navigation/routes.ts`: 사이드바 라우팅 단일 정의

## 의존성

- `@repo/ui`, `@repo/theme`, `@repo/forms`, `@repo/react-query`, `@repo/opslens`, `@repo/utils`, `@repo/zustand`, `recharts`

## 환경변수

- `NEXT_PUBLIC_APP_TITLE`
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_API_URL`
- `AUTH_SECRET` (Auth.js 세션 서명용)
- `AUTH_GOOGLE_CLIENT_ID`
- `AUTH_GOOGLE_CLIENT_SECRET`
- `AUTH_GITHUB_CLIENT_ID`
- `AUTH_GITHUB_CLIENT_SECRET`
- `OPSLENS_AUTH_BRIDGE_SECRET` (서버 `AUTH_BRIDGE_SECRET`과 동일해야 함)

## 로그인(로컬 시드 기준)

| 역할 | 이메일 | 비밀번호 | 확인 용도 |
| --- | --- | --- | --- |
| Admin | `admin@opslens.local` | `opslens1234!` | 전체 mock 데이터와 운영 설정 확인 |
| Operator | `operator@opslens.local` | `opslens1234!` | 운영자 권한 UI 확인 |

로그인이 되려면 `opslens-server`가 `http://localhost:4100`에서 먼저 실행 중이어야 합니다.

## Mock 데이터 확인 범위

- 대시보드: 주요 KPI, severity 분포, 추이, 반복 이슈
- 로그: 로그 분석 결과와 분석 세션 이력
- 이슈: priority, SLA, escalation, 담당자, 코멘트, 배포 연관 정보
- 배포: 등록 폼, 변경 범위, 체크리스트, 롤백 기준, 영향 분석
- QA: 생성 케이스, 리스크, 회귀 대상, 담당자/검토자/실행 상태
- 리포트: KPI, 액션 아이템, 우선 이슈, 공유 텍스트, 저장 스냅샷
- 알림/설정: 운영 알림, 읽음 처리, 알림 정책/리포트 스케줄/배포 가드레일

## i18n 키 규칙

- `pnpm i18n:extract:check`를 통과하려면 UI 코드의 번역 키는 정적으로 분석 가능해야 합니다.
- `t(\`dashboard.issueKeys.${titleKey}\`)` 형태 대신, `titleKey`를 정적 키로 매핑(`switch`/객체)해서 호출해야 합니다.

## 관련 문서

- API: [`../opslens-server/README.md`](../opslens-server/README.md)
- 루트: [`../../README.md`](../../README.md)
