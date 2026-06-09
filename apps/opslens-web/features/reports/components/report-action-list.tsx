"use client";

import { Badge, Box, Flex, Typography } from "@repo/ui";
import type { OpsReport } from "@repo/opslens";

type ReportActionListProps = {
  actions: OpsReport["actionItems"];
};

export function ReportActionList({ actions }: ReportActionListProps) {
  return (
    <Box className="space-y-[var(--space-2)]">
      {actions.map((action) => (
        <Box key={`${action.priority}-${action.title}`} className="border-default rounded-[var(--radius-md)] border p-[var(--space-3)]">
          <Flex className="items-start justify-between gap-[var(--space-3)]">
            <Box className="min-w-0">
              <Typography as="p" variant="bodySm" className="font-semibold">
                {action.title}
              </Typography>
              <Typography as="p" variant="caption" color="muted" className="mt-[var(--space-1)] leading-[1.5]">
                {action.description}
              </Typography>
            </Box>
            <Badge variant={action.priority === "P0" ? "danger" : action.priority === "P1" ? "warning" : "secondary"} size="sm" shape="rounded" className="shrink-0 font-semibold">
              {action.priority}
            </Badge>
          </Flex>
          <Typography as="p" variant="caption" color="subtle" className="mt-[var(--space-2)]">
            담당: {action.owner}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}
