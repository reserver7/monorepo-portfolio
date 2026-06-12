import { RotateCcw } from "lucide-react";
import type { useAppForm } from "@repo/forms";
import { Box, Button, Flex, Grid, Select } from "@repo/ui";

import {
  ISSUE_ASSIGNEE_OPTIONS,
  ISSUE_SEVERITY_OPTIONS,
  ISSUE_SORT_OPTIONS,
  ISSUE_STATUS_OPTIONS
} from "../constants";
import type { IssueFilterFormValues } from "../types";

type IssueFilterFormInstance = ReturnType<typeof useAppForm<IssueFilterFormValues>>;

type IssuesFilterBarProps = {
  form: IssueFilterFormInstance;
  hasFilter: boolean;
  slaRiskOnly: boolean;
  onFilterChange: () => void;
  onReset: () => void;
  onToggleSlaRisk: () => void;
};

export function IssuesFilterBar({
  form,
  hasFilter,
  slaRiskOnly,
  onFilterChange,
  onReset,
  onToggleSlaRisk
}: IssuesFilterBarProps) {
  return (
    <Box className="border-default bg-surface mb-[var(--space-3)] rounded-[var(--radius-md)] border p-[var(--space-3)]">
      <Grid className="gap-[var(--space-2)] md:grid-cols-2 xl:grid-cols-5">
        <Select options={ISSUE_STATUS_OPTIONS} control={form.control} name="status" onChange={onFilterChange} size="sm" />
        <Select options={ISSUE_SEVERITY_OPTIONS} control={form.control} name="severity" onChange={onFilterChange} size="sm" />
        <Select options={ISSUE_ASSIGNEE_OPTIONS} control={form.control} name="assignee" onChange={onFilterChange} size="sm" />
        <Select options={ISSUE_SORT_OPTIONS} control={form.control} name="sortBy" onChange={onFilterChange} size="sm" />
        <Flex className="items-center gap-[var(--space-1)]">
          <Button variant={slaRiskOnly ? "primary" : "secondary"} size="sm" className="flex-1" onClick={onToggleSlaRisk}>
            SLA
          </Button>
          <Button
            variant="secondary"
            size="sm"
            iconOnly
            leftIcon={<RotateCcw />}
            aria-label="이슈 전용 필터 초기화"
            disabled={!hasFilter}
            onClick={onReset}
          />
        </Flex>
      </Grid>
    </Box>
  );
}
