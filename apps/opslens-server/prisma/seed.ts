import "dotenv/config";
import { scryptSync } from "node:crypto";
import { AuthRole, IssueSeverity, IssueStatus, LogSource, OpsEnvironment, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const hoursAgo = (hours: number): Date => new Date(Date.now() - hours * 60 * 60 * 1000);
const minutesAgo = (minutes: number): Date => new Date(Date.now() - minutes * 60 * 1000);
const hashPassword = (password: string): string => {
  const salt = "opslens-seed-salt";
  const digest = scryptSync(password, salt, 64).toString("base64url");
  return `scrypt$${salt}$${digest}`;
};

async function main(): Promise<void> {
  console.log("[seed] OpsLens 샘플 데이터 입력 시작");

  await prisma.$transaction([
    prisma.opsAuditLog.deleteMany(),
    prisma.opsSetting.deleteMany(),
    prisma.opsReportSnapshot.deleteMany(),
    prisma.opsAlert.deleteMany(),
    prisma.logAnalysisSession.deleteMany(),
    prisma.user.deleteMany(),
    prisma.issueComment.deleteMany(),
    prisma.logEvent.deleteMany(),
    prisma.qaScenario.deleteMany(),
    prisma.issue.deleteMany(),
    prisma.deployment.deleteMany()
  ]);

  await prisma.user.createMany({
    data: [
      {
        id: "usr-admin-001",
        email: "admin@opslens.local",
        passwordHash: hashPassword("opslens1234!"),
        name: "OpsLens Admin",
        role: AuthRole.admin,
        isActive: true
      },
      {
        id: "usr-operator-001",
        email: "operator@opslens.local",
        passwordHash: hashPassword("opslens1234!"),
        name: "OpsLens Operator",
        role: AuthRole.operator,
        isActive: true
      }
    ]
  });

  await prisma.deployment.createMany({
    data: [
      {
        id: "dep-prod-2026-03-26",
        version: "2026.03.26-1",
        environment: OpsEnvironment.prod,
        changelog: "결제 모듈 리팩토링 + 주문 API 응답 필드 변경",
        status: "monitoring",
        owner: "배포담당자-김도윤",
        approver: "Tech Lead",
        scopeTags: ["Frontend", "API", "Payment"],
        checklist: ["릴리즈 노트 확인", "결제 승인 smoke test", "rollback SQL 검토"],
        rollbackCriteria: "Critical 결제 오류가 30분 내 50건 이상 발생하면 롤백 검토",
        monitoringWindowMin: 120,
        deployedAt: hoursAgo(10),
        updatedAt: new Date()
      },
      {
        id: "dep-stage-2026-03-25",
        version: "2026.03.25-2",
        environment: OpsEnvironment.stage,
        changelog: "로그 수집 파이프라인 개선",
        status: "completed",
        owner: "SRE-한지훈",
        approver: "Platform Lead",
        scopeTags: ["Infra", "API"],
        checklist: ["수집 지연 확인", "샘플 로그 정규화 확인"],
        rollbackCriteria: "로그 누락률 5% 초과 시 이전 수집기로 전환",
        monitoringWindowMin: 60,
        deployedAt: hoursAgo(30),
        updatedAt: new Date()
      },
      {
        id: "dep-prod-2026-03-24",
        version: "2026.03.24-3",
        environment: OpsEnvironment.prod,
        changelog: "에러 핸들러 공통화",
        status: "completed",
        owner: "운영담당자",
        approver: "Tech Lead",
        scopeTags: ["Frontend", "API", "Auth"],
        checklist: ["공통 에러 화면 확인", "API 4xx/5xx 처리 확인"],
        rollbackCriteria: "공통 에러 핸들링으로 사용자 차단이 발생하면 핫픽스",
        monitoringWindowMin: 90,
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
        priority: "P0",
        slaDueAt: hoursAgo(-1),
        escalationLevel: 2,
        summary: "결제 승인 시 일부 사용자에서 런타임 오류가 발생합니다.",
        probableCauses: ["신규 응답 스키마에서 totalDiscount 필드 누락 가능성", "null-safe 처리 누락"],
        suggestedActions: [
          "결제 API 응답 스키마 확인",
          "프론트 null-safe 방어코드 추가",
          "배포 전후 응답 비교"
        ],
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
        priority: "P1",
        slaDueAt: hoursAgo(-3),
        escalationLevel: 1,
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
        priority: "P1",
        slaDueAt: hoursAgo(-4),
        escalationLevel: 1,
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
        priority: "P2",
        slaDueAt: hoursAgo(-24),
        escalationLevel: 0,
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
        priority: "P2",
        slaDueAt: hoursAgo(12),
        escalationLevel: 0,
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
      },
      {
        id: "iss-docs-001",
        title: "문서 권한 강등 후 재요청 루프",
        signature: "DocsPermissionLoop:403-retry",
        severity: IssueSeverity.high,
        status: IssueStatus.analyzing,
        priority: "P1",
        slaDueAt: hoursAgo(-2),
        escalationLevel: 1,
        summary: "권한 강등 이벤트 이후 문서 접근 재시도가 반복됩니다.",
        probableCauses: ["권한 캐시 만료 처리 누락", "403 응답 재시도 정책 과도"],
        suggestedActions: ["권한 캐시 무효화 시점 점검", "재시도 백오프 적용"],
        reproductionGuide: "1) 문서 권한을 viewer로 변경 2) 기존 탭에서 편집 요청",
        assignee: "BE-한지훈",
        serviceName: "docs-api",
        environment: OpsEnvironment.prod,
        occurrenceCount: 76,
        firstOccurredAt: hoursAgo(13),
        lastOccurredAt: minutesAgo(11),
        affectedArea: "permission",
        deploymentCorrelation: "중간",
        deploymentId: "dep-prod-2026-03-26",
        createdAt: hoursAgo(13),
        updatedAt: new Date()
      },
      {
        id: "iss-wb-001",
        title: "화이트보드 재연결 지연",
        signature: "WhiteboardReconnect:socket-delay",
        severity: IssueSeverity.medium,
        status: IssueStatus.in_progress,
        priority: "P2",
        slaDueAt: hoursAgo(-18),
        escalationLevel: 0,
        summary: "네트워크 복구 직후 화이트보드 소켓 재연결이 지연됩니다.",
        probableCauses: ["재연결 타이머 중복 등록", "heartbeat 간격 과도"],
        suggestedActions: ["재연결 타이머 단일화", "heartbeat 간격 조정"],
        reproductionGuide: "1) 화이트보드 접속 2) 네트워크 off/on 3) 재연결 소요시간 확인",
        assignee: "FE-민서윤",
        serviceName: "whiteboard-gateway",
        environment: OpsEnvironment.prod,
        occurrenceCount: 43,
        firstOccurredAt: hoursAgo(20),
        lastOccurredAt: minutesAgo(29),
        affectedArea: "realtime",
        deploymentCorrelation: "낮음",
        deploymentId: "dep-prod-2026-03-24",
        createdAt: hoursAgo(20),
        updatedAt: new Date()
      },
      {
        id: "iss-billing-001",
        title: "정산 배치 완료 지연",
        signature: "BillingBatchDelay:cron-latency",
        severity: IssueSeverity.low,
        status: IssueStatus.new,
        priority: "P3",
        slaDueAt: hoursAgo(-48),
        escalationLevel: 0,
        summary: "정산 배치 완료 시점이 SLA 대비 지연됩니다.",
        probableCauses: ["배치 큐 적체", "리포트 집계 쿼리 비용 증가"],
        suggestedActions: ["배치 병렬도 상향 검토", "집계 쿼리 인덱스 점검"],
        reproductionGuide: "1) 배치 시작 후 완료 시각 비교 2) 큐 길이 확인",
        assignee: null,
        serviceName: "billing-worker",
        environment: OpsEnvironment.prod,
        occurrenceCount: 18,
        firstOccurredAt: hoursAgo(26),
        lastOccurredAt: hoursAgo(2),
        affectedArea: "batch",
        deploymentCorrelation: "낮음",
        deploymentId: "dep-prod-2026-03-24",
        createdAt: hoursAgo(26),
        updatedAt: new Date()
      },
      {
        id: "iss-api-002",
        title: "API 500 재발 (주문 취소)",
        signature: "Http500:/api/orders/{id}/cancel",
        severity: IssueSeverity.critical,
        status: IssueStatus.new,
        priority: "P0",
        slaDueAt: minutesAgo(-45),
        escalationLevel: 2,
        summary: "주문 취소 API에서 500 에러가 간헐적으로 재발합니다.",
        probableCauses: ["트랜잭션 락 경합", "환불 상태 전이 불일치"],
        suggestedActions: ["취소 트랜잭션 로깅 강화", "상태 전이 가드 추가"],
        reproductionGuide: "1) 동시 취소 요청 2) 취소 API 응답 확인",
        assignee: "BE-김도윤",
        serviceName: "orders-api",
        environment: OpsEnvironment.prod,
        occurrenceCount: 64,
        firstOccurredAt: hoursAgo(6),
        lastOccurredAt: minutesAgo(6),
        affectedArea: "order-cancel",
        deploymentCorrelation: "높음",
        deploymentId: "dep-prod-2026-03-26",
        createdAt: hoursAgo(6),
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

  const orderApiLogs = Array.from({ length: 22 }).map((_, index) => ({
    id: `log-api-500-${index + 1}`,
    issueId: "iss-api-001",
    rawMessage: "HttpError: 500 Internal Server Error at /api/orders/{id}",
    normalizedMessage: "orders detail api 500",
    source: LogSource.api,
    level: "error",
    occurredAt: hoursAgo((index % 12) + 1),
    endpoint: "/api/orders/{id}",
    page: "/orders/detail",
    userId: null,
    createdAt: new Date()
  }));

  const orderCancelApiLogs = Array.from({ length: 30 }).map((_, index) => ({
    id: `log-api-cancel-500-${index + 1}`,
    issueId: "iss-api-002",
    rawMessage: "HttpError: 500 Internal Server Error at /api/orders/{id}/cancel",
    normalizedMessage: "orders cancel api 500",
    source: LogSource.api,
    level: "error",
    occurredAt: minutesAgo(index * 3 + 2),
    endpoint: "/api/orders/{id}/cancel",
    page: "/orders/detail",
    userId: null,
    createdAt: new Date()
  }));

  const docsPermissionLogs = Array.from({ length: 16 }).map((_, index) => ({
    id: `log-docs-perm-${index + 1}`,
    issueId: "iss-docs-001",
    rawMessage: "403 Forbidden with repeated retry after permission downgrade",
    normalizedMessage: "docs permission retry loop",
    source: LogSource.server,
    level: "warn",
    occurredAt: minutesAgo(index * 5 + 8),
    endpoint: "/api/documents/{id}/content",
    page: "/docs",
    userId: null,
    createdAt: new Date()
  }));

  const whiteboardReconnectLogs = Array.from({ length: 14 }).map((_, index) => ({
    id: `log-wb-reconnect-${index + 1}`,
    issueId: "iss-wb-001",
    rawMessage: "WebSocket reconnect took longer than threshold",
    normalizedMessage: "whiteboard reconnect delay",
    source: LogSource.console,
    level: "warn",
    occurredAt: hoursAgo((index % 18) + 2),
    endpoint: "/ws/whiteboard",
    page: "/whiteboard",
    userId: null,
    createdAt: new Date()
  }));

  await prisma.logEvent.createMany({
    data: [
      ...paymentLogs,
      ...authLogs,
      ...orderApiLogs,
      ...orderCancelApiLogs,
      ...docsPermissionLogs,
      ...whiteboardReconnectLogs
    ]
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
      },
      {
        id: "cmt-docs-1",
        issueId: "iss-docs-001",
        author: "SRE-한지훈",
        body: "권한 강등 직후 재요청 루프 패턴 확인. 캐시 무효화 로직 점검 필요",
        createdAt: hoursAgo(4)
      },
      {
        id: "cmt-wb-1",
        issueId: "iss-wb-001",
        author: "FE-민서윤",
        body: "네트워크 복구 시 재연결 지연 재현 완료. heartbeat interval 조정 예정",
        createdAt: hoursAgo(5)
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
        audience: "developer",
        status: "review",
        owner: "QA-박서연",
        reviewer: "FE-정우석",
        executionStatus: "in_progress",
        notes: "할인 없음/0원 케이스는 회귀 자동화 후보"
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
        audience: "qa",
        status: "approved",
        owner: "QA-이민지",
        reviewer: "BE-정우석",
        executionStatus: "completed",
        executedAt: hoursAgo(5),
        notes: "다중 탭 갱신 케이스 수동 확인 완료"
      }
    ]
  });

  await prisma.opsAlert.createMany({
    data: [
      {
        id: "alert-pay-critical",
        level: IssueSeverity.critical,
        title: "결제 승인 단계 TypeError 급증",
        message: "payments-web에서 배포 이후 Critical 이슈가 SLA 기준을 초과했습니다.",
        source: "payments-web",
        link: "/issues/iss-pay-001",
        createdAt: minutesAgo(42),
        updatedAt: new Date()
      },
      {
        id: "alert-order-high",
        level: IssueSeverity.high,
        title: "주문 상세 API 500 재발",
        message: "orders-api 500 에러가 배포 모니터링 윈도우 안에서 증가했습니다.",
        source: "orders-api",
        link: "/issues/iss-api-001",
        createdAt: minutesAgo(37),
        updatedAt: new Date()
      },
      {
        id: "alert-report-read",
        level: IssueSeverity.medium,
        title: "일일 운영 리포트 생성 완료",
        message: "prod 기준 운영 리포트 스냅샷이 생성되었습니다.",
        source: "reports",
        link: "/reports",
        readAt: minutesAgo(12),
        createdAt: hoursAgo(2),
        updatedAt: new Date()
      }
    ]
  });

  await prisma.logAnalysisSession.createMany({
    data: [
      {
        id: "log-session-payments",
        environment: OpsEnvironment.prod,
        serviceName: "payments-web",
        source: LogSource.client,
        requestedBy: "SRE-한지훈",
        deploymentVersion: "2026.03.26-1",
        rawLineCount: 1240,
        clusterTotalCount: 8,
        clusterDisplayedCount: 5,
        createdIssues: 1,
        updatedIssues: 2,
        topClusterTitle: "결제 승인 단계 TypeError",
        createdAt: minutesAgo(35)
      },
      {
        id: "log-session-orders",
        environment: OpsEnvironment.prod,
        serviceName: "orders-api",
        source: LogSource.api,
        requestedBy: "BE-김도윤",
        deploymentVersion: "2026.03.26-1",
        rawLineCount: 860,
        clusterTotalCount: 6,
        clusterDisplayedCount: 4,
        createdIssues: 1,
        updatedIssues: 1,
        topClusterTitle: "주문 상세 API 500",
        createdAt: minutesAgo(50)
      }
    ]
  });

  await prisma.opsReportSnapshot.createMany({
    data: [
      {
        id: "report-prod-daily",
        title: "[prod] 일일 운영 리포트",
        environment: OpsEnvironment.prod,
        riskLevel: "critical",
        executiveSummary: "오늘 Critical 2건, High 3건이 감지되었고 결제/주문 API를 우선 대응해야 합니다.",
        technicalSummary: "payments-web TypeError와 orders-api 500이 배포 이후 증가했습니다.",
        shareText: "[prod] 운영 리포트\nCritical 2건 / High 3건\nAction: 결제 승인 오류와 주문 API 500 우선 대응",
        generatedBy: "system",
        pinned: true,
        sharedAt: minutesAgo(45),
        generatedAt: hoursAgo(1)
      },
      {
        id: "report-stage-daily",
        title: "[stage] 회귀 확인 리포트",
        environment: OpsEnvironment.stage,
        riskLevel: "warning",
        executiveSummary: "할인금액 표시 회귀 케이스가 확인되어 QA 체크리스트 강화가 필요합니다.",
        technicalSummary: "orders-web 조건부 렌더링 분기 누락 가능성이 큽니다.",
        shareText: "[stage] QA 리포트\n회귀 후보 1건\nAction: 할인금액 표시 케이스 자동화",
        generatedBy: "qa",
        pinned: false,
        generatedAt: hoursAgo(6)
      }
    ]
  });

  await prisma.opsSetting.createMany({
    data: [
      {
        id: "setting-alert-policy",
        key: "alert.policy",
        value: {
          minLevel: "high",
          channels: ["inApp", "slack"],
          escalationMinutes: { critical: 15, high: 60 }
        },
        description: "운영 알림 발송 및 에스컬레이션 기준",
        category: "alert",
        riskLevel: "high",
        editable: true,
        updatedBy: "OpsLens Admin",
        changeReason: "운영 알림 기준 초기 구성"
      },
      {
        id: "setting-report-schedule",
        key: "report.schedule",
        value: {
          timezone: "Asia/Seoul",
          dailyHour: 9,
          recipients: ["ops", "tech-leads"]
        },
        description: "운영 리포트 자동 생성 기준",
        category: "report",
        riskLevel: "medium",
        editable: true,
        updatedBy: "OpsLens Admin",
        changeReason: "정기 리포트 mock 운영 정책 구성"
      },
      {
        id: "setting-deployment-guardrail",
        key: "deployment.guardrail",
        value: {
          defaultMonitoringWindowMin: 60,
          rollbackCriticalThreshold: 50,
          requiredChecklist: ["릴리즈 노트", "롤백 기준", "담당자"]
        },
        description: "배포 등록과 영향 분석 기본 정책",
        category: "deployment",
        riskLevel: "critical",
        editable: true,
        updatedBy: "OpsLens Admin",
        changeReason: "배포 가드레일 기본값 구성"
      },
      {
        id: "setting-oncall-primary",
        key: "oncall.primary",
        value: {
          primary: "ops-oncall",
          escalationMinutes: { critical: 15, high: 60 },
          escalationTarget: "tech-lead"
        },
        description: "Critical/High 알림의 1차 담당자와 에스컬레이션 기준",
        category: "oncall",
        riskLevel: "high",
        editable: true,
        updatedBy: "OpsLens Admin",
        changeReason: "온콜 및 에스컬레이션 기본 정책 구성"
      }
    ]
  });

  await prisma.opsAuditLog.createMany({
    data: [
      {
        id: "audit-seed-report-created",
        actor: "system",
        action: "report_snapshot.created",
        targetType: "OpsReportSnapshot",
        targetId: "report-prod-daily",
        severity: "info",
        summary: "[prod] 일일 운영 리포트 스냅샷 생성",
        metadata: { riskLevel: "critical" },
        createdAt: hoursAgo(1)
      },
      {
        id: "audit-seed-alert-read",
        actor: "OpsLens Admin",
        action: "alert.read",
        targetType: "OpsAlert",
        targetId: "alert-report-read",
        severity: "info",
        summary: "일일 운영 리포트 생성 완료 알림 읽음 처리",
        metadata: {},
        createdAt: minutesAgo(12)
      },
      {
        id: "audit-seed-setting",
        actor: "OpsLens Admin",
        action: "setting.upserted",
        targetType: "OpsSetting",
        targetId: "setting-alert-policy",
        severity: "warning",
        summary: "alert.policy 운영 설정 저장",
        beforeValue: { minLevel: "critical", channels: ["inApp"] },
        afterValue: {
          minLevel: "high",
          channels: ["inApp", "slack"],
          escalationMinutes: { critical: 15, high: 60 }
        },
        metadata: { key: "alert.policy", category: "alert", changeReason: "슬랙 알림 추가" },
        createdAt: hoursAgo(2)
      }
    ]
  });

  console.log("[seed] OpsLens 샘플 데이터 입력 완료");
  console.log("[seed] 로그인 계정: admin@opslens.local / opslens1234!");
}

main()
  .catch((error) => {
    console.error("[seed] 실패", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
