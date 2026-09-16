"use client";

import { MetricCard } from "@/features/common/components/feedback-state";

import { useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Badge, Box, Flex, Grid, SplitWorkspaceLayout, Typography } from "@repo/ui";
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
  const t = useTranslations("qa.page");
  const locale = useLocale();
  const { canAdminister, canOperate } = useOpsPermissions();
  const form = useAppForm<QaFormValues>({
    defaultValues: QA_FORM_DEFAULT_VALUES
  });
  const watchedValues = form.watch();
  const changedScreenItems = useMemo(
    () => splitQaInputLines(watchedValues.changedScreens),
    [watchedValues.changedScreens]
  );
  const relatedApiItems = useMemo(
    () => splitQaInputLines(watchedValues.relatedApis),
    [watchedValues.relatedApis]
  );
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
            {t("title")}
          </Typography>
          <Flex className="flex-wrap items-center gap-[var(--space-2)]">
            <Badge variant="secondary" size="sm" shape="rounded" className={QA_NEUTRAL_BADGE_CLASS}>
              {t("audience", { value: QA_AUDIENCE_LABELS[watchedValues.audience] })}
            </Badge>
          </Flex>
        </Flex>
      </Box>

      <Grid className="gap-[var(--space-3)] md:grid-cols-3">
        <MetricCard
          label={t("readiness")}
          value={`${readinessScore}%`}
          helper={t("readinessHelper", {
            complete: readinessItems.filter((item) => item.ready).length,
            total: readinessItems.length
          })}
          color={readinessScore >= 75 ? "primary" : "default"}
          size="sm"
          className="h-full rounded-[var(--radius-lg)]"
        />
        <MetricCard
          label={t("inputScope")}
          value={formatNumber(changedScreenItems.length + relatedApiItems.length, locale)}
          helper={t("inputScopeHelper", {
            screens: formatNumber(changedScreenItems.length, locale),
            apis: formatNumber(relatedApiItems.length, locale)
          })}
          size="sm"
          className="h-full rounded-[var(--radius-lg)]"
        />
        <MetricCard
          label={t("selectedOutput")}
          value={formatNumber(selectedScenarioItemCount, locale)}
          helper={t("selectedOutputHelper", { count: formatNumber(scenarios.length, locale) })}
          size="sm"
          className="h-full rounded-[var(--radius-lg)]"
        />
      </Grid>

      <SplitWorkspaceLayout
        sidebarWidthClassName="xl:grid-cols-[minmax(0,1fr)_392px]"
        main={
          <Box className="space-y-[var(--stack-gap)]">
            <OpsSectionCard
              title={t("releaseInfo")}
              description={canOperate ? t("releaseInfoOperator") : t("readOnly")}
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
          <OpsSectionCard title={t("recentOutputs")} description={t("recentOutputsDescription")}>
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
