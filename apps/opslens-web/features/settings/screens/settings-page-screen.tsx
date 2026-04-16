"use client";

import { useMemo } from "react";
import { Grid, Textarea } from "@repo/ui";
import { OpsInfoItem, OpsPageShell, OpsSectionCard } from "@/features";
import { useOpsFilterStore } from "@/features/stores";
import { opslensClientEnv } from "@/lib/config";

export default function SettingsPage() {
  const environment = useOpsFilterStore((state) => state.environment);
  const serviceName = useOpsFilterStore((state) => state.serviceName);
  const search = useOpsFilterStore((state) => state.search);

  const envPreview = useMemo(
    () =>
      [
        `NEXT_PUBLIC_APP_TITLE=${opslensClientEnv.appTitle}`,
        `NEXT_PUBLIC_APP_URL=${opslensClientEnv.appUrl}`,
        `NEXT_PUBLIC_API_URL=${opslensClientEnv.apiUrl}`,
        "",
        "# API 서버(.env)",
        "DATABASE_URL=postgresql://...",
        "AI_PROVIDER=gemini",
        "GEMINI_API_KEY=...",
        "GEMINI_MODEL=gemini-2.0-flash"
      ].join("\n"),
    [opslensClientEnv.apiUrl, opslensClientEnv.appTitle, opslensClientEnv.appUrl]
  );

  return (
    <OpsPageShell>
      <OpsSectionCard
        title="프로젝트 설정"
        description="현재 필터 상태와 API 연결 정보를 확인할 수 있습니다."
      >
        <Grid className="gap-3 md:grid-cols-3">
          <OpsInfoItem label="환경" value={environment} />
          <OpsInfoItem label="서비스" value={serviceName} />
          <OpsInfoItem label="검색어" value={search || "(없음)"} />
        </Grid>
      </OpsSectionCard>

      <OpsSectionCard
        title="환경 변수 예시"
        description="프론트/백엔드 배포 시 아래 키를 기준으로 설정하세요."
      >
        <Textarea readOnly value={envPreview} rows={10} className="bg-surface-elevated font-mono text-caption" />
      </OpsSectionCard>

      <OpsSectionCard title="운영 확장 TODO">
        <ul className="text-muted list-disc space-y-1 pl-5 text-sm">
          <li>Slack/Jira API 연동 토큰 연결</li>
          <li>Sentry/Datadog Webhook 수집 파이프라인 추가</li>
          <li>권한 모델(RBAC)과 감사 로그 적용</li>
          <li>리포트 예약 발송(매일/매주) 자동화</li>
        </ul>
      </OpsSectionCard>
    </OpsPageShell>
  );
}
