"use client";

import { RotateCcw, UploadCloud } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button, Checkbox, Flex, FormField, Grid, Input, Select, Textarea } from "@repo/ui";
import type { useAppForm } from "@repo/forms";
import {
  DEPLOYMENT_FORM_DEFAULT_VALUES,
  DEPLOYMENT_MONITORING_WINDOW_OPTIONS,
  DEPLOYMENT_SCOPE_OPTIONS,
  DEPLOYMENT_STATUS_OPTIONS
} from "../constants";
import type { DeploymentFormValues } from "../types";

type DeploymentRegisterFormInstance = ReturnType<typeof useAppForm<DeploymentFormValues>>;

type DeploymentRegisterFormProps = {
  form: DeploymentRegisterFormInstance;
  isSubmitting: boolean;
  onSubmit: (values: DeploymentFormValues) => void;
};

export function DeploymentRegisterForm({ form, isSubmitting, onSubmit }: DeploymentRegisterFormProps) {
  const t = useTranslations("deployments");
  const selectedScopeTags = form.watch("scopeTags") ?? [];
  const checklist = form.watch("checklist") ?? [];
  const scopeLabels = {
    frontend: t("form.scopeOptions.frontend"),
    api: t("form.scopeOptions.api"),
    db: t("form.scopeOptions.db"),
    infra: t("form.scopeOptions.infra"),
    auth: t("form.scopeOptions.auth"),
    payment: t("form.scopeOptions.payment")
  } as const;
  const checklistLabels = {
    "배포 전 알림 확인": t("form.checklistOptions.preDeployNotification"),
    "핵심 플로우 스모크 테스트": t("form.checklistOptions.smokeTest"),
    "배포 후 로그 모니터링": t("form.checklistOptions.postDeployMonitoring")
  } as const;

  const toggleScopeTag = (tag: string, checked: boolean) => {
    const current = form.getValues("scopeTags") ?? [];
    form.setValue(
      "scopeTags",
      checked ? Array.from(new Set([...current, tag])) : current.filter((item) => item !== tag),
      { shouldDirty: true }
    );
  };

  const toggleChecklist = (item: string, checked: boolean) => {
    const current = form.getValues("checklist") ?? [];
    form.setValue(
      "checklist",
      checked ? Array.from(new Set([...current, item])) : current.filter((entry) => entry !== item),
      { shouldDirty: true }
    );
  };

  return (
    <form className="grid gap-[var(--space-3)]" onSubmit={form.handleSubmit(onSubmit)}>
      <Grid className="gap-[var(--space-3)]">
        <FormField
          label={t("form.version")}
          htmlFor="deployment-version"
          size="sm"
          error={form.formState.errors.version?.message}
        >
          <Input
            id="deployment-version"
            {...form.register("version", {
              required: t("form.versionRequired"),
              minLength: { value: 3, message: t("form.versionMin") }
            })}
            placeholder={t("form.versionPlaceholder")}
            size="md"
          />
        </FormField>

        <FormField label={t("form.status")} htmlFor="deployment-status" size="sm">
          <Select options={[...DEPLOYMENT_STATUS_OPTIONS]} control={form.control} name="status" size="md" />
        </FormField>

        <FormField
          label={t("form.owner")}
          htmlFor="deployment-owner"
          size="sm"
          error={form.formState.errors.owner?.message}
        >
          <Input
            id="deployment-owner"
            {...form.register("owner", { required: t("form.ownerRequired") })}
            placeholder={t("form.ownerPlaceholder")}
            size="md"
          />
        </FormField>

        <FormField label={t("form.approver")} htmlFor="deployment-approver" size="sm">
          <Input
            id="deployment-approver"
            {...form.register("approver")}
            placeholder={t("form.approverPlaceholder")}
            size="md"
          />
        </FormField>

        <FormField label={t("form.ciUrl")} htmlFor="deployment-ci-url" size="sm">
          <Input
            id="deployment-ci-url"
            type="url"
            {...form.register("ciUrl")}
            placeholder="https://github.com/.../actions/runs/..."
            size="md"
          />
        </FormField>

        <FormField label={t("form.overrideReason")} htmlFor="deployment-override-reason" size="sm">
          <Textarea
            id="deployment-override-reason"
            {...form.register("overrideReason")}
            rows={2}
            resize="none"
            placeholder={t("form.overridePlaceholder")}
          />
        </FormField>

        <FormField label={t("form.scope")} htmlFor="deployment-scope" size="sm">
          <Flex id="deployment-scope" className="flex-wrap gap-x-[var(--space-3)] gap-y-[var(--space-2)]">
            {DEPLOYMENT_SCOPE_OPTIONS.map((option) => (
              <Checkbox
                key={option.value}
                size="sm"
                label={scopeLabels[option.value]}
                checked={selectedScopeTags.includes(option.value)}
                onCheckedChange={(checked) => toggleScopeTag(option.value, checked)}
              />
            ))}
          </Flex>
        </FormField>

        <FormField label={t("form.monitoringWindow")} htmlFor="deployment-monitoring-window" size="sm">
          <Select
            options={[...DEPLOYMENT_MONITORING_WINDOW_OPTIONS]}
            control={form.control}
            name="monitoringWindowMin"
            size="md"
          />
        </FormField>

        <FormField label={t("form.checklist")} htmlFor="deployment-checklist" size="sm">
          <Grid id="deployment-checklist" className="gap-[var(--space-2)]">
            {DEPLOYMENT_FORM_DEFAULT_VALUES.checklist.map((item) => (
              <Checkbox
                key={item}
                size="sm"
                label={checklistLabels[item as keyof typeof checklistLabels] ?? item}
                checked={checklist.includes(item)}
                onCheckedChange={(checked) => toggleChecklist(item, checked)}
              />
            ))}
          </Grid>
        </FormField>

        <FormField label={t("form.rollbackCriteria")} htmlFor="deployment-rollback-criteria" size="sm">
          <Textarea
            id="deployment-rollback-criteria"
            {...form.register("rollbackCriteria")}
            rows={2}
            resize="none"
            placeholder={t("form.rollbackPlaceholder")}
          />
        </FormField>

        <FormField
          label={t("form.changelog")}
          htmlFor="deployment-changelog"
          size="sm"
          error={form.formState.errors.changelog?.message}
        >
          <Textarea
            id="deployment-changelog"
            {...form.register("changelog", {
              required: t("form.changelogRequired"),
              minLength: { value: 12, message: t("form.changelogMin") }
            })}
            rows={4}
            resize="none"
            placeholder={t("form.changelogPlaceholder")}
          />
        </FormField>
      </Grid>

      <Flex className="justify-end gap-[var(--space-2)]">
        <Button
          type="button"
          variant="secondary"
          leftIcon={<RotateCcw />}
          disabled={isSubmitting || !form.formState.isDirty}
          onClick={() => form.reset(DEPLOYMENT_FORM_DEFAULT_VALUES)}
        >
          {t("form.reset")}
        </Button>
        <Button
          type="submit"
          variant="primary"
          leftIcon={<UploadCloud />}
          loading={isSubmitting ? true : undefined}
        >
          {t("form.submit")}
        </Button>
      </Flex>
    </form>
  );
}
