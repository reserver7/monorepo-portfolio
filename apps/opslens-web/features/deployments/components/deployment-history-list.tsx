"use client";

import { CheckCircle2, GitBranch, History } from "lucide-react";
import { Badge, Box, Button, Flex, StateView, Typography } from "@repo/ui";
import { formatDateTime } from "@repo/utils";
import { OpsCardListSkeleton } from "@/features";
import type { DeploymentItem } from "../types";
import { getDeploymentStatusLabel, getDeploymentStatusVariant } from "../utils/deployment-utils";

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
  if (isLoading) return <OpsCardListSkeleton count={5} />;
  if (isError) return <StateView variant="error" size="sm" title="배포 이력 조회에 실패했습니다." className="mt-[var(--space-3)]" />;
  if (deployments.length === 0) return <StateView variant="empty" size="sm" title="등록된 배포가 없습니다." className="mt-[var(--space-3)]" />;

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
              selected ? "border-primary/40 bg-primary/10" : "border-default bg-surface hover:bg-surface-elevated"
            }`}
          >
            <Box className="min-w-0 flex-1">
              <Flex className="items-start justify-between gap-[var(--space-3)]">
                <Box className="min-w-0">
                  <Flex className="min-w-0 items-center gap-[var(--space-2)]">
                    <GitBranch className="h-4 w-4 shrink-0 text-muted" />
                    <Typography as="span" variant="bodySm" className="truncate font-semibold">
                      {deployment.version}
                    </Typography>
                  </Flex>
                  <Typography as="p" variant="caption" color="subtle" className="mt-[var(--space-1)]">
                    {formatDateTime(deployment.deployedAt)}
                  </Typography>
                </Box>
                <Flex className="shrink-0 items-center gap-[var(--space-1)]">
                  {latest ? (
                    <Badge variant="secondary" size="sm" shape="rounded" className="border border-default bg-surface-elevated font-semibold">
                      최신
                    </Badge>
                  ) : null}
                  {selected ? <CheckCircle2 className="h-4 w-4 text-primary" /> : <History className="h-4 w-4 text-muted" />}
                </Flex>
              </Flex>
              <Flex className="mt-[var(--space-2)] flex-wrap items-center gap-[var(--space-1-5)]">
                <Badge variant={getDeploymentStatusVariant(deployment.status)} size="sm" shape="rounded" className="font-semibold">
                  {getDeploymentStatusLabel(deployment.status)}
                </Badge>
                <Badge variant="outline" size="sm" shape="rounded" className="bg-surface font-semibold">
                  담당 {deployment.owner}
                </Badge>
                <Badge variant="outline" size="sm" shape="rounded" className="bg-surface font-semibold">
                  {deployment.monitoringWindowMin}분
                </Badge>
              </Flex>
              {deployment.scopeTags.length > 0 ? (
                <Flex className="mt-[var(--space-2)] flex-wrap gap-[var(--space-1)]">
                  {deployment.scopeTags.map((tag) => (
                    <Badge key={tag} variant="secondary" size="sm" shape="rounded" className="border border-default bg-surface-elevated text-[11px] font-semibold">
                      {tag}
                    </Badge>
                  ))}
                </Flex>
              ) : null}
              <Typography as="p" variant="caption" color="muted" className="mt-[var(--space-2)] line-clamp-2 leading-[1.5]">
                {deployment.changelog}
              </Typography>
            </Box>
          </Button>
        );
      })}
    </Box>
  );
}
