# @repo/opslens

OpsLens 도메인 공통 패키지입니다.

## 제공 기능

- OpsLens GraphQL API 호출 함수
- OpsLens 쿼리키(`opslensQueryKeys`)
- OpsLens 도메인 타입(`Issue`, `DashboardSummary`, `Deployment`, `OpsReport`, `OpsAlert` 등)
- 필터 변환 유틸(`toOptionalServiceName` 등)

## API 범위

- 인증: 로그인, 회원가입, 세션 갱신, 프로필/비밀번호/알림 정책
- 대시보드: 운영 summary, AI briefing
- 로그: 로그 분석, 분석 세션 조회
- 이슈: 목록/상세, 상태 변경, 담당자 지정, 코멘트
- 배포: 배포 등록, 배포 이력, 배포 영향 분석
- QA: QA 산출물 생성/조회/삭제
- 리포트: 구조화 리포트 생성, 리포트 스냅샷 조회
- 알림/설정: 운영 알림 조회/생성/읽음 처리, 운영 설정 조회/저장

## 사용법

```ts
import { configureOpslensClient, getDashboardSummary, opslensQueryKeys } from "@repo/opslens";

configureOpslensClient({ apiUrl: "https://api.example.com/graphql" });

const data = await getDashboardSummary({
  environment: "prod",
  serviceName: "docs",
  query: "timeout"
});
```

## 점검

```bash
pnpm --filter @repo/opslens lint
pnpm --filter @repo/opslens typecheck
```
