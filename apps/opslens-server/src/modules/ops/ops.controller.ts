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
  UnauthorizedException
} from "@nestjs/common";
import { interval, from, of, type Observable } from "rxjs";
import { catchError, filter, map, switchMap } from "rxjs/operators";
import { env } from "../../config/env.js";
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
