"use client";

import { Badge, Box, Checkbox, Flex, Typography } from "@repo/ui";
import type { OpsReportAction } from "@repo/opslens";

type ReportActionListProps = {
  actions: OpsReportAction[];
  disabled?: boolean;
  onToggle: (action: OpsReportAction, completed: boolean) => void;
};

export function ReportActionList({ actions, disabled, onToggle }: ReportActionListProps) {
  return (
    <Box className="space-y-[var(--space-2)]">
      {actions.map((action) => {
        const isComplete = Boolean(action.completedAt);
        return <Box key={action.id} className="border-default rounded-[var(--radius-md)] border p-[var(--space-3)]">
          <Flex className="items-start justify-between gap-[var(--space-3)]">
            <Flex className="min-w-0 gap-[var(--space-2)]">
              <Checkbox checked={isComplete} disabled={disabled} aria-label={`${action.title} 완료`} onCheckedChange={(checked) => onToggle(action, checked === true)} />
              <Box className="min-w-0">
                <Typography as="p" variant="bodySm" className="font-semibold">{action.title}</Typography>
                <Typography as="p" variant="caption" color="muted" className="mt-[var(--space-1)] leading-[1.5]">{action.description}</Typography>
              </Box>
            </Flex>
            <Badge variant={action.priority === "P0" ? "danger" : action.priority === "P1" ? "warning" : "secondary"} size="sm" shape="rounded" className="shrink-0 font-semibold">{action.priority}</Badge>
          </Flex>
          <Typography as="p" variant="caption" color="subtle" className="mt-[var(--space-2)]">담당: {action.owner} · {isComplete ? `${action.completedBy || "운영자"} 완료` : "진행 필요"}</Typography>
        </Box>;
      })}
      {actions.length === 0 ? <Typography as="p" variant="bodySm" color="muted">현재 리포트에 생성된 액션 아이템이 없습니다.</Typography> : null}
    </Box>
  );
}
