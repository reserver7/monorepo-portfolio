"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Badge, Box, Button, Flex, Grid, StateView, StatCard, Typography } from "@repo/ui";
import { useQuery } from "@repo/react-query";
import { getDeployments, getLogSourceFreshness, getOpsSettings, getServiceSlo, listIssues, opslensQueryKeys } from "@repo/opslens";
import { OpsPageShell, OpsSectionCard, OpsSectionSkeleton, SeverityBadge } from "@/features";
import { useOpsQueryOptions } from "@/features/common/hooks/use-ops-query-options";
import { useOpsFilters } from "@/features/common/stores";
import { formatDateTime, formatNumber } from "@repo/utils";

type CatalogService = { name?: string; owner?: string; onCall?: string; runbook?: string; slo?: string; repository?: string; dashboard?: string; dependencies?: string };

export default function ServiceDetailPage() {
  const params = useParams<{ name: string }>();
  const serviceName = decodeURIComponent(params.name ?? "");
  const { environment } = useOpsFilters();
  const issueFilter = { environment, serviceName, search: "", status: "all" as const, severity: "all" as const, page: 1 };
  const issuesQuery = useQuery(useOpsQueryOptions("list", { queryKey: opslensQueryKeys.issues(issueFilter), queryFn: () => listIssues({ environment, serviceName, page: 1, pageSize: 50 }) }));
  const deploymentsQuery = useQuery(useOpsQueryOptions("list", { queryKey: opslensQueryKeys.deployments(environment), queryFn: () => getDeployments(environment) }));
  const settingsQuery = useQuery(useOpsQueryOptions("default", { queryKey: opslensQueryKeys.settings(), queryFn: getOpsSettings }));
  const freshnessQuery = useQuery(useOpsQueryOptions("default", { queryKey: opslensQueryKeys.logSourceFreshness(), queryFn: getLogSourceFreshness, refetchInterval: 30_000 }));
  const sloQuery = useQuery(useOpsQueryOptions("default", { queryKey: opslensQueryKeys.serviceSlo(serviceName, environment), queryFn: () => getServiceSlo(serviceName, environment), refetchInterval: 60_000 }));
  const issues = issuesQuery.data?.items ?? [];
  const openIssues = issues.filter((issue) => issue.status !== "resolved");
  const criticalHigh = openIssues.filter((issue) => issue.severity === "critical" || issue.severity === "high");
  const slaRisk = openIssues.filter((issue) => issue.slaDueAt && new Date(issue.slaDueAt).getTime() < Date.now());
  const catalog = (() => { try { return JSON.parse(settingsQuery.data?.find((item) => item.key === "service.catalog")?.value ?? "{}") as { services?: CatalogService[] }; } catch { return {}; } })();
  const service = catalog.services?.find((item) => item.name === serviceName);
  const latestDeployment = deploymentsQuery.data?.find((item) => item.scopeTags.some((tag) => tag === serviceName || tag.includes(serviceName)));
  const budgetRisk = sloQuery.data?.budgetConsumed ?? Math.min(100, criticalHigh.length * 35 + slaRisk.length * 20 + Math.max(0, openIssues.length - criticalHigh.length) * 8);
  const staleSources = (freshnessQuery.data ?? []).filter((item) => item.serviceName === serviceName && item.stale);

  if (issuesQuery.isLoading || settingsQuery.isLoading) return <OpsSectionSkeleton rows={6} className="p-[var(--space-5)]" />;
  if (issuesQuery.isError) return <StateView variant="error" size="lg" title="서비스 운영 데이터를 불러오지 못했습니다." />;

  return <OpsPageShell>
    <OpsSectionCard title={`${serviceName} 서비스 운영`} description={`${environment} 환경 기준의 인시던트, 배포, SLO 운영 현황입니다.`}>
      <Flex className="flex-wrap items-center gap-[var(--space-2)]"><Badge size="sm" variant={criticalHigh.length > 0 ? "danger" : openIssues.length > 0 ? "warning" : "success"}>{criticalHigh.length > 0 ? "인시던트" : openIssues.length > 0 ? "주의" : "정상"}</Badge><Badge size="sm" variant="secondary">SLO {service?.slo || "미설정"}</Badge>{service?.runbook ? <Button asChild variant="outline" size="sm"><Link href={service.runbook} target="_blank">런북 열기</Link></Button> : null}<Button asChild variant="ghost" size="sm"><Link href={`/issues?service=${encodeURIComponent(serviceName)}`}>이슈 전체 보기</Link></Button></Flex>
    </OpsSectionCard>
    <Grid className="gap-[var(--space-3)] md:grid-cols-2 xl:grid-cols-5"><StatCard label="오픈 인시던트" value={formatNumber(openIssues.length)} helper={`Critical/High ${criticalHigh.length}건`} color={criticalHigh.length > 0 ? "danger" : "default"} /><StatCard label="SLA 위험" value={formatNumber(slaRisk.length)} helper="기한 초과 이슈" color={slaRisk.length > 0 ? "warning" : "default"} /><StatCard label="Error Budget" value={sloQuery.data?.budgetConsumed == null ? "—" : `${budgetRisk.toFixed(1)}%`} helper={sloQuery.data?.availability == null ? "메트릭 수신 대기" : `가용성 ${sloQuery.data.availability.toFixed(3)}% · 목표 ${sloQuery.data.target}%`} color={budgetRisk >= 70 ? "danger" : budgetRisk >= 35 ? "warning" : "default"} /><StatCard label="수집 상태" value={`${staleSources.length}개`} helper="30분 이상 수신 지연" color={staleSources.length > 0 ? "warning" : "default"} /><StatCard label="온콜" value={service?.onCall || "미지정"} helper={service?.owner ? `오너 ${service.owner}` : "카탈로그에서 지정"} /></Grid>
    <Grid className="gap-[var(--space-4)] xl:grid-cols-3"><OpsSectionCard title="활성 인시던트" description="심각도와 최근 발생 시각 기준입니다." className="xl:col-span-2">{openIssues.length ? <Box className="space-y-[var(--space-2)]">{openIssues.slice(0, 8).map((issue) => <Link key={issue.id} href={`/issues/${issue.id}`} className="border-default hover:border-primary/40 block rounded-[var(--radius-md)] border p-[var(--space-3)]"><Flex className="items-start justify-between gap-[var(--space-2)]"><Box className="min-w-0"><Typography as="p" variant="bodySm" className="font-semibold">{issue.title}</Typography><Typography as="p" variant="caption" color="muted" className="mt-[var(--space-1)]">담당 {issue.assignee || "미지정"} · 최근 {formatDateTime(issue.lastOccurredAt)}</Typography></Box><SeverityBadge severity={issue.severity} /></Flex></Link>)}</Box> : <StateView variant="empty" size="sm" title="열린 인시던트가 없습니다." />}</OpsSectionCard><OpsSectionCard title="연결 리소스" description="운영 대응에 필요한 서비스 연결입니다."><Flex className="flex-wrap gap-[var(--space-2)]">{service?.repository ? <Button asChild variant="outline" size="sm"><Link href={service.repository} target="_blank">저장소</Link></Button> : null}{service?.dashboard ? <Button asChild variant="outline" size="sm"><Link href={service.dashboard} target="_blank">대시보드</Link></Button> : null}</Flex><Typography as="p" variant="caption" color="muted" className="mt-[var(--space-3)]">의존 서비스: {service?.dependencies || "등록되지 않음"}</Typography></OpsSectionCard><OpsSectionCard title="최근 배포" description="서비스 범위 태그와 연결된 최신 배포입니다." className="xl:col-span-3">{latestDeployment ? <Box className="border-default rounded-[var(--radius-md)] border p-[var(--space-3)]"><Typography as="p" variant="bodySm" className="font-semibold">{latestDeployment.version}</Typography><Typography as="p" variant="caption" color="muted" className="mt-[var(--space-1)]">{formatDateTime(latestDeployment.deployedAt)} · 승인 {latestDeployment.approvalStatus}</Typography><Typography as="p" variant="caption" color="muted" className="mt-[var(--space-2)]">{latestDeployment.changelog}</Typography><Button asChild variant="outline" size="sm" className="mt-[var(--space-3)]"><Link href="/deployments">배포 상세 보기</Link></Button></Box> : <StateView variant="empty" size="sm" title="연결된 배포 이력이 없습니다." />}</OpsSectionCard></Grid>
  </OpsPageShell>;
}
