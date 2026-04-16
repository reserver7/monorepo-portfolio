import { Injectable, Logger } from "@nestjs/common";
import { createHash } from "node:crypto";
import { env } from "../../config/env.js";

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly responseCache = new Map<string, { value: string; expiresAt: number }>();
  private readonly inFlight = new Map<string, Promise<string>>();
  private rateLimitedUntil = 0;
  private readonly rateLimitFallbackPrefix =
    "AI 요청 한도(429)로 기본 결과를 표시합니다. 잠시 후 다시 시도해 주세요.";

  async generateText(prompt: string, fallback: string): Promise<string> {
    if (env.AI_PROVIDER !== "gemini" || !env.GEMINI_API_KEY) {
      return fallback;
    }

    const cacheKey = this.createCacheKey(prompt);
    const cached = this.readCache(cacheKey);
    if (cached) {
      return cached;
    }

    const running = this.inFlight.get(cacheKey);
    if (running) {
      return running;
    }

    const now = Date.now();
    if (now < this.rateLimitedUntil) {
      const guardedFallback = this.withRateLimitNotice(fallback);
      this.writeCache(cacheKey, guardedFallback);
      return guardedFallback;
    }

    const task = this.requestGeminiWithRetry(prompt, fallback, cacheKey).finally(() => {
      this.inFlight.delete(cacheKey);
    });

    this.inFlight.set(cacheKey, task);
    return task;
  }

  async generateJson<T>(prompt: string, fallback: T): Promise<T> {
    const fallbackString = JSON.stringify(fallback);
    const text = await this.generateText(prompt, fallbackString);

    try {
      const normalized = text
        .replace(/^```json\s*/i, "")
        .replace(/```$/i, "")
        .trim();
      return JSON.parse(normalized) as T;
    } catch {
      return fallback;
    }
  }

  private async requestGeminiWithRetry(prompt: string, fallback: string, cacheKey: string): Promise<string> {
    const requestUrl = `https://generativelanguage.googleapis.com/v1beta/models/${env.GEMINI_MODEL}:generateContent?key=${env.GEMINI_API_KEY}`;
    const maxRetries = env.AI_MAX_RETRIES;
    const baseDelay = env.AI_RETRY_BASE_DELAY_MS;
    let lastStatus: number | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
      try {
        const response = await fetch(requestUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.2 }
          })
        });

        if (response.ok) {
          const payload = (await response.json()) as {
            candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
          };

          const text = payload.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || fallback;
          this.writeCache(cacheKey, text);
          return text;
        }

        lastStatus = response.status;

        if (response.status === 429) {
          const retryAfterHeader = response.headers.get("retry-after");
          const retryAfterMs = retryAfterHeader ? Number.parseInt(retryAfterHeader, 10) * 1000 : Number.NaN;
          const jitterMs = Math.floor(Math.random() * 200);
          const delayMs = Number.isFinite(retryAfterMs)
            ? Math.max(retryAfterMs, baseDelay)
            : baseDelay * 2 ** attempt + jitterMs;

          this.rateLimitedUntil = Date.now() + delayMs;

          if (attempt < maxRetries) {
            this.logger.warn(
              `Gemini request failed: 429 (retry ${attempt + 1}/${maxRetries}, wait ${delayMs}ms)`
            );
            await this.sleep(delayMs);
            continue;
          }

          this.logger.warn("Gemini request failed: 429 (fallback)");
          const guardedFallback = this.withRateLimitNotice(fallback);
          this.writeCache(cacheKey, guardedFallback);
          return guardedFallback;
        }

        if (response.status >= 500 && attempt < maxRetries) {
          const delayMs = baseDelay * 2 ** attempt + Math.floor(Math.random() * 200);
          this.logger.warn(`Gemini request failed: ${response.status} (retry ${attempt + 1}/${maxRetries})`);
          await this.sleep(delayMs);
          continue;
        }

        this.logger.warn(`Gemini request failed: ${response.status}`);
        this.writeCache(cacheKey, fallback);
        return fallback;
      } catch (error) {
        if (attempt < maxRetries) {
          const delayMs = baseDelay * 2 ** attempt + Math.floor(Math.random() * 200);
          this.logger.warn(
            `Gemini request error: ${(error as Error).message} (retry ${attempt + 1}/${maxRetries})`
          );
          await this.sleep(delayMs);
          continue;
        }

        this.logger.warn(`Gemini request error: ${(error as Error).message}`);
        this.writeCache(cacheKey, fallback);
        return fallback;
      }
    }

    const guarded = lastStatus === 429 ? this.withRateLimitNotice(fallback) : fallback;
    this.writeCache(cacheKey, guarded);
    return guarded;
  }

  private createCacheKey(prompt: string): string {
    const hash = createHash("sha256").update(prompt).digest("hex");
    return `${env.GEMINI_MODEL}:${hash}`;
  }

  private readCache(key: string): string | null {
    const hit = this.responseCache.get(key);
    if (!hit) return null;
    if (hit.expiresAt <= Date.now()) {
      this.responseCache.delete(key);
      return null;
    }
    return hit.value;
  }

  private writeCache(key: string, value: string): void {
    this.responseCache.set(key, {
      value,
      expiresAt: Date.now() + env.AI_CACHE_TTL_MS
    });

    if (this.responseCache.size > 300) {
      const oldestKey = this.responseCache.keys().next().value as string | undefined;
      if (oldestKey) this.responseCache.delete(oldestKey);
    }
  }

  private withRateLimitNotice(fallback: string): string {
    if (fallback.includes(this.rateLimitFallbackPrefix)) {
      return fallback;
    }
    return `${this.rateLimitFallbackPrefix}\n${fallback}`;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }
}
