"use client";

import { Box, Button, Flex, FormField, Grid, Input, Select, Spinner, SplitWorkspaceLayout, StateView, Textarea } from "@repo/ui";
import { useMutation, useQuery, useQueryClient } from "@repo/react-query";
import { useAppForm } from "@repo/forms";
import { generateQaScenario, getRecentQaScenarios } from "@repo/opslens";
import { OpsCardListSkeleton, OpsPageShell, OpsSectionCard } from "@/features";
import { formatDateTime } from "@repo/utils";
import { opslensQueryKeys } from "@repo/opslens";

type QaFormValues = {
  featureName: string;
  changedScreens: string;
  relatedApis: string;
  releaseNote: string;
  audience: "developer" | "pm" | "qa";
};

export default function QaAssistantPage() {
  const queryClient = useQueryClient();

  const form = useAppForm<QaFormValues>({
    defaultValues: {
      featureName: "",
      changedScreens: "",
      relatedApis: "",
      releaseNote: "",
      audience: "qa"
    }
  });

  const scenariosQuery = useQuery({
    queryKey: opslensQueryKeys.qaScenarios(),
    staleTime: 10 * 1000,
    queryFn: getRecentQaScenarios
  });

  const generateMutation = useMutation({
    mutationFn: (values: QaFormValues) =>
      generateQaScenario({
        featureName: values.featureName,
        changedScreens: values.changedScreens,
        relatedApis: values.relatedApis,
        releaseNote: values.releaseNote,
        audience: values.audience
      }),
    onSuccess: async () => {
      form.reset({
        featureName: "",
        changedScreens: "",
        relatedApis: "",
        releaseNote: "",
        audience: "qa"
      });
      await queryClient.invalidateQueries({ queryKey: opslensQueryKeys.qaScenarios() });
    }
  });

  return (
    <OpsPageShell>
      <SplitWorkspaceLayout
        sidebarWidthClassName="xl:grid-cols-[minmax(0,1fr)_420px]"
        main={
          <OpsSectionCard
            title="QA 자동화 지원"
            description="기능 변경 정보를 입력하면 테스트 시나리오/위험 포인트/회귀 대상을 자동 생성합니다."
          >
            <form className="grid gap-[var(--space-3)]" onSubmit={form.handleSubmit((values) => generateMutation.mutate(values))}>
              <FormField label="기능 설명" htmlFor="qa-feature-name" size="sm">
                <Input
                  id="qa-feature-name"
                  {...form.register("featureName", { required: true })}
                  placeholder="예: 주문 상세 페이지 할인금액 표시 추가"
                  size="md"
                />
              </FormField>

              <FormField label="변경 화면" htmlFor="qa-changed-screens" size="sm">
                <Textarea
                  id="qa-changed-screens"
                  {...form.register("changedScreens", { required: true })}
                  rows={3}
                  placeholder="주문 상세, 결제 완료, 마이페이지"
                />
              </FormField>

              <FormField label="관련 API" htmlFor="qa-related-apis" size="sm">
                <Textarea
                  id="qa-related-apis"
                  {...form.register("relatedApis", { required: true })}
                  rows={2}
                  placeholder="GET /orders/{id}, GET /discounts/{id}"
                />
              </FormField>

              <FormField label="배포 노트" htmlFor="qa-release-note" size="sm">
                <Textarea
                  id="qa-release-note"
                  {...form.register("releaseNote", { required: true })}
                  rows={4}
                  placeholder="할인 금액 필드가 optional -> required로 변경"
                />
              </FormField>

              <FormField label="요약 대상" htmlFor="qa-audience" size="sm">
                <Select
                  options={[
                    { label: "QA 중심", value: "qa" },
                    { label: "개발자 중심", value: "developer" },
                    { label: "비개발자/PM 중심", value: "pm" }
                  ]}
                  control={form.control}
                  name="audience"
                  size="md"
                />
              </FormField>

              <Button
                type="submit"
                variant="primary"
                className="w-fit"
                loading={generateMutation.isPending ? true : undefined}
              >
                QA 시나리오 생성
              </Button>
            </form>
          </OpsSectionCard>
        }
        sidebar={
          <OpsSectionCard title="최근 생성된 QA 시나리오">
            {scenariosQuery.isLoading ? (
              <OpsCardListSkeleton count={3} />
            ) : scenariosQuery.isError ? (
              <StateView variant="error" size="sm" title="시나리오 조회에 실패했습니다." className="mt-[var(--space-3)]" />
            ) : (scenariosQuery.data?.length ?? 0) === 0 ? (
              <StateView variant="empty" size="sm" title="아직 생성된 시나리오가 없습니다." className="mt-[var(--space-3)]" />
            ) : (
              <Box className="mt-[var(--space-3)] space-y-[var(--space-3)]">
                {scenariosQuery.data?.map((scenario) => (
                  <article key={scenario.id} className="border-default rounded-xl border p-[var(--space-4)]">
                    <Flex className="flex-wrap items-center justify-between gap-[var(--space-2)]">
                      <Box as="p" className="text-foreground font-semibold">{scenario.featureName}</Box>
                      <Box as="p" className="text-muted-foreground text-caption">{formatDateTime(scenario.createdAt)}</Box>
                    </Flex>

                    <Box as="p" className="text-muted-foreground mt-[var(--space-1)] text-caption">대상: {scenario.audience}</Box>

                    <Grid className="mt-[var(--space-3)] gap-[var(--space-3)]">
                      <ListBlock title="테스트 케이스" items={scenario.generatedCases} />
                      <ListBlock title="리스크 포인트" items={scenario.riskPoints} />
                      <ListBlock title="회귀 대상" items={scenario.regressionTargets} />
                    </Grid>
                  </article>
                ))}
              </Box>
            )}
          </OpsSectionCard>
        }
      />

      <Spinner open={generateMutation.isPending} fullscreen size="lg" color="primary" />
    </OpsPageShell>
  );
}

function ListBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <Box className="border-default bg-surface-elevated rounded-lg border p-[var(--space-3)]">
      <Box as="p" className="text-muted-foreground text-caption font-semibold uppercase tracking-wide">{title}</Box>
      <ul className="text-foreground/85 mt-[var(--space-2)] list-disc space-y-[var(--space-1)] pl-[var(--space-4)] text-caption">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </Box>
  );
}
