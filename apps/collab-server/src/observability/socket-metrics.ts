import type { StructuredLogger } from "./logger";

type SocketMetricKind = "received" | "rateLimited" | "payloadRejected";

interface SocketEventCounter {
  received: number;
  rateLimited: number;
  payloadRejected: number;
}

const EMPTY_COUNTER: SocketEventCounter = {
  received: 0,
  rateLimited: 0,
  payloadRejected: 0
};

const hasAnyMetric = (counter: SocketEventCounter): boolean => {
  return counter.received > 0 || counter.rateLimited > 0 || counter.payloadRejected > 0;
};

export class SocketEventMetrics {
  private readonly counters = new Map<string, SocketEventCounter>();
  private readonly flushTimer: NodeJS.Timeout;

  constructor(
    private readonly logger: StructuredLogger,
    private readonly flushIntervalMs = 60_000
  ) {
    this.flushTimer = setInterval(() => {
      this.flush("interval");
    }, this.flushIntervalMs);
    this.flushTimer.unref();
  }

  record(eventName: string, kind: SocketMetricKind): void {
    const current = this.counters.get(eventName) ?? { ...EMPTY_COUNTER };
    current[kind] += 1;
    this.counters.set(eventName, current);
  }

  flush(reason: "interval" | "shutdown"): void {
    const snapshot = [...this.counters.entries()]
      .filter(([, counter]) => hasAnyMetric(counter))
      .map(([eventName, counter]) => ({
        eventName,
        ...counter
      }));

    if (snapshot.length === 0) {
      return;
    }

    this.logger.info("socket.metrics.flush", {
      reason,
      eventCount: snapshot.length,
      metrics: snapshot
    });

    this.counters.clear();
  }

  stop(): void {
    clearInterval(this.flushTimer);
    this.flush("shutdown");
  }
}
