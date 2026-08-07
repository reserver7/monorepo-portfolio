"use client";

import { useEffect, useState } from "react";
import { Badge, Box, Button, Textarea, Typography } from "@repo/ui";
import type { OpsSetting } from "@repo/opslens";

const defaultCatalog = JSON.stringify({ services: [{ name: "checkout", owner: "운영팀", onCall: "oncall@example.com", runbook: "https://runbook.example.com/checkout", slo: "99.9%" }] }, null, 2);

export function ServiceCatalogPanel({ setting, isAdmin, saving, onSave }: { setting?: OpsSetting; isAdmin: boolean; saving: boolean; onSave: (value: string) => void }) {
  const [value, setValue] = useState(setting?.value ?? defaultCatalog);
  useEffect(() => setValue(setting?.value ?? defaultCatalog), [setting?.value]);
  const parsed = (() => { try { return JSON.parse(value) as { services?: Array<{ name?: string; owner?: string; onCall?: string; runbook?: string; slo?: string }> }; } catch { return null; } })();
  const valid = Boolean(parsed);
  const services = parsed?.services ?? [];
  const addService = () => setValue(JSON.stringify({ services: [...services, { name: "new-service", owner: "운영팀", onCall: "", runbook: "", slo: "99.9%" }] }, null, 2));
  return <Box className="space-y-[var(--space-3)]"><Typography as="p" variant="caption" color="muted">서비스별 오너, 온콜, 런북, SLO를 관리해 인시던트 대응과 배포 판단의 기준 데이터로 사용합니다.</Typography>{services.length > 0 ? <Box className="grid gap-[var(--space-2)] md:grid-cols-2">{services.map((service, index) => <Box key={`${service.name}-${index}`} className="border-default rounded-[var(--radius-md)] border p-[var(--space-2)]"><Typography as="p" variant="bodySm" className="font-semibold">{service.name || "이름 없음"}</Typography><Typography as="p" variant="caption" color="muted">오너 {service.owner || "미지정"} · 온콜 {service.onCall || "미지정"}</Typography><Badge size="sm" variant="secondary" className="mt-[var(--space-1)]">SLO {service.slo || "미설정"}</Badge></Box>)}</Box> : null}<Textarea label="서비스 카탈로그 설정" value={value} onChange={(event) => setValue(event.target.value)} rows={10} disabled={!isAdmin} className="font-mono text-caption" /><Box className="flex flex-wrap items-center gap-[var(--space-2)]"><Badge variant={valid ? "success" : "danger"} size="sm">{valid ? `${services.length}개 서비스` : "JSON 형식을 확인하세요"}</Badge>{isAdmin ? <Button type="button" variant="secondary" size="sm" onClick={addService} disabled={!valid}>서비스 추가</Button> : null}{isAdmin ? <Button type="button" size="sm" loading={saving} disabled={!valid || value === (setting?.value ?? defaultCatalog)} onClick={() => onSave(value)}>서비스 카탈로그 저장</Button> : null}</Box></Box>;
}
