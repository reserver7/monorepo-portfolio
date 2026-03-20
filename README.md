# 실시간 협업 문서 + 화이트보드 모노레포

Turborepo + pnpm 기반으로 문서 협업(Next.js)과 화이트보드 협업(Next.js), 실시간 서버(Express + Socket.io)를 하나의 모노레포로 운영합니다.

## 앱 구성

- `apps/docs`: 문서 협업 앱 (`http://localhost:3000`)
- `apps/whiteboard`: 화이트보드 앱 (`http://localhost:3001`)
- `apps/server`: 실시간 API/Socket 서버 (`http://localhost:4000`)
- `packages/ui`: shadcn/ui 기반 공용 UI 컴포넌트
- `packages/shared-types`: 문서/화이트보드 공용 타입
- `packages/shared-client`: 문서/화이트보드 공용 클라이언트 유틸(env/time/storage/http/navigation)
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
  - `main` push / PR 기준으로 `lint`, `typecheck`, `build`를 실행
  - 모노레포 전체 품질 게이트 역할

- `CD`: `.github/workflows/cd-vercel.yml`
  - `main` push 시 Vercel 배포를 자동 실행
  - `apps/docs`, `apps/whiteboard`를 각각 독립 프로젝트로 배포

- `CD(Server)`: `.github/workflows/cd-server-render.yml`
  - `main` push(서버 관련 변경) 시 Render Deploy Hook 기반 서버 배포
  - 선택적으로 서버 헬스체크 URL 검증까지 수행

- `apps/server`는 Socket.IO 기반 장기 연결이 핵심이라, 프론트와 분리된 서버 런타임에서 운영

필요 시크릿(Workflow 사용):

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID_DOCS`
- `VERCEL_PROJECT_ID_WHITEBOARD`
- `RENDER_DEPLOY_HOOK_URL` (서버 CD)
- `SERVER_HEALTHCHECK_URL` (선택, 서버 CD 헬스체크)
