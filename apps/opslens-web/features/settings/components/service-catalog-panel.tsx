"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge, Box, Button, Grid, Input, Typography } from "@repo/ui";
import type { OpsSetting } from "@repo/opslens";

type ServiceCatalogItem = {
  name: string;
  owner: string;
  onCall: string;
  runbook: string;
  slo: string;
  repository: string;
  dashboard: string;
  dependencies: string;
};

const defaultServices: ServiceCatalogItem[] = [
  { name: "checkout", owner: "운영팀", onCall: "oncall@example.com", runbook: "https://runbook.example.com/checkout", slo: "99.9%", repository: "", dashboard: "", dependencies: "" }
];

const parseServices = (value?: string): ServiceCatalogItem[] => {
  if (!value) return defaultServices;
  try {
    const parsed = JSON.parse(value) as { services?: Array<Partial<ServiceCatalogItem>> };
    if (!Array.isArray(parsed.services)) return defaultServices;
    return parsed.services.map((service) => ({
      name: service.name?.trim() ?? "",
      owner: service.owner?.trim() ?? "",
      onCall: service.onCall?.trim() ?? "",
      runbook: service.runbook?.trim() ?? "",
      slo: service.slo?.trim() ?? "",
      repository: service.repository?.trim() ?? "",
      dashboard: service.dashboard?.trim() ?? "",
      dependencies: service.dependencies?.trim() ?? ""
    }));
  } catch {
    return defaultServices;
  }
};

export function ServiceCatalogPanel({ setting, isAdmin, saving, onSave }: { setting?: OpsSetting; isAdmin: boolean; saving: boolean; onSave: (value: string) => void }) {
  const [services, setServices] = useState<ServiceCatalogItem[]>(() => parseServices(setting?.value));
  const [parseError, setParseError] = useState(false);

  useEffect(() => {
    try {
      if (setting?.value) JSON.parse(setting.value);
      setParseError(false);
    } catch {
      setParseError(true);
    }
    setServices(parseServices(setting?.value));
  }, [setting?.value]);

  const normalized = useMemo(
    () => services.map((service) => ({ ...service, name: service.name.trim(), owner: service.owner.trim(), onCall: service.onCall.trim(), runbook: service.runbook.trim(), slo: service.slo.trim(), repository: service.repository.trim(), dashboard: service.dashboard.trim(), dependencies: service.dependencies.trim() })),
    [services]
  );
  const valid = normalized.length > 0 && normalized.every((service) => service.name && service.owner && service.slo && (!service.runbook || /^https?:\/\//i.test(service.runbook)));
  const serialized = JSON.stringify({ services: normalized }, null, 2);
  const initialSerialized = JSON.stringify({ services: parseServices(setting?.value) }, null, 2);

  const updateService = (index: number, field: keyof ServiceCatalogItem, value: string) => {
    setServices((previous) => previous.map((service, serviceIndex) => serviceIndex === index ? { ...service, [field]: value } : service));
  };

  return (
    <Box className="space-y-[var(--space-3)]">
      <Typography as="p" variant="caption" color="muted">서비스 오너, 온콜, 런북, SLO는 인시던트 대응과 배포 판단에 공통으로 사용됩니다.</Typography>
      {parseError ? <Typography as="p" variant="caption" className="text-warning">기존 카탈로그 형식을 읽을 수 없어 기본 입력값으로 표시했습니다. 저장하면 표준 형식으로 교체됩니다.</Typography> : null}
      {services.map((service, index) => (
        <Box key={`${service.name}-${index}`} className="border-default rounded-[var(--radius-md)] border p-[var(--space-3)]">
          <Grid className="gap-[var(--space-3)] md:grid-cols-2 xl:grid-cols-3">
            <Input label="서비스명" value={service.name} onChange={(event) => updateService(index, "name", event.target.value)} disabled={!isAdmin} placeholder="예: checkout" />
            <Input label="오너" value={service.owner} onChange={(event) => updateService(index, "owner", event.target.value)} disabled={!isAdmin} placeholder="예: 결제 플랫폼팀" />
            <Input label="SLO" value={service.slo} onChange={(event) => updateService(index, "slo", event.target.value)} disabled={!isAdmin} placeholder="예: 99.9%" />
            <Input label="온콜" value={service.onCall} onChange={(event) => updateService(index, "onCall", event.target.value)} disabled={!isAdmin} placeholder="예: oncall@company.com" />
            <Input label="런북 URL" type="url" value={service.runbook} onChange={(event) => updateService(index, "runbook", event.target.value)} disabled={!isAdmin} placeholder="https://runbook.example.com" className="md:col-span-2" />
            <Input label="저장소 URL" type="url" value={service.repository} onChange={(event) => updateService(index, "repository", event.target.value)} disabled={!isAdmin} placeholder="https://github.com/org/repo" />
            <Input label="대시보드 URL" type="url" value={service.dashboard} onChange={(event) => updateService(index, "dashboard", event.target.value)} disabled={!isAdmin} placeholder="https://grafana.example.com/..." />
            <Input label="의존 서비스" value={service.dependencies} onChange={(event) => updateService(index, "dependencies", event.target.value)} disabled={!isAdmin} placeholder="예: payments, inventory" />
          </Grid>
          {isAdmin && services.length > 1 ? <Button type="button" variant="ghost" size="sm" className="mt-[var(--space-2)]" onClick={() => setServices((previous) => previous.filter((_, serviceIndex) => serviceIndex !== index))}>서비스 제거</Button> : null}
        </Box>
      ))}
      <Box className="flex flex-wrap items-center gap-[var(--space-2)]">
        <Badge variant={valid ? "success" : "warning"} size="sm">{valid ? `${normalized.length}개 서비스 준비됨` : "서비스명·오너·SLO와 런북 URL을 확인하세요"}</Badge>
        {isAdmin ? <Button type="button" variant="secondary" size="sm" onClick={() => setServices((previous) => [...previous, { name: "", owner: "", onCall: "", runbook: "", slo: "99.9%", repository: "", dashboard: "", dependencies: "" }])}>서비스 추가</Button> : null}
        {isAdmin ? <Button type="button" size="sm" loading={saving} disabled={!valid || serialized === initialSerialized} onClick={() => onSave(serialized)}>서비스 카탈로그 저장</Button> : null}
      </Box>
    </Box>
  );
}
