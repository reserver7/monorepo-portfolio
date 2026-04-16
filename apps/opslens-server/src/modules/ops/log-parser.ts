type IssueSeverity = "critical" | "high" | "medium" | "low";

export interface ParsedLogLine {
  rawMessage: string;
  message: string;
  normalizedMessage: string;
  level: string;
  occurredAt: Date;
  endpoint?: string;
  page?: string;
}

export interface ClusteredLogIssue {
  title: string;
  normalizedMessage: string;
  severity: IssueSeverity;
  count: number;
  firstSeen: Date;
  lastSeen: Date;
  probableCauses: string[];
  suggestedActions: string[];
  affectedArea: string;
  deploymentCorrelation: string;
  reproductionGuide: string;
  lines: ParsedLogLine[];
}

const UUID_REGEX = /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi;
const NUMBER_REGEX = /\b\d+\b/g;
const PATH_ID_REGEX = /\/[0-9a-f]{6,}|\/[0-9]+/gi;

export function normalizeMessage(message: string): string {
  return message
    .replace(UUID_REGEX, "<uuid>")
    .replace(PATH_ID_REGEX, "/<id>")
    .replace(NUMBER_REGEX, "<num>")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 240);
}

function detectLevel(line: string): string {
  const lowered = line.toLowerCase();
  if (lowered.includes("fatal") || lowered.includes("critical")) return "critical";
  if (lowered.includes("error")) return "error";
  if (lowered.includes("warn")) return "warn";
  if (lowered.includes("debug")) return "debug";
  return "info";
}

function detectSeverity(message: string, level: string): IssueSeverity {
  const lowered = `${message} ${level}`.toLowerCase();
  if (
    lowered.includes("payment") ||
    lowered.includes("checkout") ||
    lowered.includes("fatal") ||
    lowered.includes("timeout") ||
    lowered.includes("database")
  ) {
    return "critical";
  }
  if (lowered.includes("500") || lowered.includes("cannot") || lowered.includes("undefined")) {
    return "high";
  }
  if (lowered.includes("warn") || lowered.includes("validation") || lowered.includes("401")) {
    return "medium";
  }
  return "low";
}

function inferAffectedArea(message: string): string {
  const lowered = message.toLowerCase();
  if (lowered.includes("payment") || lowered.includes("checkout")) return "결제/주문";
  if (lowered.includes("auth") || lowered.includes("token") || lowered.includes("permission"))
    return "인증/권한";
  if (lowered.includes("api") || lowered.includes("endpoint")) return "API";
  if (lowered.includes("ui") || lowered.includes("render") || lowered.includes("react")) return "프론트 UI";
  return "공통 서비스";
}

function inferCauses(message: string): string[] {
  const lowered = message.toLowerCase();
  const causes: string[] = [];
  if (lowered.includes("undefined") || lowered.includes("null")) {
    causes.push("응답 스키마 변경으로 필수 필드가 누락되었을 가능성");
  }
  if (lowered.includes("timeout")) {
    causes.push("외부 API 또는 DB 응답 지연으로 타임아웃이 발생했을 가능성");
  }
  if (lowered.includes("permission") || lowered.includes("forbidden") || lowered.includes("401")) {
    causes.push("권한 토큰 만료 또는 권한 정책 변경 가능성");
  }
  if (causes.length === 0) {
    causes.push("최근 배포 변경점과 런타임 데이터 불일치 가능성");
  }
  return causes;
}

function inferActions(message: string): string[] {
  const lowered = message.toLowerCase();
  const actions = ["최근 배포 커밋과 관련 모듈 diff 확인"];

  if (lowered.includes("undefined") || lowered.includes("null")) {
    actions.unshift("null-safe 처리 및 응답 스키마 검증 로직 점검");
  }
  if (lowered.includes("timeout")) {
    actions.unshift("타임아웃 임계치/재시도 정책과 외부 의존성 상태 점검");
  }
  if (lowered.includes("permission") || lowered.includes("401")) {
    actions.unshift("권한 토큰 발급/검증 경로 및 만료 정책 확인");
  }

  return actions.slice(0, 3);
}

function inferDeploymentCorrelation(count: number, firstSeen: Date): string {
  const recentMs = Date.now() - firstSeen.getTime();
  if (count > 20 || recentMs < 2 * 60 * 60 * 1000) return "high";
  if (count > 8 || recentMs < 8 * 60 * 60 * 1000) return "medium";
  return "low";
}

export function parseLogLines(rawLogs: string): ParsedLogLine[] {
  return rawLogs
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const timestamp = line.match(
        /\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?/
      );
      const occurredAt = timestamp ? new Date(timestamp[0].replace(" ", "T")) : new Date();
      const level = detectLevel(line);
      const endpoint = line.match(/\/(api|v\d)\/[^\s"']+/)?.[0];
      const page = line.match(/\/(?:doc|board|checkout|payment|orders)\/[^\s"']+/)?.[0];
      const message = line.length > 280 ? `${line.slice(0, 277)}...` : line;

      return {
        rawMessage: line,
        message,
        normalizedMessage: normalizeMessage(message),
        level,
        occurredAt: Number.isNaN(occurredAt.getTime()) ? new Date() : occurredAt,
        endpoint,
        page
      };
    });
}

export function clusterLogs(lines: ParsedLogLine[]): ClusteredLogIssue[] {
  const grouped = new Map<string, ParsedLogLine[]>();

  for (const line of lines) {
    const key = line.normalizedMessage || "unknown";
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)?.push(line);
  }

  return Array.from(grouped.entries())
    .map(([normalizedMessage, groupedLines]) => {
      const sorted = [...groupedLines].sort((a, b) => a.occurredAt.getTime() - b.occurredAt.getTime());
      const first = sorted[0];
      const last = sorted[sorted.length - 1];
      if (!first || !last) {
        return null;
      }
      const severity = detectSeverity(normalizedMessage, first.level);
      const probableCauses = inferCauses(normalizedMessage);
      const suggestedActions = inferActions(normalizedMessage);
      const affectedArea = inferAffectedArea(normalizedMessage);
      const deploymentCorrelation = inferDeploymentCorrelation(sorted.length, first.occurredAt);

      return {
        title: first.message.slice(0, 90),
        normalizedMessage,
        severity,
        count: groupedLines.length,
        firstSeen: first.occurredAt,
        lastSeen: last.occurredAt,
        probableCauses,
        suggestedActions,
        affectedArea,
        deploymentCorrelation,
        reproductionGuide:
          "동일 API/페이지 요청을 스테이지 환경에서 재현하고 응답 스키마 및 권한 상태를 확인합니다.",
        lines: groupedLines
      };
    })
    .filter((item): item is ClusteredLogIssue => item !== null)
    .sort((a, b) => b.count - a.count);
}
