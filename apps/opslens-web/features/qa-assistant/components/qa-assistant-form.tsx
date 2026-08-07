"use client";

import { RotateCcw, Sparkles } from "lucide-react";
import { Badge, Box, Button, Flex, FormField, Grid, Input, Select, Textarea, Typography } from "@repo/ui";
import type { useAppForm } from "@repo/forms";
import { QA_NEUTRAL_BADGE_CLASS, QA_SAMPLE_VALUES } from "../constants";
import type { QaFormValues, ReadinessItem } from "../types";

type QaAssistantFormInstance = ReturnType<typeof useAppForm<QaFormValues>>;

type QaAssistantFormProps = {
  form: QaAssistantFormInstance;
  isGenerating: boolean;
  onSubmit: (values: QaFormValues) => void;
  onReset: () => void;
  readinessItems: ReadinessItem[];
  readOnly?: boolean;
};

export function QaAssistantForm({
  form,
  isGenerating,
  onSubmit,
  onReset,
  readinessItems,
  readOnly = false
}: QaAssistantFormProps) {
  return (
    <form className="grid gap-[var(--space-3)]" onSubmit={form.handleSubmit(onSubmit)}>
      <Grid className="gap-[var(--space-3)] lg:grid-cols-[minmax(0,1fr)_220px]">
        <FormField label="기능/릴리즈 항목" htmlFor="qa-feature-name" size="sm" error={form.formState.errors.featureName?.message}>
          <Input
            id="qa-feature-name"
            {...form.register("featureName", {
              required: "기능 설명을 입력하세요.",
              minLength: { value: 8, message: "기능 설명을 8자 이상 입력하세요." }
            })}
            placeholder="예: 주문 상세 페이지 할인금액 표시 추가"
            size="sm"
          />
        </FormField>

        <FormField label="산출물 관점" htmlFor="qa-audience" size="sm">
          <Select
            options={[
              { label: "QA 중심", value: "qa" },
              { label: "개발자 중심", value: "developer" },
              { label: "PM/비개발자 중심", value: "pm" }
            ]}
            control={form.control}
            name="audience"
            size="sm"
          />
        </FormField>
      </Grid>

      <Grid className="gap-[var(--space-3)] lg:grid-cols-2">
        <FormField label="변경 화면/사용자 플로우" htmlFor="qa-changed-screens" size="sm" error={form.formState.errors.changedScreens?.message}>
          <Textarea
            id="qa-changed-screens"
            {...form.register("changedScreens", { required: "변경 화면을 입력하세요." })}
            rows={4}
            size="sm"
            resize="none"
            placeholder={"주문 상세\n결제 완료\n마이페이지"}
          />
        </FormField>

        <FormField label="관련 API/이벤트 계약" htmlFor="qa-related-apis" size="sm" error={form.formState.errors.relatedApis?.message}>
          <Textarea
            id="qa-related-apis"
            {...form.register("relatedApis", { required: "관련 API를 입력하세요." })}
            rows={4}
            size="sm"
            resize="none"
            className="font-mono text-caption"
            placeholder={"GET /orders/{id}\nGET /discounts/{id}"}
          />
        </FormField>
      </Grid>

      <FormField label="배포 노트/변경 맥락" htmlFor="qa-release-note" size="sm" error={form.formState.errors.releaseNote?.message}>
        <Textarea
          id="qa-release-note"
          {...form.register("releaseNote", {
            required: "배포 노트를 입력하세요.",
            minLength: { value: 20, message: "변경 맥락을 20자 이상 입력하세요." }
          })}
          rows={4}
          size="sm"
          resize="none"
          placeholder="필드 변경, 정책 변경, 예외 케이스, 롤백 조건을 함께 적어주세요."
        />
      </FormField>

      <Box className="border-t border-default pt-[var(--space-3)]">
        <Flex className="flex-wrap items-center gap-[var(--space-2)]">
          <Typography as="p" variant="caption" color="subtle" className="font-semibold">
            품질 게이트
          </Typography>
          {readinessItems.map((item) => (
            <Badge
              key={item.label}
              variant={item.ready ? "secondary" : "outline"}
              size="sm"
              shape="rounded"
              className={item.ready ? QA_NEUTRAL_BADGE_CLASS : "bg-surface font-semibold"}
            >
              {item.ready ? "✓" : "-"} {item.label}
            </Badge>
          ))}
        </Flex>
      </Box>

      <Flex className="flex-wrap items-center gap-[var(--space-2)]">
        <Button
          type="submit"
          variant="primary"
          size="sm"
          loading={isGenerating ? true : undefined}
          loadingLabel="시나리오 생성 중..."
          leftIcon={<Sparkles size={16} />}
          disabled={readOnly || isGenerating}
        >
          QA 시나리오 생성
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => form.reset(QA_SAMPLE_VALUES)}
          disabled={readOnly || isGenerating}
        >
          샘플 채우기
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          leftIcon={<RotateCcw size={16} />}
          onClick={onReset}
          disabled={readOnly || isGenerating}
        >
          초기화
        </Button>
      </Flex>
    </form>
  );
}
