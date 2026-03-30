import "dotenv/config";
import {
  IssueSeverity,
  IssueStatus,
  LogSource,
  OpsEnvironment,
  PrismaClient
} from "@prisma/client";

const prisma = new PrismaClient();

const hoursAgo = (hours: number): Date => new Date(Date.now() - hours * 60 * 60 * 1000);
const minutesAgo = (minutes: number): Date => new Date(Date.now() - minutes * 60 * 1000);

async function main(): Promise<void> {
  console.log("[seed] OpsLens 샘플 데이터 입력 시작");

  await prisma.$transaction([
    prisma.issueComment.deleteMany(),
    prisma.logEvent.deleteMany(),
    prisma.qaScenario.deleteMany(),
    prisma.issue.deleteMany(),
    prisma.deployment.deleteMany()
  ]);

  await prisma.deployment.createMany({
    data: [
      {
        id: "dep-prod-2026-03-26",
        version: "2026.03.26-1",
        environment: OpsEnvironment.prod,
        changelog: "결제 모듈 리팩토링 + 주문 API 응답 필드 변경",
        deployedAt: hoursAgo(10),
        updatedAt: new Date()
      },
      {
        id: "dep-stage-2026-03-25",
        version: "2026.03.25-2",
        environment: OpsEnvironment.stage,
        changelog: "로그 수집 파이프라인 개선",
        deployedAt: hoursAgo(30),
        updatedAt: new Date()
      },
      {
        id: "dep-prod-2026-03-24",
        version: "2026.03.24-3",
        environment: OpsEnvironment.prod,
        changelog: "에러 핸들러 공통화",
        deployedAt: hoursAgo(55),
        updatedAt: new Date()
      }
    ]
  });

  await prisma.issue.createMany({
    data: [
      {
        id: "iss-pay-001",
        title: "결제 승인 단계 TypeError",
        signature: "TypeError:Cannot read properties of undefined@checkout-confirm",
        severity: IssueSeverity.critical,
        status: IssueStatus.in_progress,
        summary: "결제 승인 시 일부 사용자에서 런타임 오류가 발생합니다.",
        probableCauses: ["신규 응답 스키마에서 totalDiscount 필드 누락 가능성", "null-safe 처리 누락"],
        suggestedActions: ["결제 API 응답 스키마 확인", "프론트 null-safe 방어코드 추가", "배포 전후 응답 비교"],
        reproductionGuide: "1) 장바구니에서 결제 진행 2) 쿠폰 적용 3) 결제 승인 버튼 클릭",
        assignee: "FE-정우석",
        serviceName: "payments-web",
        environment: OpsEnvironment.prod,
        occurrenceCount: 134,
        firstOccurredAt: hoursAgo(9),
        lastOccurredAt: minutesAgo(3),
        affectedArea: "checkout",
        deploymentCorrelation: "높음",
        deploymentId: "dep-prod-2026-03-26",
        createdAt: hoursAgo(9),
        updatedAt: new Date()
      },
      {
        id: "iss-auth-001",
        title: "로그인 세션 만료 오탐",
        signature: "AuthSessionExpired@token-refresh",
        severity: IssueSeverity.high,
        status: IssueStatus.analyzing,
        summary: "정상 세션 사용자가 간헐적으로 로그인 페이지로 이동됩니다.",
        probableCauses: ["토큰 갱신 레이스 컨디션", "쿠키 만료시간 파싱 이슈"],
        suggestedActions: ["refresh API 재시도 정책 점검", "쿠키 만료 계산 로직 점검"],
        reproductionGuide: "1) 장시간 탭 유지 2) API 요청 재개 시 강제 로그아웃 발생 확인",
        assignee: "BE-정우석",
        serviceName: "auth-gateway",
        environment: OpsEnvironment.prod,
        occurrenceCount: 57,
        firstOccurredAt: hoursAgo(18),
        lastOccurredAt: minutesAgo(14),
        affectedArea: "auth",
        deploymentCorrelation: "중간",
        deploymentId: "dep-prod-2026-03-24",
        createdAt: hoursAgo(18),
        updatedAt: new Date()
      },
      {
        id: "iss-api-001",
        title: "주문 상세 API 500",
        signature: "Http500:/api/orders/{id}",
        severity: IssueSeverity.high,
        status: IssueStatus.new,
        summary: "주문 상세 조회 시 특정 주문번호에서 500이 발생합니다.",
        probableCauses: ["N+1 쿼리 급증", "잘못된 조인 조건"],
        suggestedActions: ["문제 주문 데이터 추적", "쿼리 플랜 확인", "핫픽스 롤백 기준 준비"],
        reproductionGuide: "1) 주문 상세 페이지 진입 2) 특정 주문번호 조회",
        assignee: null,
        serviceName: "orders-api",
        environment: OpsEnvironment.prod,
        occurrenceCount: 32,
        firstOccurredAt: hoursAgo(7),
        lastOccurredAt: minutesAgo(21),
        affectedArea: "order-detail",
        deploymentCorrelation: "높음",
        deploymentId: "dep-prod-2026-03-26",
        createdAt: hoursAgo(7),
        updatedAt: new Date()
      },
      {
        id: "iss-web-001",
        title: "대시보드 렌더링 지연",
        signature: "SlowRender:dashboard-main",
        severity: IssueSeverity.medium,
        status: IssueStatus.in_progress,
        summary: "대시보드 첫 진입 시간이 증가했습니다.",
        probableCauses: ["초기 번들 증가", "차트 데이터 동시 요청 과다"],
        suggestedActions: ["차트 lazy 로딩", "React Query staleTime 조정"],
        reproductionGuide: "1) 관리자 대시보드 첫 진입 2) LCP 시간 확인",
        assignee: "FE-정우석",
        serviceName: "ops-dashboard",
        environment: OpsEnvironment.prod,
        occurrenceCount: 21,
        firstOccurredAt: hoursAgo(24),
        lastOccurredAt: minutesAgo(40),
        affectedArea: "dashboard",
        deploymentCorrelation: "낮음",
        deploymentId: "dep-prod-2026-03-24",
        createdAt: hoursAgo(24),
        updatedAt: new Date()
      },
      {
        id: "iss-qa-001",
        title: "QA 회귀: 할인금액 표시 누락",
        signature: "QA:discount-label-missing",
        severity: IssueSeverity.medium,
        status: IssueStatus.resolved,
        summary: "주문 상세 페이지 할인금액 UI가 누락된 회귀 이슈입니다.",
        probableCauses: ["조건부 렌더링 분기 누락"],
        suggestedActions: ["회귀 테스트 케이스 추가", "배포 체크리스트 강화"],
        reproductionGuide: "1) 할인 적용 주문 상세 확인 2) 할인금액 라벨 노출 여부 확인",
        assignee: "BE-정우석",
        serviceName: "orders-web",
        environment: OpsEnvironment.stage,
        occurrenceCount: 12,
        firstOccurredAt: hoursAgo(48),
        lastOccurredAt: hoursAgo(24),
        affectedArea: "order-detail",
        deploymentCorrelation: "중간",
        deploymentId: "dep-stage-2026-03-25",
        createdAt: hoursAgo(48),
        updatedAt: new Date()
      }
    ]
  });

  const paymentLogs = Array.from({ length: 18 }).map((_, index) => ({
    id: `log-pay-${index + 1}`,
    issueId: "iss-pay-001",
    rawMessage: "TypeError: Cannot read properties of undefined (reading 'totalDiscount')",
    normalizedMessage: "TypeError totalDiscount undefined",
    source: LogSource.client,
    level: "error",
    occurredAt: minutesAgo(index + 1),
    endpoint: "/api/payments/confirm",
    page: "/checkout/confirm",
    userId: null,
    createdAt: new Date()
  }));

  const authLogs = Array.from({ length: 10 }).map((_, index) => ({
    id: `log-auth-${index + 1}`,
    issueId: "iss-auth-001",
    rawMessage: "401 Unauthorized during refresh token flow",
    normalizedMessage: "refresh token unauthorized",
    source: LogSource.api,
    level: "warn",
    occurredAt: hoursAgo(index + 1),
    endpoint: "/api/auth/refresh",
    page: "/session-expired",
    userId: null,
    createdAt: new Date()
  }));

  await prisma.logEvent.createMany({
    data: [...paymentLogs, ...authLogs]
  });

  await prisma.issueComment.createMany({
    data: [
      {
        id: "cmt-pay-1",
        issueId: "iss-pay-001",
        author: "SRE-한지훈",
        body: "배포 직후 급증 확인. 결제 승인 경로 우선 대응 필요",
        createdAt: hoursAgo(2)
      },
      {
        id: "cmt-pay-2",
        issueId: "iss-pay-001",
        author: "FE-정우석",
        body: "응답 필드 누락 케이스 재현 완료. 방어 코드 준비중",
        createdAt: hoursAgo(1)
      },
      {
        id: "cmt-auth-1",
        issueId: "iss-auth-001",
        author: "BE-정우석",
        body: "토큰 갱신 경쟁 조건 의심. 로그 샘플 추가 수집중",
        createdAt: hoursAgo(3)
      }
    ]
  });

  await prisma.qaScenario.createMany({
    data: [
      {
        id: "qa-1",
        featureName: "주문 상세 할인금액 표시 추가",
        changedScreens: "주문 상세, 주문 목록",
        relatedApis: "GET /api/orders/{id}",
        releaseNote: "할인금액 UI 필드 신규 노출",
        generatedCases: ["정상 할인 케이스", "할인 없음 케이스", "0원 할인 케이스", "모바일 뷰 확인"],
        riskPoints: ["응답 필드 누락", "총금액 계산 불일치"],
        regressionTargets: ["주문 상세 총합 계산", "쿠폰 적용 로직"],
        audience: "developer"
      },
      {
        id: "qa-2",
        featureName: "로그인 세션 안정화",
        changedScreens: "로그인, 마이페이지",
        relatedApis: "POST /api/auth/refresh",
        releaseNote: "세션 연장 로직 개선",
        generatedCases: ["토큰 만료 직전 요청", "다중 탭 동시 요청", "네트워크 지연 상황"],
        riskPoints: ["쿠키 만료 경계값", "중복 갱신 요청"],
        regressionTargets: ["자동 로그인 유지", "권한 페이지 접근"],
        audience: "qa"
      }
    ]
  });

  console.log("[seed] OpsLens 샘플 데이터 입력 완료");
}

main()
  .catch((error) => {
    console.error("[seed] 실패", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
