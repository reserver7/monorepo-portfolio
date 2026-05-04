import { Controller, MessageEvent, Query, Sse } from "@nestjs/common";
import { interval, from, of, type Observable } from "rxjs";
import { catchError, filter, map, switchMap } from "rxjs/operators";
import { OpsService } from "./ops.service.js";

type LogTailQuery = {
  environment?: string;
  serviceName?: string;
  source?: string;
};

@Controller("ops")
export class OpsController {
  constructor(private readonly opsService: OpsService) {}

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
