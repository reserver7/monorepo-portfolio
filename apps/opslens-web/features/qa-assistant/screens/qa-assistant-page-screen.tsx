"use client";

import { useMemo } from "react";
import { Badge, Box, Flex, Grid, SplitWorkspaceLayout, StatCard, Typography } from "@repo/ui";
import { useAppForm } from "@repo/forms";
import { formatNumber } from "@repo/utils";
import { OpsPageShell, OpsSectionCard } from "@/features";
import { useOpsPermissions } from "@/features/common/hooks/use-ops-permissions";
import { QaAssistantForm, QaScenarioDetail, QaScenarioList } from "../components";
import { QA_AUDIENCE_LABELS, QA_FORM_DEFAULT_VALUES, QA_NEUTRAL_BADGE_CLASS } from "../constants";
import { useQaAssistantScenarios } from "../hooks/use-qa-assistant-scenarios";
import type { QaFormValues } from "../types";
import {
  getQaReadinessItems,
  getQaReadinessScore,
  getQaScenarioItemCount,
  splitQaInputLines
} from "../utils/qa-assistant-utils";

export default function QaAssistantPage() {
  const { canAdminister, canOperate } = useOpsPermissions();
  const form = useAppForm<QaFormValues>({
    defaultValues: QA_FORM_DEFAULT_VALUES
  });
  const watchedValues = form.watch();
  const changedScreenItems = useMemo(() => splitQaInputLines(watchedValues.changedScreens), [watchedValues.changedScreens]);
  const relatedApiItems = useMemo(() => splitQaInputLines(watchedValues.relatedApis), [watchedValues.relatedApis]);
  const readinessItems = useMemo(
    () => getQaReadinessItems(watchedValues, changedScreenItems, relatedApiItems),
    [changedScreenItems, relatedApiItems, watchedValues]
  );
  const readinessScore = getQaReadinessScore(readinessItems);

  const {
    deleteMutation,
    generateMutation,
    requestDeleteScenario,
    scenarios,
    scenariosQuery,
    selectedScenario,
    selectedScenarioId,
    setSelectedScenarioId
  } = useQaAssistantScenarios();
  const selectedScenarioItemCount = selectedScenario ? getQaScenarioItemCount(selectedScenario) : 0;

  return (
    <OpsPageShell>
      <Box className="border-default bg-surface rounded-[var(--radius-xl)] border px-[var(--space-4)] py-[var(--space-3)] md:px-[var(--space-5)]">
        <Flex className="items-center justify-between gap-[var(--space-3)]">
          <Typography as="h2" variant="headingMd" className="tracking-[-0.01em]">
            QA 릴리즈 어시스턴트
          </Typography>
          <Flex className="flex-wrap items-center gap-[var(--space-2)]">
            <Badge variant="secondary" size="sm" shape="rounded" className={QA_NEUTRAL_BADGE_CLASS}>
              대상: {QA_AUDIENCE_LABELS[watchedValues.audience]}
            </Badge>
          </Flex>
        </Flex>
      </Box>

      <Grid className="gap-[var(--space-3)] md:grid-cols-3">
        <StatCard
          label="준비도"
          value={`${readinessScore}%`}
          helper={`${readinessItems.filter((item) => item.ready).length}/${readinessItems.length} 조건 충족`}
          color={readinessScore >= 75 ? "primary" : "default"}
          size="sm"
          className="h-full rounded-[var(--radius-lg)]"
        />
        <StatCard
          label="입력 범위"
          value={formatNumber(changedScreenItems.length + relatedApiItems.length)}
          helper={`화면 ${formatNumber(changedScreenItems.length)} / API ${formatNumber(relatedApiItems.length)}`}
          size="sm"
          className="h-full rounded-[var(--radius-lg)]"
        />
        <StatCard
          label="선택 산출물"
          value={formatNumber(selectedScenarioItemCount)}
          helper={`최근 산출물 ${formatNumber(scenarios.length)}건`}
          size="sm"
          className="h-full rounded-[var(--radius-lg)]"
        />
      </Grid>

      <SplitWorkspaceLayout
        sidebarWidthClassName="xl:grid-cols-[minmax(0,1fr)_392px]"
        main={
          <Box className="space-y-[var(--stack-gap)]">
            <OpsSectionCard
              title="릴리즈 변경 정보"
              description={canOperate ? "QA가 바로 실행할 수 있도록 화면, API, 변경 맥락을 함께 입력합니다." : "조회 전용 역할에서는 QA 산출물을 생성할 수 없습니다."}
              contentClassName="pt-[var(--space-2)]"
            >
              <QaAssistantForm
                form={form}
                isGenerating={generateMutation.isPending}
                onSubmit={(values) => generateMutation.mutate(values)}
                onReset={() => form.reset(QA_FORM_DEFAULT_VALUES)}
                readinessItems={readinessItems}
                readOnly={!canOperate}
              />
            </OpsSectionCard>

            <QaScenarioDetail scenario={selectedScenario} />
          </Box>
        }
        sidebar={
          <OpsSectionCard title="최근 QA 산출물" description="최신 생성 결과를 선택해 테스트 실행 단위로 검토합니다.">
            <QaScenarioList
              isError={scenariosQuery.isError}
              isLoading={scenariosQuery.isLoading}
              isDeleting={deleteMutation.isPending}
              scenarios={scenarios}
              selectedScenarioId={selectedScenarioId}
              onSelectScenario={setSelectedScenarioId}
              onDeleteScenario={(scenario) => {
                if (!canAdminister) return;
                void requestDeleteScenario(scenario);
              }}
            />
          </OpsSectionCard>
        }
      />
    </OpsPageShell>
  );
}
