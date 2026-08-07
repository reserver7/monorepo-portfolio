"use client";

import type { OpsAuditLog } from "@repo/opslens";
import { Badge, Box, Button, Flex, Grid, Input, Select, Typography } from "@repo/ui";
import {
  AUDIT_SEVERITY_TONE,
  formatAuditDetailDateTime,
  formatAuditListDateTime,
  parseJsonLabel
} from "../utils/settings-utils";

type AuditLogPanelProps = {
  auditLogs: OpsAuditLog[];
  selectedAuditLog?: OpsAuditLog;
  isLoading: boolean;
  query: string;
  severity: string;
  targetType: string;
  onQueryChange: (value: string) => void;
  onSeverityChange: (value: string) => void;
  onTargetTypeChange: (value: string) => void;
  onSelectAuditLog: (id: string) => void;
  onResetFilters: () => void;
};

type AuditValueBlockProps = {
  label: string;
  value: string;
  maxHeightClassName?: string;
};

function AuditValueBlock({ label, value, maxHeightClassName = "max-h-[132px]" }: AuditValueBlockProps) {
  return (
    <Box className="min-w-0">
      <Typography as="p" color="muted" className="text-caption mb-[var(--space-1-5)] font-semibold">
        {label}
      </Typography>
      <Box
        className={`border-default bg-surface-elevated overflow-auto rounded-[var(--radius-md)] border p-[var(--space-2-5)] ${maxHeightClassName}`}
      >
        {value ? (
          <Typography
            as="p"
            className="text-muted whitespace-pre-wrap break-words font-mono text-[11px] leading-[1.45]"
          >
            {value}
          </Typography>
        ) : (
          <Typography as="p" color="subtle" className="text-caption">
            기록 없음
          </Typography>
        )}
      </Box>
    </Box>
  );
}

export function AuditLogPanel({
  auditLogs,
  selectedAuditLog,
  isLoading,
  query,
  severity,
  targetType,
  onQueryChange,
  onSeverityChange,
  onTargetTypeChange,
  onSelectAuditLog,
  onResetFilters
}: AuditLogPanelProps) {
  const beforeValue = selectedAuditLog ? parseJsonLabel(selectedAuditLog.beforeValue) : "";
  const afterValue = selectedAuditLog ? parseJsonLabel(selectedAuditLog.afterValue) : "";
  const metadataValue = selectedAuditLog ? parseJsonLabel(selectedAuditLog.metadata) : "";

  return (
    <Grid className="gap-[var(--space-4)]">
      <Grid className="gap-[var(--space-2)] md:grid-cols-[minmax(0,1fr)_180px_180px_auto]">
        <Input
          value={query}
          placeholder="요약, 액션, 대상 검색"
          onChange={(event) => onQueryChange(event.target.value)}
        />
        <Select
          value={severity}
          onChange={(value) => {
            if (typeof value === "string") onSeverityChange(value);
          }}
          options={[
            { label: "전체 위험도", value: "all" },
            { label: "info", value: "info" },
            { label: "warning", value: "warning" },
            { label: "critical", value: "critical" }
          ]}
        />
        <Select
          value={targetType}
          onChange={(value) => {
            if (typeof value === "string") onTargetTypeChange(value);
          }}
          options={[
            { label: "전체 대상", value: "all" },
            { label: "설정", value: "OpsSetting" },
            { label: "알림", value: "OpsAlert" },
            { label: "이슈", value: "Issue" },
            { label: "배포", value: "Deployment" },
            { label: "리포트", value: "OpsReportSnapshot" },
            { label: "QA", value: "QaScenario" }
          ]}
        />
        <Button variant="secondary" onClick={onResetFilters}>
          초기화
        </Button>
      </Grid>

      <Grid className="gap-[var(--space-4)] xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.8fr)]">
        <Box className="border-default bg-surface divide-default divide-y overflow-hidden rounded-[var(--radius-lg)] border">
          {auditLogs.length > 0 ? (
            auditLogs.map((log) => (
              <Button
                key={log.id}
                variant="ghost"
                className={`h-auto w-full justify-start rounded-none px-[var(--space-3)] py-[var(--space-3)] text-left ${
                  selectedAuditLog?.id === log.id ? "bg-primary/5" : ""
                }`}
                onClick={() => onSelectAuditLog(log.id)}
              >
                <Flex className="w-full items-start justify-between gap-[var(--space-3)]">
                  <Box className="min-w-0">
                    <Flex className="flex-wrap items-center gap-[var(--space-2)]">
                      <Badge
                        variant={AUDIT_SEVERITY_TONE[log.severity] ?? "secondary"}
                        size="sm"
                        className="shrink-0"
                      >
                        {log.severity}
                      </Badge>
                      <Typography as="span" className="text-body-sm min-w-0 font-semibold">
                        {log.summary}
                      </Typography>
                    </Flex>
                    <Typography as="p" color="muted" className="text-caption mt-[var(--space-1)] truncate">
                      {log.actor} · {log.action} · {log.targetType}
                    </Typography>
                  </Box>
                  <Typography as="span" color="subtle" className="text-caption shrink-0">
                    {formatAuditListDateTime(log.createdAt)}
                  </Typography>
                </Flex>
              </Button>
            ))
          ) : (
            <Box className="px-[var(--space-3)] py-[var(--space-5)] text-center">
              <Typography as="p" variant="caption" color="muted">
                {isLoading ? "감사 로그를 불러오는 중입니다." : "조건에 맞는 운영 변경 이력이 없습니다."}
              </Typography>
            </Box>
          )}
        </Box>
        <Box className="border-default bg-surface rounded-[var(--radius-lg)] border p-[var(--space-4)]">
          {selectedAuditLog ? (
            <Grid className="gap-[var(--space-3)]">
              <Flex className="items-start justify-between gap-[var(--space-3)]">
                <Box className="min-w-0">
                  <Typography as="h3" className="text-body-lg font-semibold">
                    {selectedAuditLog.summary}
                  </Typography>
                  <Typography as="p" color="muted" className="text-caption mt-[var(--space-1)]">
                    {selectedAuditLog.actor} · {selectedAuditLog.action}
                  </Typography>
                </Box>
                <Badge variant={AUDIT_SEVERITY_TONE[selectedAuditLog.severity] ?? "secondary"} size="sm">
                  {selectedAuditLog.severity}
                </Badge>
              </Flex>
              <Grid className="gap-[var(--space-2)] md:grid-cols-2">
                <Box className="border-default rounded-[var(--radius-md)] border p-[var(--space-3)]">
                  <Typography as="p" color="muted" className="text-caption">
                    대상
                  </Typography>
                  <Typography as="p" className="text-body-sm mt-[var(--space-1)] font-semibold">
                    {selectedAuditLog.targetType}
                  </Typography>
                </Box>
                <Box className="border-default rounded-[var(--radius-md)] border p-[var(--space-3)]">
                  <Typography as="p" color="muted" className="text-caption">
                    대상 ID
                  </Typography>
                  <Typography as="p" className="text-body-sm mt-[var(--space-1)] truncate font-semibold">
                    {selectedAuditLog.targetId ?? "-"}
                  </Typography>
                </Box>
              </Grid>
              <Grid className="gap-[var(--space-2)] md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                <Box className="border-default rounded-[var(--radius-md)] border p-[var(--space-3)]">
                  <Typography as="p" color="muted" className="text-caption">
                    발생 시각
                  </Typography>
                  <Typography as="p" className="text-body-sm mt-[var(--space-1)] font-semibold">
                    {formatAuditDetailDateTime(selectedAuditLog.createdAt)}
                  </Typography>
                </Box>
                <Box className="border-default rounded-[var(--radius-md)] border p-[var(--space-3)]">
                  <Typography as="p" color="muted" className="text-caption">
                    작업자
                  </Typography>
                  <Typography as="p" className="text-body-sm mt-[var(--space-1)] truncate font-semibold">
                    {selectedAuditLog.actor}
                  </Typography>
                </Box>
              </Grid>
              <Box className="border-default rounded-[var(--radius-md)] border">
                <Box className="border-default border-b px-[var(--space-3)] py-[var(--space-2)]">
                  <Typography as="p" className="text-caption font-semibold">
                    변경 내용
                  </Typography>
                </Box>
                <Grid className="gap-[var(--space-3)] p-[var(--space-3)] md:grid-cols-2">
                  <AuditValueBlock label="변경 전" value={beforeValue} />
                  <AuditValueBlock label="변경 후" value={afterValue} />
                </Grid>
              </Box>
              <Box className="border-default rounded-[var(--radius-md)] border p-[var(--space-3)]">
                <Flex className="items-center justify-between gap-[var(--space-2)]">
                  <Typography as="p" className="text-caption font-semibold">
                    메타데이터
                  </Typography>
                  <Badge variant="outline" size="sm">
                    {selectedAuditLog.action}
                  </Badge>
                </Flex>
                <Box className="mt-[var(--space-2)]">
                  <AuditValueBlock
                    label="요청 정보"
                    value={metadataValue}
                    maxHeightClassName="max-h-[96px]"
                  />
                </Box>
              </Box>
            </Grid>
          ) : (
            <Typography as="p" color="muted" className="text-body-sm">
              선택된 감사 로그가 없습니다.
            </Typography>
          )}
        </Box>
      </Grid>
    </Grid>
  );
}
