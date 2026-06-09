"use client";

import { Badge, Box, Flex, Grid, StateView, Typography } from "@repo/ui";
import { formatDateTime, formatNumber } from "@repo/utils";
import { OpsSectionCard } from "@/features";
import { QA_AUDIENCE_LABELS, QA_NEUTRAL_BADGE_CLASS, QA_STATUS_BADGE_CLASS } from "../constants";
import type { QaAudience, QaScenarioItem } from "../types";

type QaScenarioDetailProps = {
  scenario: QaScenarioItem | null;
};

export function QaScenarioDetail({ scenario }: QaScenarioDetailProps) {
  if (!scenario) {
    return (
      <OpsSectionCard title="생성 결과 상세" description="시나리오를 생성하거나 최근 산출물을 선택하면 상세가 표시됩니다.">
        <StateView variant="info" size="sm" title="검토할 QA 산출물이 없습니다." className="mt-[var(--space-3)]" />
      </OpsSectionCard>
    );
  }

  const riskVariant = scenario.riskPoints.length >= 3 ? "danger" : scenario.riskPoints.length > 0 ? "warning" : "success";

  return (
    <OpsSectionCard
      title="생성 결과 상세"
      description="테스트 실행, 리스크 리뷰, 회귀 범위를 한 번에 확인합니다."
      contentClassName="pt-[var(--space-2)]"
    >
      <Box className="space-y-[var(--space-4)]">
        <Box className="border-b border-default pb-[var(--space-3)]">
          <Flex className="items-start justify-between gap-[var(--space-3)]">
            <Box className="min-w-0">
              <Typography as="p" variant="bodyMd" className="font-semibold">
                {scenario.featureName}
              </Typography>
              <Typography as="p" variant="caption" color="subtle" className="mt-[var(--space-1)]">
                생성 시각: {formatDateTime(scenario.createdAt)}
              </Typography>
            </Box>
            <Flex className="flex-wrap justify-end gap-[var(--space-1-5)]">
              <Badge variant="secondary" size="sm" shape="rounded" className={QA_NEUTRAL_BADGE_CLASS}>
                {QA_AUDIENCE_LABELS[scenario.audience as QaAudience] ?? scenario.audience}
              </Badge>
            </Flex>
          </Flex>
        </Box>

        <ResultList
          title="리스크 포인트"
          description="릴리즈 전 우선 확인할 실패 가능성입니다."
          badgeVariant={riskVariant}
          items={scenario.riskPoints}
          priority
        />

        <Grid className="gap-[var(--space-4)] lg:grid-cols-2">
          <ResultList
            title="테스트 케이스"
            description="QA 실행 단위로 바로 옮길 항목입니다."
            badgeVariant="secondary"
            items={scenario.generatedCases}
          />
          <ResultList
            title="회귀 대상"
            description="기존 동작 보존 여부를 확인할 범위입니다."
            badgeVariant="secondary"
            items={scenario.regressionTargets}
          />
        </Grid>
      </Box>
    </OpsSectionCard>
  );
}

function ResultList({
  title,
  description,
  badgeVariant,
  items,
  priority = false
}: {
  title: string;
  description: string;
  badgeVariant: "secondary" | "warning" | "danger" | "success";
  items: string[];
  priority?: boolean;
}) {
  return (
    <Box className={priority ? "min-w-0 border-b border-default pb-[var(--space-4)]" : "min-w-0"}>
      <Flex className="items-center justify-between gap-[var(--space-2)]">
        <Box className="min-w-0">
          <Typography as="p" variant="bodySm" className="font-semibold">
            {title}
          </Typography>
          <Typography as="p" variant="caption" color="subtle" className="mt-[var(--space-0-5)]">
            {description}
          </Typography>
        </Box>
        <Badge variant={badgeVariant} size="sm" shape="rounded" className={badgeVariant === "secondary" ? QA_NEUTRAL_BADGE_CLASS : QA_STATUS_BADGE_CLASS}>
          {formatNumber(items.length)}
        </Badge>
      </Flex>
      <Box className="mt-[var(--space-3)] space-y-[var(--space-2)]">
        {items.map((item, index) => (
          <Box key={`${title}-${item}`}>
            <Flex className="items-start gap-[var(--space-2)]">
              <Typography as="span" variant="caption" color="subtle" className="w-[var(--space-5)] shrink-0 text-right font-semibold tabular-nums">
                {index + 1}
              </Typography>
              <Typography as="p" variant="caption" className="text-foreground/85">
                {item}
              </Typography>
            </Flex>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
