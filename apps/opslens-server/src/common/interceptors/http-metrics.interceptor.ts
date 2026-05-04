import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from "@nestjs/common";
import { Observable, tap } from "rxjs";

@Injectable()
export class HttpMetricsInterceptor implements NestInterceptor {
  private readonly logger = new Logger(HttpMetricsInterceptor.name);
  private readonly byRoute = new Map<string, number[]>();
  private totalSamples = 0;

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== "http") {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<{
      method?: string;
      route?: { path?: string };
      path?: string;
      url?: string;
    }>();
    const routePath = request.route?.path ?? request.path ?? request.url ?? "unknown";
    const routeKey = `${request.method ?? "UNKNOWN"} ${routePath}`;
    const started = performance.now();

    return next.handle().pipe(
      tap(() => {
        const elapsedMs = performance.now() - started;
        const list = this.byRoute.get(routeKey) ?? [];
        list.push(elapsedMs);
        if (list.length > 200) list.shift();
        this.byRoute.set(routeKey, list);

        this.totalSamples += 1;
        if (process.env.NODE_ENV === "development" && this.totalSamples % 50 === 0) {
          const p50 = this.percentile(list, 50);
          const p95 = this.percentile(list, 95);
          this.logger.debug(`[http-metrics] ${routeKey} p50=${p50.toFixed(1)}ms p95=${p95.toFixed(1)}ms n=${list.length}`);
        }
      })
    );
  }

  private percentile(values: number[], p: number): number {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const idx = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1));
    return sorted[idx] ?? 0;
  }
}
