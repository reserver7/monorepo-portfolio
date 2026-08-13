import {
  BadRequestException,
  Body,
  Controller,
  Headers,
  MessageEvent,
  Post,
  Query,
  ServiceUnavailableException,
  Sse,
  UnauthorizedException,
  UseGuards
} from "@nestjs/common";
import { interval, from, of, type Observable } from "rxjs";
import { catchError, filter, map, switchMap } from "rxjs/operators";
import { env } from "../../config/env.js";
import { OpsAuthGuard } from "../auth/auth.guard.js";
import { verifyIngestionKey } from "./ingestion-auth.js";
import { OpsService } from "./ops.service.js";

type LogTailQuery = {
  environment?: string;
  serviceName?: string;
  source?: string;
};

type LogIngestionBody = {
  environment?: string;
  serviceName?: string;
  source?: string;
  deploymentVersion?: string;
  logs?: string | string[];
};

type SentryIngestionBody = {
  environment?: string;
  project?: string;
  message?: string;
  level?: string;
  timestamp?: string;
  tags?: { service?: string; release?: string };
};

type ServiceMetricBody = {
  environment?: string;
  serviceName?: string;
  requests?: number;
  errors?: number;
  latencyP95Ms?: number;
  occurredAt?: string;
};

type CiStatusBody = { environment?: string; version?: string; status?: string; ciUrl?: string };

@Controller("ops")
export class OpsController {
  constructor(private readonly opsService: OpsService) {}

  @Post("ingest/logs")
  ingestLogs(
    @Headers("x-opslens-ingestion-key") ingestionKey: string | undefined,
    @Body() body: LogIngestionBody
  ) {
    if (!env.OPS_INGESTION_KEY) {
      throw new ServiceUnavailableException("로그 ingestion API가 설정되지 않았습니다.");
    }
    if (!verifyIngestionKey(ingestionKey, env.OPS_INGESTION_KEY)) {
      throw new UnauthorizedException("로그 ingestion 인증에 실패했습니다.");
    }

    const rawLogs = Array.isArray(body.logs) ? body.logs.join("\n") : body.logs?.trim();
    if (!rawLogs || !body.environment?.trim() || !body.serviceName?.trim()) {
      throw new BadRequestException("environment, serviceName, logs 값이 필요합니다.");
    }
    if (rawLogs.length > env.OPS_INGESTION_MAX_CHARS) {
      throw new BadRequestException("로그 payload가 허용 크기를 초과했습니다.");
    }

    return this.opsService.analyzeLogs({
      environment: body.environment,
      serviceName: body.serviceName.trim(),
      source: body.source ?? "api",
      deploymentVersion: body.deploymentVersion,
      requestedBy: `ingestion:${body.source?.trim() || "api"}`,
      rawLogs,
      clusterLimit: 20
    });
  }

  @Post("ingest/sentry")
  ingestSentry(
    @Headers("x-opslens-ingestion-key") ingestionKey: string | undefined,
    @Body() body: SentryIngestionBody
  ) {
    const serviceName = body.tags?.service?.trim() || body.project?.trim() || "sentry";
    const message = body.message?.trim();
    if (!message) throw new BadRequestException("Sentry message 값이 필요합니다.");
    const timestamp = body.timestamp?.trim() || new Date().toISOString();
    return this.ingestLogs(ingestionKey, {
      environment: body.environment?.trim() || "prod",
      serviceName,
      source: "sentry",
      deploymentVersion: body.tags?.release?.trim(),
      logs: `${timestamp} ${body.level?.trim() || "error"} ${message}`
    });
  }

  @Post("ingest/metrics")
  ingestMetrics(@Headers("x-opslens-ingestion-key") ingestionKey: string | undefined, @Body() body: ServiceMetricBody) {
    if (!env.OPS_INGESTION_KEY) throw new ServiceUnavailableException("메트릭 ingestion API가 설정되지 않았습니다.");
    if (!verifyIngestionKey(ingestionKey, env.OPS_INGESTION_KEY)) throw new UnauthorizedException("메트릭 ingestion 인증에 실패했습니다.");
    return this.opsService.ingestServiceMetric({ environment: body.environment ?? "", serviceName: body.serviceName ?? "", requests: body.requests ?? -1, errors: body.errors ?? -1, latencyP95Ms: body.latencyP95Ms, occurredAt: body.occurredAt });
  }

  @Post("ingest/ci-status")
  ingestCiStatus(@Headers("x-opslens-ingestion-key") ingestionKey: string | undefined, @Body() body: CiStatusBody) {
    if (!env.OPS_INGESTION_KEY) throw new ServiceUnavailableException("CI webhook이 설정되지 않았습니다.");
    if (!verifyIngestionKey(ingestionKey, env.OPS_INGESTION_KEY)) throw new UnauthorizedException("CI webhook 인증에 실패했습니다.");
    return this.opsService.syncDeploymentCiStatus({ environment: body.environment ?? "", version: body.version ?? "", status: body.status ?? "", ciUrl: body.ciUrl });
  }

  @UseGuards(OpsAuthGuard)
  @Sse("log-tail")
  logTail(@Query() query: LogTailQuery): Observable<MessageEvent> {
    let lastSentId = "";
    return interval(1500).pipe(
      switchMap(() =>
        from(
          this.opsService.listRecentLogEvents({
            environment: query.environment,
            serviceName: query.serviceName,
            source: query.source,
            take: 1
          })
        )
      ),
      map((items) => items[0] ?? null),
      filter((item) => item !== null),
      filter((item) => {
        if (!item) return false;
        if (item.id === lastSentId) return false;
        lastSentId = item.id;
        return true;
      }),
      map((item) => ({
        type: "message",
        data: item
      })),
      catchError(() =>
        of({
          type: "error",
          data: { message: "stream_error" }
        })
      )
    );
  }
}
