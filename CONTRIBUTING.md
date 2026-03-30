# CONTRIBUTING

## 목적
이 저장소는 모노레포 구조를 사용합니다.  
코드 일관성과 유지보수를 위해 폴더 계층, 네이밍, import/export 규칙을 고정합니다.

## 기본 원칙
1. 카테고리 우선: 기능보다 계층(components/hooks/stores/lib/modules) 기준으로 먼저 나눈다.
2. Barrel 우선: 디렉터리 공개 API는 `index.ts`로 노출한다.
3. 공통 우선: 2개 이상 앱에서 쓰는 UI/유틸/타입은 `packages/*`로 이동한다.
4. 앱 특화 분리: 도메인 조합 UI는 각 앱 내부(`apps/<app>/components/<domain>`)에 둔다.
5. 깊은 경로 금지: 같은 계층 내부를 제외하고 파일 직접 경로 import를 최소화한다.

## 모노레포 계층 규칙

### Frontend 앱 (`apps/docs`, `apps/whiteboard`, `apps/opslens-dashboard`)
- `components/<category>`: 화면/표현 레이어
- `hooks/<category>`: UI/상태 훅
- `stores/<category>`: 전역 상태(zustand)
- `lib/<category>`: 비즈니스/통신/환경

권장 카테고리:
- `components`: `layout`, `theme`, `panels`, `<domain>`
- `hooks`: `collaboration`, `realtime`, `<domain>`
- `stores`: `<domain>`
- `lib`: `config`, `http`, `navigation`, `collab`, `utils`

### Backend 앱 (`apps/server`, `apps/opslens-api`)
- 공통 코드: `common/<category>`
- 도메인 코드: `modules/<domain>`
- 도메인/공통 하위는 `index.ts`로 공개 API 제공

### 공통 패키지 (`packages/*`)
- `packages/ui`
  - `components/form|layout|table|unit|overlay|feedback|shadcn`
  - `hooks/form|layout|table|unit|overlay|feedback`
- `packages/icons`
  - 아이콘 공급 레이어 (기본 아이콘셋 직접 import 금지, `@repo/icons` 경유)
- `packages/react-query`
  - QueryClient 기본 정책 + axios 기반 HTTP/GraphQL 공용 클라이언트
- `packages/utils`
  - `collab` 하위에 `types|config|navigation|collab|storage|time`

## 네이밍 규칙
1. 폴더/파일: `kebab-case`
2. React 컴포넌트 식별자: `PascalCase`
3. 훅 파일: `use-*.ts(x)`
4. Barrel 파일: `index.ts`

## Import 규칙
1. 앱 내부 import는 alias 사용:
   - `@/components/...`
   - `@/hooks/...`
   - `@/stores/...`
   - `@/lib/...`
2. 패키지 사용은 공개 엔트리 우선:
   - `@repo/ui`
   - `@repo/icons`
   - `@repo/react-query`
   - `@repo/utils`
   - `@repo/utils/collab`
3. 금지:
   - 앱 간 직접 import (`apps/a`에서 `apps/b` 파일 직접 import)
   - 패키지 내부 깊은 경로 import (`@repo/ui/components/...`)
4. 같은 카테고리에서 재사용되는 항목은 상위 카테고리 barrel로 재노출한다.
5. 네트워크 호출/서버 상태는 `@repo/react-query`를 우선 사용하고, 협업 공통 유틸/타입은 `@repo/utils/collab`로 통합한다.

## UI 컴포넌트 추가 규칙
1. 기본 컴포넌트(입력/선택/테이블/레이아웃)는 `packages/ui`에 추가
2. 도메인 조합 컴포넌트는 앱 내부에 추가
3. 컴포넌트 추가 시:
   - 해당 카테고리 `index.ts` export
   - 루트 `components/index.ts` export
   - 필요 시 hooks 카테고리도 동일하게 정리

## 리팩토링 체크리스트
1. 폴더 이동 후 깨진 import를 먼저 수정
2. 모든 신규/변경 디렉터리에 `index.ts` 배치
3. 아래 명령으로 검증
   - `pnpm --filter @repo/ui typecheck && pnpm --filter @repo/ui lint`
   - `pnpm --filter @repo/icons typecheck && pnpm --filter @repo/icons lint`
   - `pnpm --filter @repo/react-query typecheck && pnpm --filter @repo/react-query lint`
   - `pnpm --filter @repo/utils typecheck && pnpm --filter @repo/utils lint`
   - `pnpm --filter @repo/docs typecheck && pnpm --filter @repo/docs lint`
   - `pnpm --filter @repo/whiteboard typecheck && pnpm --filter @repo/whiteboard lint`
   - `pnpm --filter @repo/opslens-dashboard typecheck && pnpm --filter @repo/opslens-dashboard lint`
   - `pnpm --filter @repo/opslens-api typecheck && pnpm --filter @repo/opslens-api lint`
   - `pnpm --filter @repo/server typecheck && pnpm --filter @repo/server lint`

## 커밋/PR 규칙
1. 브랜치: 영어
2. 커밋 타입: `feat:`, `fix:`, `chore:`, `refactor:`
3. 커밋 설명: 한국어
4. PR 본문은 변경사항/검증을 구분해서 작성
