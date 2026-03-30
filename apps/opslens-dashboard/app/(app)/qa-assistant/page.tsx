"use client";

import { Button, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Textarea } from "@repo/ui";
import { useMutation, useQuery, useQueryClient } from "@repo/react-query";
import { useForm } from "react-hook-form";
import { generateQaScenario, getRecentQaScenarios } from "@/lib/api";
import { OpsSectionCard } from "@/components/opslens";
import { formatDateTime } from "@/lib/utils";

type QaFormValues = {
  featureName: string;
  changedScreens: string;
  relatedApis: string;
  releaseNote: string;
  audience: "developer" | "pm" | "qa";
};

export default function QaAssistantPage() {
  const queryClient = useQueryClient();

  const form = useForm<QaFormValues>({
    defaultValues: {
      featureName: "",
      changedScreens: "",
      relatedApis: "",
      releaseNote: "",
      audience: "qa"
    }
  });

  const scenariosQuery = useQuery({
    queryKey: ["opslens", "qa-scenarios"],
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
      await queryClient.invalidateQueries({ queryKey: ["opslens", "qa-scenarios"] });
    }
  });

  return (
    <div className="space-y-5">
      <OpsSectionCard
        title="QA 자동화 지원"
        description="기능 변경 정보를 입력하면 테스트 시나리오/위험 포인트/회귀 대상이 자동 생성됩니다."
      >

        <form className="grid gap-3" onSubmit={form.handleSubmit((values) => generateMutation.mutate(values))}>
          <div className="grid gap-1 text-sm">
            <Label htmlFor="qa-feature-name">기능 설명</Label>
            <Input
              id="qa-feature-name"
              {...form.register("featureName", { required: true })}
              placeholder="예: 주문 상세 페이지 할인금액 표시 추가"
            />
          </div>

          <div className="grid gap-1 text-sm">
            <Label htmlFor="qa-changed-screens">변경 화면</Label>
            <Textarea
              id="qa-changed-screens"
              {...form.register("changedScreens", { required: true })}
              rows={3}
              placeholder="주문 상세, 결제 완료, 마이페이지"
            />
          </div>

          <div className="grid gap-1 text-sm">
            <Label htmlFor="qa-related-apis">관련 API</Label>
            <Textarea
              id="qa-related-apis"
              {...form.register("relatedApis", { required: true })}
              rows={2}
              placeholder="GET /orders/{id}, GET /discounts/{id}"
            />
          </div>

          <div className="grid gap-1 text-sm">
            <Label htmlFor="qa-release-note">배포 노트</Label>
            <Textarea
              id="qa-release-note"
              {...form.register("releaseNote", { required: true })}
              rows={4}
              placeholder="할인 금액 필드가 optional -> required로 변경"
            />
          </div>

          <div className="grid gap-1 text-sm">
            <Label htmlFor="qa-audience">요약 대상</Label>
            <Select
              value={form.watch("audience")}
              onValueChange={(value) => form.setValue("audience", value as QaFormValues["audience"])}
            >
              <SelectTrigger id="qa-audience">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="qa">QA 중심</SelectItem>
                <SelectItem value="developer">개발자 중심</SelectItem>
                <SelectItem value="pm">비개발자/PM 중심</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            type="submit"
            disabled={generateMutation.isPending}
            className="w-fit bg-primary hover:opacity-90"
          >
            {generateMutation.isPending ? "생성 중..." : "QA 시나리오 생성"}
          </Button>
        </form>
      </OpsSectionCard>

      <OpsSectionCard title="최근 생성된 QA 시나리오">

        {scenariosQuery.isLoading ? (
          <p className="mt-3 text-sm text-muted">시나리오를 불러오는 중...</p>
        ) : scenariosQuery.isError ? (
          <p className="mt-3 text-sm text-danger">시나리오 조회에 실패했습니다.</p>
        ) : (scenariosQuery.data?.length ?? 0) === 0 ? (
          <p className="mt-3 text-sm text-muted">아직 생성된 시나리오가 없습니다.</p>
        ) : (
          <div className="mt-3 space-y-3">
            {scenariosQuery.data?.map((scenario) => (
              <article key={scenario.id} className="rounded-lg border border-default p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold text-foreground">{scenario.featureName}</p>
                  <p className="text-xs text-muted-foreground">{formatDateTime(scenario.createdAt)}</p>
                </div>

                <p className="mt-1 text-xs text-muted-foreground">대상: {scenario.audience}</p>

                <div className="mt-3 grid gap-3 md:grid-cols-3">
                  <ListBlock title="테스트 케이스" items={scenario.generatedCases} />
                  <ListBlock title="리스크 포인트" items={scenario.riskPoints} />
                  <ListBlock title="회귀 대상" items={scenario.regressionTargets} />
                </div>
              </article>
            ))}
          </div>
        )}
      </OpsSectionCard>
    </div>
  );
}

function ListBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-lg border border-default bg-surface-elevated p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{title}</p>
      <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-muted">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
