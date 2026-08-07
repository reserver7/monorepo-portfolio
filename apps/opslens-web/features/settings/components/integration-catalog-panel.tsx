"use client";

import type { OpsSetting } from "@repo/opslens";
import { Badge, Box, Button, Flex, Grid, Typography } from "@repo/ui";

const integrations = [
  { id: "sentry", label: "Sentry", purpose: "에러 이벤트 수집", secret: "SENTRY_AUTH_TOKEN" },
  { id: "datadog", label: "Datadog", purpose: "메트릭·로그 수집", secret: "DATADOG_API_KEY" },
  { id: "cloudwatch", label: "CloudWatch", purpose: "AWS 운영 로그", secret: "AWS_ACCESS_KEY_ID" },
  { id: "grafana", label: "Grafana", purpose: "대시보드·알림", secret: "GRAFANA_SERVICE_ACCOUNT_TOKEN" },
  { id: "slack", label: "Slack", purpose: "인시던트 알림", secret: "SLACK_WEBHOOK_URL" },
  { id: "jira", label: "Jira", purpose: "이슈·Postmortem 동기화", secret: "JIRA_API_TOKEN" },
  { id: "linear", label: "Linear", purpose: "이슈·프로젝트 동기화", secret: "LINEAR_API_KEY" },
  { id: "github", label: "GitHub Actions", purpose: "배포 이벤트", secret: "GITHUB_TOKEN" },
  { id: "vercel", label: "Vercel", purpose: "웹 배포 이벤트", secret: "VERCEL_TOKEN" },
  { id: "render", label: "Render", purpose: "서버 배포 이벤트", secret: "RENDER_API_KEY" }
];

const enabledFor = (settings: OpsSetting[], id: string): boolean => {
  const setting = settings.find((item) => item.key === `integration.${id}`);
  if (!setting) return false;
  try {
    return Boolean((JSON.parse(setting.value) as { enabled?: boolean }).enabled);
  } catch {
    return false;
  }
};

export function IntegrationCatalogPanel({
  settings,
  isAdmin,
  pendingId,
  onSetEnabled
}: {
  settings: OpsSetting[];
  isAdmin: boolean;
  pendingId?: string;
  onSetEnabled: (id: string, enabled: boolean) => void;
}) {
  return (
    <Grid className="gap-[var(--space-3)] md:grid-cols-2 xl:grid-cols-4">
      {integrations.map((integration) => {
        const enabled = enabledFor(settings, integration.id);
        return (
          <Box key={integration.id} className="border-default bg-surface rounded-[var(--radius-lg)] border p-[var(--space-3)]">
            <Flex className="items-start justify-between gap-[var(--space-2)]">
              <Box>
                <Typography as="p" variant="bodySm" className="font-semibold">{integration.label}</Typography>
                <Typography as="p" variant="caption" color="muted" className="mt-[var(--space-1)]">{integration.purpose}</Typography>
              </Box>
              <Badge size="sm" variant={enabled ? "success" : "outline"}>{enabled ? "준비됨" : "대기"}</Badge>
            </Flex>
            <Typography as="p" variant="caption" color="subtle" className="mt-[var(--space-3)] break-all">필요 secret: {integration.secret}</Typography>
            {isAdmin ? <Button type="button" variant={enabled ? "secondary" : "primary"} size="sm" className="mt-[var(--space-3)] w-full" loading={pendingId === integration.id} onClick={() => onSetEnabled(integration.id, !enabled)}>{enabled ? "준비 해제" : "연동 준비"}</Button> : null}
          </Box>
        );
      })}
    </Grid>
  );
}
