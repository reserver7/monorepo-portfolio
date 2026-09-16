"use client";

import { FeedbackState } from "@/features/common/components/feedback-state";

import { CheckCircle2, GitBranch, History } from "lucide-react";
import { Badge, Box, Button, Flex, Typography } from "@repo/ui";
import { formatDateTime } from "@repo/utils";
import { OpsCardListSkeleton } from "@/features";
import type { DeploymentItem } from "../types";
import { getDeploymentStatusVariant } from "../utils/deployment-utils";

type DeploymentHistoryListProps = {
  deployments: DeploymentItem[];
  isError: boolean;
  isLoading: boolean;
  latestVersion?: string;
  selectedVersion?: string;
  onSelectVersion: (version: string) => void;
};

export function DeploymentHistoryList({
  deployments,
  isError,
  isLoading,
  latestVersion,
  selectedVersion,
  onSelectVersion
}: DeploymentHistoryListProps) {
  const locale = useLocale();
  const t = useTranslations("deployments");
  const statusLabels = {
    planned: t("status.planned"),
    deploying: t("status.deploying"),
    completed: t("status.completed"),
    failed: t("status.failed"),
    rolled_back: t("status.rolledBack")
  } as const;
  if (isLoading) return <OpsCardListSkeleton count={5} />;
  if (isError) return <FeedbackState variant="error" size="sm" title="배포 이력 조회에 실패했습니다." className="mt-[var(--space-3)]" />;
  if (deployments.length === 0) return <FeedbackState variant="empty" size="sm" title="등록된 배포가 없습니다." className="mt-[var(--space-3)]" />;

  return (
    <Box className="mt-[var(--space-3)] space-y-[var(--space-2)]">
      {deployments.map((deployment) => {
        const selected = selectedVersion === deployment.version;
        const latest = latestVersion === deployment.version;

        return (
          <Button
            key={deployment.id}
            type="button"
            variant="ghost"
            onClick={() => onSelectVersion(deployment.version)}
            className={`h-auto w-full justify-start rounded-[var(--radius-md)] border p-[var(--space-3)] text-left ${
              selected
                ? "border-primary/40 bg-primary/10"
                : "border-default bg-surface hover:bg-surface-elevated"
            }`}
          >
            <Box className="min-w-0 flex-1">
              <Flex className="items-start justify-between gap-[var(--space-3)]">
                <Box className="min-w-0">
                  <Flex className="min-w-0 items-center gap-[var(--space-2)]">
                    <GitBranch className="text-muted h-4 w-4 shrink-0" />
                    <Typography as="span" variant="bodySm" className="truncate font-semibold">
                      {deployment.version}
                    </Typography>
                  </Flex>
                  <Typography as="p" variant="caption" color="subtle" className="mt-[var(--space-1)]">
                    {formatDateTime(deployment.deployedAt, locale)}
                  </Typography>
                </Box>
                <Flex className="shrink-0 items-center gap-[var(--space-1)]">
                  {latest ? (
                    <Badge
                      variant="secondary"
                      size="sm"
                      shape="rounded"
                      className="border-default bg-surface-elevated border font-semibold"
                    >
                      {t("history.latest")}
                    </Badge>
                  ) : null}
                  {selected ? (
                    <CheckCircle2 className="text-primary h-4 w-4" />
                  ) : (
                    <History className="text-muted h-4 w-4" />
                  )}
                </Flex>
              </Flex>
              <Flex className="mt-[var(--space-2)] flex-wrap items-center gap-[var(--space-1-5)]">
                <Badge
                  variant={getDeploymentStatusVariant(deployment.status)}
                  size="sm"
                  shape="rounded"
                  className="font-semibold"
                >
                  {statusLabels[deployment.status as keyof typeof statusLabels] ?? deployment.status}
                </Badge>
                <Badge variant="outline" size="sm" shape="rounded" className="bg-surface font-semibold">
                  {t("owner", { owner: deployment.owner })}
                </Badge>
                <Badge variant="outline" size="sm" shape="rounded" className="bg-surface font-semibold">
                  {t("minutes", { count: deployment.monitoringWindowMin })}
                </Badge>
              </Flex>
              {deployment.scopeTags.length > 0 ? (
                <Flex className="mt-[var(--space-2)] flex-wrap gap-[var(--space-1)]">
                  {deployment.scopeTags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      size="sm"
                      shape="rounded"
                      className="border-default bg-surface-elevated border text-[11px] font-semibold"
                    >
                      {tag}
                    </Badge>
                  ))}
                </Flex>
              ) : null}
              <Typography
                as="p"
                variant="caption"
                color="muted"
                className="mt-[var(--space-2)] line-clamp-2 leading-[1.5]"
              >
                {deployment.changelog}
              </Typography>
            </Box>
          </Button>
        );
      })}
    </Box>
  );
}
