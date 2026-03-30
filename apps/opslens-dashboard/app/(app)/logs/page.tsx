"use client";

import { useRef, useState } from "react";
import { Button, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Textarea } from "@repo/ui";
import { useMutation } from "@repo/react-query";
import { Controller, useForm } from "react-hook-form";
import { analyzeLogs } from "@/lib/api";
import { OpsSectionCard } from "@/components/opslens";
import { useOpsFilterStore } from "@/lib/store";
import { formatDateTime, formatNumber } from "@/lib/utils";

type FormValues = {
  source: "server" | "client" | "api" | "console" | "sentry";
  serviceName: string;
  deploymentVersion?: string;
  rawLogs: string;
};

export default function LogsPage() {
  const environment = useOpsFilterStore((state) => state.environment);
  const serviceName = useOpsFilterStore((state) => state.serviceName);
  const [clusters, setClusters] = useState<Awaited<ReturnType<typeof analyzeLogs>>["clusters"]>([]);
  const [summary, setSummary] = useState<{ createdIssues: number; updatedIssues: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<FormValues>({
    defaultValues: {
      source: "server",
      serviceName: serviceName === "all" ? "docs" : serviceName,
      deploymentVersion: "",
      rawLogs: ""
    }
  });

  const analyzeMutation = useMutation({
    mutationFn: (values: FormValues) =>
      analyzeLogs({
        rawLogs: values.rawLogs,
        source: values.source,
        environment,
        serviceName: values.serviceName,
        deploymentVersion: values.deploymentVersion || undefined
      }),
    onSuccess: (result) => {
      setClusters(result.clusters);
      setSummary({ createdIssues: result.createdIssues, updatedIssues: result.updatedIssues });
    }
  });

  const handleUploadFile: React.ChangeEventHandler<HTMLInputElement> = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    form.setValue("rawLogs", text, { shouldDirty: true });
  };

  return (
    <div className="space-y-5">
      <OpsSectionCard title="로그 분석" description="서버 로그, 콘솔 에러, Sentry 형태 JSON을 붙여넣으면 자동 그룹핑/요약합니다.">

        <form
          className="grid gap-3"
          onSubmit={form.handleSubmit((values) => analyzeMutation.mutate(values))}
        >
          <div className="grid gap-3 md:grid-cols-3">
            <div className="grid gap-1">
              <Label htmlFor="logs-source">로그 소스</Label>
              <Controller
                control={form.control}
                name="source"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="logs-source">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="server">server</SelectItem>
                      <SelectItem value="client">client</SelectItem>
                      <SelectItem value="api">api</SelectItem>
                      <SelectItem value="console">console</SelectItem>
                      <SelectItem value="sentry">sentry</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="grid gap-1">
              <Label htmlFor="logs-service-name">서비스명</Label>
              <Input
                id="logs-service-name"
                {...form.register("serviceName", {
                  required: "서비스명을 입력하세요."
                })}
              />
            </div>

            <div className="grid gap-1">
              <Label htmlFor="logs-deployment-version">배포 버전(선택)</Label>
              <Input id="logs-deployment-version" {...form.register("deploymentVersion")} />
            </div>
          </div>

          <div className="grid gap-1">
            <Label htmlFor="logs-raw-message">로그 원문</Label>
            <Textarea
              id="logs-raw-message"
              rows={10}
              {...form.register("rawLogs", {
                required: "로그를 입력하세요.",
                minLength: {
                  value: 10,
                  message: "로그를 10자 이상 입력하세요."
                }
              })}
              className="font-mono text-xs"
              placeholder="2026-03-25T10:14:11Z ERROR Cannot read properties of undefined at ..."
            />
            {form.formState.errors.rawLogs ? (
              <span className="text-xs text-danger">{form.formState.errors.rawLogs.message}</span>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="submit"
              disabled={analyzeMutation.isPending}
              className="bg-primary hover:opacity-90"
            >
              {analyzeMutation.isPending ? "분석 중..." : "로그 분석 실행"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
            >
              파일 업로드
            </Button>
            <Input
              ref={fileInputRef}
              type="file"
              accept=".txt,.log,.json"
              className="hidden"
              onChange={handleUploadFile}
            />
          </div>
        </form>
      </OpsSectionCard>

      {summary ? (
        <section className="grid gap-3 md:grid-cols-2">
          <div className="rounded-xl border border-success/30 bg-success/10 p-4 text-sm">
            신규 이슈 생성: <strong>{formatNumber(summary.createdIssues)}건</strong>
          </div>
          <div className="rounded-xl border border-warning/30 bg-warning/10 p-4 text-sm">
            기존 이슈 업데이트: <strong>{formatNumber(summary.updatedIssues)}건</strong>
          </div>
        </section>
      ) : null}

      <OpsSectionCard title="분석 결과 클러스터">
        {clusters.length === 0 ? (
          <p className="text-sm text-muted">분석 결과가 없습니다.</p>
        ) : (
          <div className="space-y-3">
            {clusters.map((cluster) => (
              <article key={cluster.normalizedMessage} className="rounded-lg border border-default p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold text-foreground">{cluster.title}</p>
                  <span className="text-xs text-muted">
                    {cluster.severity} · {formatNumber(cluster.count)}회
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted">{cluster.normalizedMessage}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  최초 {formatDateTime(cluster.firstSeen)} · 최근 {formatDateTime(cluster.lastSeen)}
                </p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-muted">
                  {cluster.suggestedActions.map((action) => (
                    <li key={action}>{action}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        )}
      </OpsSectionCard>
    </div>
  );
}
