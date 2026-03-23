# 실시간 협업 문서 + 화이트보드 모노레포

Turborepo + pnpm 기반으로 문서 협업(Next.js)과 화이트보드 협업(Next.js), 실시간 서버(Express + Socket.io)를 하나의 모노레포로 운영합니다.

## 앱 구성

- `apps/docs`: 문서 협업 앱 (`http://localhost:3000`)
- `apps/whiteboard`: 화이트보드 앱 (`http://localhost:3001`)
- `apps/server`: 실시간 API/Socket 서버 (`http://localhost:4000`)
- `packages/ui`: shadcn/ui 기반 공용 UI 컴포넌트
- `packages/shared-types`: 문서/화이트보드 공용 타입
- `packages/shared-client`: 문서/화이트보드 공용 클라이언트 유틸(env/time/storage/http/navigation/session-factory/event-log/role)
- `packages/eslint-config`: 공용 ESLint flat config
- `packages/prettier-config`: 공용 Prettier config
- `packages/tailwind-config`: 공용 Tailwind config 팩토리
- `packages/postcss-config`: 공용 PostCSS config

## 실서비스 URL

- Docs: [https://monorepo-portfolio-docs.vercel.app](https://monorepo-portfolio-docs.vercel.app)
- Whiteboard: [https://monorepo-portfolio-whiteboard.vercel.app](https://monorepo-portfolio-whiteboard.vercel.app)
- Server: [https://monorepo-portfolio-server.onrender.com](https://monorepo-portfolio-server.onrender.com)

## 핵심 기능

### 문서 협업

- Yjs 기반 CRDT 실시간 동기화
- 임시 세션 입장 (로그인 없이 협업)
- 보기/편집 권한 분리 (`viewer` / `editor`)
- 참여자 상태/커서 공유
- 댓글/멘션 추가 + 수정/삭제
- 자동 저장 + 변경 이력 관리

### 화이트보드 협업

- 도형 팔레트: `rect`, `ellipse`, `diamond`, `text`
- 캔버스 클릭으로 도형/텍스트 생성
- 도형 즉시 선택/이동 (별도 `select` 전환 없이 가능)
- 도형 크기 조절(리사이즈 핸들)
- 연결선 생성: 시작 도형 클릭 -> 대상 도형 클릭
- 연결선 끝점 드래그로 길이/연결 대상 조절
- 연결선 끝점 도형 중심 스냅
- 도형/텍스트/연결선 삭제
- Undo/Redo
- 참여자 커서 공유
- 보기/편집 권한 분리 (`viewer` / `editor`)
- 충돌 처리 전략: `last-write-wins` (화이트보드), Yjs CRDT(문서)

## TypeScript

- 서버-클라이언트 실시간 이벤트 계약을 `@repo/shared-types`로 통합
  - 이벤트명 상수(`socketEventName`) + payload 타입을 단일 소스로 관리
  - 문서/화이트보드 훅과 서버가 동일 타입 계약을 재사용
- REST 요청 본문 파싱을 서버 공통 헬퍼로 분리
  - `unknown` 입력을 안전하게 정규화해 ad-hoc 타입 단언 최소화
- 세션 로컬스토리지 접근을 `createSessionStorage` 팩토리로 공통화
  - docs/whiteboard는 키만 주입해 동일 인터페이스 재사용
- 클라이언트 이벤트 로그 포맷/누적 로직을 공용 유틸로 통합
  - `appendEventLog` 기반으로 스토어 중복 로직 제거
- 역할 문자열 파싱을 `coerceAccessRole`로 일원화
  - 셀렉트 입력값 처리 시 fallback 정책을 코드 전역에서 일관 유지

## 모노레포 구조

```text
.
├── apps
│   ├── docs
│   ├── whiteboard
│   └── server
├── packages
│   ├── eslint-config
│   ├── postcss-config
│   ├── prettier-config
│   ├── tailwind-config
│   ├── ui
│   ├── shared-types
│   └── shared-client
├── .env.example
├── eslint.config.mjs
├── .prettierrc.cjs
├── turbo.json
└── pnpm-workspace.yaml
```

## 공통 설정 재사용

- 루트 `eslint.config.mjs`는 `@repo/eslint-config`를 사용합니다.
- 각 Next 앱의 `eslint.config.mjs`는 `@repo/eslint-config/next`를 사용합니다.
- 루트 `.prettierrc.cjs`는 `@repo/prettier-config`를 사용합니다.
- 각 앱 `tailwind.config.ts`는 `@repo/tailwind-config`를 사용합니다.
- 각 앱 `postcss.config.mjs`는 `@repo/postcss-config`를 사용합니다.

즉, 앱별 설정 파일은 “얇은 wrapper”만 두고 실제 규칙/값은 workspace 패키지에서 중앙 관리합니다.

## 환경 변수 파일

실무에서 자주 쓰는 형태로 앱별 예시 파일을 분리해두었습니다.

- 루트: `.env.example`
- 서버: `apps/server/.env.example`
- 문서 앱: `apps/docs/.env.local.example`
- 화이트보드 앱: `apps/whiteboard/.env.local.example`

로컬 실행 전 아래처럼 복사해서 사용합니다.

```bash
cp .env.example .env
cp apps/server/.env.example apps/server/.env
cp apps/docs/.env.local.example apps/docs/.env.local
cp apps/whiteboard/.env.local.example apps/whiteboard/.env.local
```

배포(Vercel) 환경 변수 권장 값:

- Docs 프로젝트
  - `NEXT_PUBLIC_API_URL=https://monorepo-portfolio-server.onrender.com`
  - `NEXT_PUBLIC_WHITEBOARD_APP_URL=https://monorepo-portfolio-whiteboard.vercel.app`
- Whiteboard 프로젝트
  - `NEXT_PUBLIC_API_URL=https://monorepo-portfolio-server.onrender.com`
  - `NEXT_PUBLIC_DOCS_APP_URL=https://monorepo-portfolio-docs.vercel.app`

서버(`apps/server`) 운영 권장 값:

- `COLLAB_SESSION_SECRET`: production 필수 (세션 서명용)
- `CORS_ORIGINS`: production 필수 (명시적 허용 origin)
- `EDITOR_ACCESS_KEY`: 선택 (설정 시 editor 권한 승격 시 키 검증)
- `SOCKET_RATE_LIMIT_WINDOW_MS`, `SOCKET_WRITE_EVENTS_PER_WINDOW`, `SOCKET_CURSOR_EVENTS_PER_WINDOW`
- `MAX_YJS_UPDATE_BASE64_CHARS`, `MAX_SOCKET_JSON_CHARS`

## 로컬 실행

```bash
pnpm install
pnpm dev
```

- Docs: [http://localhost:3000](http://localhost:3000)
- Whiteboard: [http://localhost:3001](http://localhost:3001)
- Server: [http://localhost:4000](http://localhost:4000)

## 스크립트

```bash
pnpm dev
pnpm lint
pnpm lint:fix
pnpm test
pnpm test:e2e
pnpm format
pnpm format:check
pnpm typecheck
pnpm build
```

## 주요 Socket 이벤트

### 문서

- `document:join`
- `document:yjs:update`
- `document:comment:add`
- `document:comment:update`
- `document:comment:delete`
- `cursor:move`
- `document:save`

### 화이트보드

- `board:join`
- `board:title:update`
- `board:shape:add`
- `board:shape:update`
- `board:shape:remove`
- `board:cursor`
- `board:undo`
- `board:redo`

## CI/CD 구성 (Vercel + GitHub Actions)

- `CI`: `.github/workflows/ci.yml`
  - `PR(main/develop)`에서는 비용 최적화를 위해 `lint`, `typecheck`, `test`만 실행
  - `main` push에서는 `lint`, `typecheck`, `test`, `build`, `Playwright E2E`를 실행
  - E2E 실패 시 `playwright-report`, `test-results` 아티팩트를 업로드
  - 포트폴리오 환경(별도 개발 서버 없음) 기준으로 PR 검증과 운영 검증을 분리
  - 수동 실행(`workflow_dispatch`) 지원

- `CD`: `.github/workflows/cd-vercel.yml`
  - `v*` 태그 push 시 Docs/Whiteboard를 운영 배포
  - 릴리즈 태그 커밋이 `main` 이력에 포함되는지 검증 후 배포
  - 수동 실행(`workflow_dispatch`) 지원

- `CD(Server)`: `.github/workflows/cd-server-render.yml`
  - `v*` 태그 push 시 Render Deploy Hook 기반 서버 배포
  - 릴리즈 태그 커밋이 `main` 이력에 포함되는지 검증 후 배포
  - `RENDER_DEPLOY_HOOK_URL` 미설정 시 명시적 스킵 로그 출력
  - `SERVER_HEALTHCHECK_URL` 설정 시 배포 후 헬스체크까지 검증
  - 수동 실행(`workflow_dispatch`) 지원

- `apps/server`는 Socket.IO 기반 장기 연결이 핵심이라, 프론트와 분리된 서버 런타임에서 운영

필요 시크릿(Workflow 사용):

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID_DOCS`
- `VERCEL_PROJECT_ID_WHITEBOARD`
- `RENDER_DEPLOY_HOOK_URL` (서버 CD)
- `SERVER_HEALTHCHECK_URL` (선택, 서버 CD 헬스체크)
