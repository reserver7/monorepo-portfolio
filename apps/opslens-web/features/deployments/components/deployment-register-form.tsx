"use client";

import { RotateCcw, UploadCloud } from "lucide-react";
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

export function DeploymentRegisterForm({
  form,
  isSubmitting,
  onSubmit
}: DeploymentRegisterFormProps) {
  const selectedScopeTags = form.watch("scopeTags") ?? [];
  const checklist = form.watch("checklist") ?? [];

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
        <FormField label="배포 버전" htmlFor="deployment-version" size="sm" error={form.formState.errors.version?.message}>
          <Input
            id="deployment-version"
            {...form.register("version", {
              required: "배포 버전을 입력하세요.",
              minLength: { value: 3, message: "배포 버전을 3자 이상 입력하세요." }
            })}
            placeholder="예: 2026.03.25-hotfix.1"
            size="md"
          />
        </FormField>

        <FormField label="배포 상태" htmlFor="deployment-status" size="sm">
          <Select options={[...DEPLOYMENT_STATUS_OPTIONS]} control={form.control} name="status" size="md" />
        </FormField>

        <FormField label="담당자" htmlFor="deployment-owner" size="sm" error={form.formState.errors.owner?.message}>
          <Input
            id="deployment-owner"
            {...form.register("owner", { required: "담당자를 입력하세요." })}
            placeholder="예: 운영담당자"
            size="md"
          />
        </FormField>

        <FormField label="승인자" htmlFor="deployment-approver" size="sm">
          <Input
            id="deployment-approver"
            {...form.register("approver")}
            placeholder="예: Tech Lead"
            size="md"
          />
        </FormField>

        <FormField label="CI / 배포 링크" htmlFor="deployment-ci-url" size="sm">
          <Input id="deployment-ci-url" type="url" {...form.register("ciUrl")} placeholder="https://github.com/.../actions/runs/..." size="md" />
        </FormField>

        <FormField label="Override 사유" htmlFor="deployment-override-reason" size="sm">
          <Textarea
            id="deployment-override-reason"
            {...form.register("overrideReason")}
            rows={2}
            resize="none"
            placeholder="차단 신호가 있는 경우 승인 배포가 필요한 이유를 기록하세요."
          />
        </FormField>

        <FormField label="변경 범위" htmlFor="deployment-scope" size="sm">
          <Flex id="deployment-scope" className="flex-wrap gap-x-[var(--space-3)] gap-y-[var(--space-2)]">
            {DEPLOYMENT_SCOPE_OPTIONS.map((option) => (
              <Checkbox
                key={option.value}
                size="sm"
                label={option.label}
                checked={selectedScopeTags.includes(option.value)}
                onCheckedChange={(checked) => toggleScopeTag(option.value, checked)}
              />
            ))}
          </Flex>
        </FormField>

        <FormField label="모니터링 윈도우" htmlFor="deployment-monitoring-window" size="sm">
          <Select
            options={[...DEPLOYMENT_MONITORING_WINDOW_OPTIONS]}
            control={form.control}
            name="monitoringWindowMin"
            size="md"
          />
        </FormField>

        <FormField label="배포 체크리스트" htmlFor="deployment-checklist" size="sm">
          <Grid id="deployment-checklist" className="gap-[var(--space-2)]">
            {DEPLOYMENT_FORM_DEFAULT_VALUES.checklist.map((item) => (
              <Checkbox
                key={item}
                size="sm"
                label={item}
                checked={checklist.includes(item)}
                onCheckedChange={(checked) => toggleChecklist(item, checked)}
              />
            ))}
          </Grid>
        </FormField>

        <FormField label="롤백 기준" htmlFor="deployment-rollback-criteria" size="sm">
          <Textarea
            id="deployment-rollback-criteria"
            {...form.register("rollbackCriteria")}
            rows={2}
            resize="none"
            placeholder="Critical 증가, 결제 실패, 로그인 장애 등 롤백 판단 기준"
          />
        </FormField>

        <FormField label="변경 요약" htmlFor="deployment-changelog" size="sm" error={form.formState.errors.changelog?.message}>
          <Textarea
            id="deployment-changelog"
            {...form.register("changelog", {
              required: "변경 요약을 입력하세요.",
              minLength: { value: 12, message: "변경 요약을 12자 이상 입력하세요." }
            })}
            rows={4}
            resize="none"
            placeholder="결제 모듈 null-safe 처리 및 세션 토큰 검증 로직 개선"
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
          초기화
        </Button>
        <Button
          type="submit"
          variant="primary"
          leftIcon={<UploadCloud />}
          loading={isSubmitting ? true : undefined}
        >
          배포 등록
        </Button>
      </Flex>
    </form>
  );
}
