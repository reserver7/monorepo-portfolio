interface Counter {
  windowStartAt: number;
  count: number;
}

export class EventRateLimiter {
  private readonly counters = new Map<string, Counter>();

  allow(key: string, limit: number, windowMs: number, nowMs = Date.now()): boolean {
    const safeLimit = Math.max(1, Math.floor(limit));
    const safeWindowMs = Math.max(1, Math.floor(windowMs));

    const current = this.counters.get(key);
    if (!current || nowMs - current.windowStartAt >= safeWindowMs) {
      this.counters.set(key, {
        windowStartAt: nowMs,
        count: 1
      });
      return true;
    }

    if (current.count >= safeLimit) {
      return false;
    }

    current.count += 1;
    return true;
  }

  resetByPrefix(prefix: string): void {
    for (const key of this.counters.keys()) {
      if (key.startsWith(prefix)) {
        this.counters.delete(key);
      }
    }
  }
}
