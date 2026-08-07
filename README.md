# 실시간 협업 + OpsLens 모노레포

Turborepo + pnpm 기반 모노레포입니다.

## 앱

- `apps/collab-web` - 문서+화이트보드 통합 협업 (`http://localhost:3000`)
- `apps/collab-server` - 협업 API/소켓 서버 (`http://localhost:4000`)
- `apps/opslens-web` - 운영 대시보드 (`http://localhost:3002`)
- `apps/opslens-server` - 운영 GraphQL API (`http://localhost:4100/graphql`)
- `apps/storybook` - 디자인시스템 검증 (`http://localhost:6006`)

## 실제 도메인

- Collab Web: <https://monorepo-portfolio-collab-web.vercel.app>
- Server: <https://monorepo-portfolio-server.onrender.com>
- Storybook: <https://monorepo-portfolio-storybook.vercel.app>
- OpsLens Dashboard: 미배포
- OpsLens API: 미배포

## 공용 패키지

- `@repo/ui`: 디자인시스템 컴포넌트/토큰
- `@repo/theme`: 테마/프로바이더
- `@repo/react-query`: Query/HTTP 유틸
- `@repo/opslens`: OpsLens 도메인 API/타입/쿼리키
- `@repo/forms`: RHF 중심 폼 유틸
- `@repo/zustand`: 상태관리 유틸
- `@repo/utils`: 협업/공통 로직 유틸
- `@repo/configs`: Next/Tailwind/PostCSS/TS/ESLint 설정

## 시작

```bash
pnpm install
pnpm infra:up
pnpm dev:collab
pnpm dev:opslens
```

## 로컬 인프라

Redis와 PostgreSQL만 Docker Compose로 실행하며 웹·서버 앱은 기존처럼 호스트에서 실행합니다.

```bash
pnpm infra:up
pnpm infra:status
pnpm infra:logs
pnpm infra:down
```

기본 구성:

- PostgreSQL 16: `localhost:5433` (호스트 PostgreSQL과의 기본 포트 충돌 방지)
- Redis 7: `localhost:6379`
- OpsLens DB: `opslens`
- Collab DB: `collab`
- PostgreSQL과 Redis 데이터는 named volume에 보존

기본 연결값은 [`.env.infrastructure.example`](.env.infrastructure.example)에 있습니다. 포트나 로컬 비밀번호를 바꾸려면 이 파일을 `.env.infrastructure`로 복사한 뒤 다음처럼 실행할 수 있습니다.

```bash
docker compose --env-file .env.infrastructure -f compose.infrastructure.yml up -d --wait
```

앱 환경변수 예시:

```bash
# apps/opslens-server/.env
DATABASE_URL=postgresql://portfolio:portfolio-local-password@localhost:5433/opslens
DIRECT_DATABASE_URL=postgresql://portfolio:portfolio-local-password@localhost:5433/opslens

# apps/collab-server/.env
STATE_BACKEND=postgres
COLLAB_DATABASE_URL=postgresql://portfolio:portfolio-local-password@localhost:5433/collab
REDIS_URL=redis://localhost:6379
```

최초 OpsLens 스키마 적용:

```bash
pnpm db:opslens:migrate:deploy
pnpm db:opslens:seed
```

## OpsLens 로컬 확인

OpsLens는 운영 분석용 mock 데이터가 seed에 포함되어 있습니다.

```bash
pnpm db:opslens:migrate:deploy
pnpm db:opslens:generate
pnpm db:opslens:seed
pnpm dev:opslens
```

- Web: <http://localhost:3002>
- API: <http://localhost:4100/graphql>

### Mock 로그인 계정

| 역할     | 이메일                   | 비밀번호       | 용도                     |
| -------- | ------------------------ | -------------- | ------------------------ |
| Admin    | `admin@opslens.local`    | `opslens1234!` | 전체 화면/운영 설정 확인 |
| Operator | `operator@opslens.local` | `opslens1234!` | 운영자 권한 흐름 확인    |

### Mock 데이터 범위

- 대시보드: severity 분포, 24시간 에러 추이, 반복 이슈, 배포 이후 증가 이슈
- 로그: 분석 대상 로그 이벤트, 로그 분석 세션 이력
- 이슈: 우선순위, SLA, 에스컬레이션, 담당자, 코멘트, 배포 연관성
- 배포: 배포 상태, 담당자/승인자, 변경 범위, 체크리스트, 롤백 기준, 모니터링 윈도우
- QA: 생성 산출물, 담당자/검토자, 실행 상태
- 리포트: 운영 리포트 생성 결과와 저장 스냅샷
- 알림/설정: 운영 알림 mock, 알림 정책/리포트 스케줄/배포 가드레일 설정

## 신규 앱 생성

```bash
pnpm new:app
```

- `templates/next-app` 기반으로 `apps/<name>` 생성
- 루트 스크립트 자동 추가:
  - `dev:<name>`
  - `build:<name>`
  - `lint:<name>`
  - `typecheck:<name>`
- 생성 템플릿은 공통 설정/런타임(`@repo/configs`, `@repo/theme`, `@repo/react-query`)이 기본 연결됩니다.

## 자주 쓰는 명령

```bash
pnpm check
pnpm build
pnpm test:collab-server
pnpm test:e2e:smoke
pnpm dev:storybook
pnpm storybook:gen
pnpm storybook:check
pnpm storybook:watch
pnpm i18n:check
pnpm i18n:extract
pnpm i18n:extract:check
pnpm i18n:sync
pnpm i18n:sync:check
pnpm i18n:draft -- --provider=openai --source=ko --targets=en,ja
pnpm db:opslens:migrate:dev
pnpm db:opslens:seed
pnpm audit:workspace
```

## i18n 자동화

- 적용 범위: `apps/*/lib/i18n/messages/*.json` 이 있는 앱 전체 (`opslens-web`, `collab-web`).
- 기준 로케일: `ko.json` (기본 기준 파일).
- 키 추출 자동화:
  - `pnpm i18n:extract` : 코드(`useTranslations` + `t(...)`)에서 신규 키를 찾아 `ko.json`에 추가
  - `pnpm i18n:extract:check` : PR fail-fast (코드에 신규 키가 있는데 기준 로케일에 없으면 실패)
  - 주의: 템플릿 동적 키(`t(\`x.${value}\`)`)는 추출기가 정적으로 인식하지 못하므로, 화면 코드에서는 정적 키 매핑(`switch`/맵 객체)으로 호출해야 합니다.
- 누락 자동 채움:
  - `pnpm i18n:sync` : 기준 로케일(`ko`)에서 타 로케일로 누락 키 복제
  - `pnpm i18n:sync:check` : PR fail-fast
- 기계번역 초안 파이프라인:
  - `pnpm i18n:draft -- --provider=openai --source=ko --targets=en,ja`
  - `OPENAI_API_KEY`가 없으면 `__TODO_TRANSLATE__:*` 형태로 초안 플레이스홀더를 채워 후속 번역 큐로 사용

## 배포 기준

- Collab Web은 Vercel 프로젝트 1개로 운영합니다.
  - Project Name: `monorepo-portfolio-collab-web`
  - Root Directory: `apps/collab-web`
- OpsLens는 현재 운영 배포 도메인이 없습니다.
  - 로컬/개발 DB 확인 중심으로 운영합니다.
  - `opslens-v*` 태그 CD는 준비되어 있지만, Vercel/Render 대상과 secrets가 설정되지 않으면 배포를 건너뜁니다.
- 배포 시 필요한 GitHub Actions 시크릿:
  - `VERCEL_TOKEN`
  - `VERCEL_ORG_ID`
  - `VERCEL_PROJECT_ID_COLLAB_WEB`
  - `VERCEL_PROJECT_ID_OPSLENS_WEB` (OpsLens Web Vercel 배포용)
  - `VERCEL_PROJECT_ID_STORYBOOK` (Storybook Vercel 배포용)
  - `CHROMATIC_PROJECT_TOKEN` (Storybook 시각 회귀 검사용)
  - `OPSLENS_RENDER_DEPLOY_HOOK_URL` (OpsLens Server Render 배포용)
  - `OPSLENS_SERVER_HEALTHCHECK_URL` (OpsLens Server 배포 후 헬스체크용, 선택)
- 릴리스 배포:
  - `main` 머지 후 태그 규칙에 따라 CD 워크플로우가 실행됩니다.
    - `collab-v*`: Collab Web + Collab Server 배포
    - `sb-v*`: Storybook 배포
    - `opslens-v*`: OpsLens Web + OpsLens Server 배포 준비 확인, 배포 대상 설정 시 배포
  - CI는 PR(`main` 대상)과 수동 실행에서 동작합니다.

## 태그 배포

```bash
git tag -a collab-v0.2.x -m "release: collab web"
git push origin collab-v0.2.x

git tag -a sb-v0.2.x -m "release: storybook"
git push origin sb-v0.2.x

git tag -a opslens-v0.2.x -m "release: opslens"
git push origin opslens-v0.2.x
```

- 태그 접두사에 맞는 CD만 실행됩니다.
- 일반 개발 흐름: 기능 브랜치 → PR → Squash Merge(main) → 태그 생성/푸시

## 관련 문서

- 패키지 가이드: [`packages/README.md`](packages/README.md)
- 기여/구조 원칙: [`CONTRIBUTING.md`](CONTRIBUTING.md)
- 환경/배포 설정: [`docs/environment-deployment.md`](docs/environment-deployment.md)
