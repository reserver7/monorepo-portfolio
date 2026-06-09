"use client";

import { Trash2 } from "lucide-react";
import { Badge, Box, Button, Flex, StateView, Typography } from "@repo/ui";
import { formatDateTime, formatNumber } from "@repo/utils";
import { OpsCardListSkeleton } from "@/features";
import { QA_AUDIENCE_LABELS, QA_NEUTRAL_BADGE_CLASS } from "../constants";
import type { QaAudience, QaScenarioItem } from "../types";
import { getQaScenarioItemCount } from "../utils/qa-assistant-utils";

type QaScenarioListProps = {
  isError: boolean;
  isLoading: boolean;
  isDeleting: boolean;
  scenarios: QaScenarioItem[];
  selectedScenarioId: string | null;
  onSelectScenario: (scenarioId: string) => void;
  onDeleteScenario: (scenario: QaScenarioItem) => void;
};

export function QaScenarioList({
  isError,
  isLoading,
  isDeleting,
  scenarios,
  selectedScenarioId,
  onSelectScenario,
  onDeleteScenario
}: QaScenarioListProps) {
  if (isLoading) {
    return <OpsCardListSkeleton count={3} />;
  }

  if (isError) {
    return <StateView variant="error" size="sm" title="시나리오 조회에 실패했습니다." className="mt-[var(--space-3)]" />;
  }

  if (scenarios.length === 0) {
    return <StateView variant="empty" size="sm" title="아직 생성된 시나리오가 없습니다." className="mt-[var(--space-3)]" />;
  }

  return (
    <Box className="mt-[var(--space-3)] space-y-[var(--space-2)]">
      {scenarios.map((scenario) => {
        const selected = selectedScenarioId === scenario.id;
        const totalItems = getQaScenarioItemCount(scenario);
        return (
          <Box
            key={scenario.id}
            role="button"
            tabIndex={0}
            className={`focus-visible:ring-primary focus-visible:ring-offset-surface relative cursor-pointer rounded-[var(--radius-md)] border border-default p-[var(--space-3)] pr-[var(--space-12)] text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
              selected ? "bg-surface-elevated" : "hover:bg-surface-elevated"
            }`}
            onClick={() => onSelectScenario(scenario.id)}
            onKeyDown={(event) => {
              if (event.key !== "Enter" && event.key !== " ") return;
              event.preventDefault();
              onSelectScenario(scenario.id);
            }}
          >
            <Box className="w-full">
              <Flex className="items-start justify-between gap-[var(--space-2)]">
                <Typography as="span" variant="bodySm" className="line-clamp-2 font-semibold">
                  {scenario.featureName}
                </Typography>
                <Badge variant="secondary" size="sm" shape="rounded" className={`${QA_NEUTRAL_BADGE_CLASS} shrink-0`}>
                  {QA_AUDIENCE_LABELS[scenario.audience as QaAudience] ?? scenario.audience}
                </Badge>
              </Flex>
              <Flex className="mt-[var(--space-2)] flex-wrap items-center gap-[var(--space-1-5)]">
                <Badge variant="outline" size="sm" shape="rounded" className="bg-surface font-semibold">
                  항목 {formatNumber(totalItems)}
                </Badge>
                <Typography as="span" variant="caption" color="subtle">
                  {formatDateTime(scenario.createdAt)}
                </Typography>
              </Flex>
            </Box>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              iconOnly
              leftIcon={<Trash2 />}
              aria-label="QA 산출물 삭제"
              disabled={isDeleting}
              className="absolute right-[var(--space-2)] top-[var(--space-2)] h-7 w-7 border-transparent !bg-transparent text-muted hover:!bg-danger/10 hover:text-danger"
              onClick={(event) => {
                event.stopPropagation();
                onDeleteScenario(scenario);
              }}
            />
          </Box>
        );
      })}
    </Box>
  );
}
