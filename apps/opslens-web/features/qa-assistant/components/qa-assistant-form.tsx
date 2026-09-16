"use client";

import { RotateCcw, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
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
  const t = useTranslations("qa.form");
  return (
    <form className="grid gap-[var(--space-3)]" onSubmit={form.handleSubmit(onSubmit)}>
      <Grid className="gap-[var(--space-3)] lg:grid-cols-[minmax(0,1fr)_220px]">
        <FormField
          label={t("feature")}
          htmlFor="qa-feature-name"
          size="sm"
          error={form.formState.errors.featureName?.message}
        >
          <Input
            id="qa-feature-name"
            {...form.register("featureName", {
              required: t("featureRequired"),
              minLength: { value: 8, message: t("featureMin") }
            })}
            placeholder={t("featurePlaceholder")}
            size="sm"
          />
        </FormField>

        <FormField label={t("audience")} htmlFor="qa-audience" size="sm">
          <Select
            options={[
              { label: t("audienceQa"), value: "qa" },
              { label: t("audienceDeveloper"), value: "developer" },
              { label: t("audiencePm"), value: "pm" }
            ]}
            control={form.control}
            name="audience"
            size="sm"
          />
        </FormField>
      </Grid>

      <Grid className="gap-[var(--space-3)] lg:grid-cols-2">
        <FormField
          label={t("changedScreens")}
          htmlFor="qa-changed-screens"
          size="sm"
          error={form.formState.errors.changedScreens?.message}
        >
          <Textarea
            id="qa-changed-screens"
            {...form.register("changedScreens", { required: t("changedScreensRequired") })}
            rows={4}
            size="sm"
            resize="none"
            placeholder={"주문 상세\n결제 완료\n마이페이지"}
          />
        </FormField>

        <FormField
          label={t("relatedApis")}
          htmlFor="qa-related-apis"
          size="sm"
          error={form.formState.errors.relatedApis?.message}
        >
          <Textarea
            id="qa-related-apis"
            {...form.register("relatedApis", { required: t("relatedApisRequired") })}
            rows={4}
            size="sm"
            resize="none"
            className="text-caption font-mono"
            placeholder={"GET /orders/{id}\nGET /discounts/{id}"}
          />
        </FormField>
      </Grid>

      <FormField
        label={t("releaseNote")}
        htmlFor="qa-release-note"
        size="sm"
        error={form.formState.errors.releaseNote?.message}
      >
        <Textarea
          id="qa-release-note"
          {...form.register("releaseNote", {
            required: t("releaseNoteRequired"),
            minLength: { value: 20, message: t("releaseNoteMin") }
          })}
          rows={4}
          size="sm"
          resize="none"
          placeholder={t("releaseNotePlaceholder")}
        />
      </FormField>

      <Box className="border-default border-t pt-[var(--space-3)]">
        <Flex className="flex-wrap items-center gap-[var(--space-2)]">
          <Typography as="p" variant="caption" color="subtle" className="font-semibold">
            {t("qualityGate")}
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
          loadingLabel={t("generating")}
          leftIcon={<Sparkles size={16} />}
          disabled={readOnly || isGenerating}
        >
          {t("generate")}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => form.reset(QA_SAMPLE_VALUES)}
          disabled={readOnly || isGenerating}
        >
          {t("sample")}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          leftIcon={<RotateCcw size={16} />}
          onClick={onReset}
          disabled={readOnly || isGenerating}
        >
          {t("reset")}
        </Button>
      </Flex>
    </form>
  );
}
