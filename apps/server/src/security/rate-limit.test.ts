import { EventRateLimiter } from "./rate-limit";

describe("이벤트 레이트리미터", () => {
  it("동일 윈도우에서 제한 횟수를 넘으면 차단한다", () => {
    const limiter = new EventRateLimiter();
    const now = 1_700_000_000_000;

    expect(limiter.allow("socket-1:event", 2, 10_000, now)).toBe(true);
    expect(limiter.allow("socket-1:event", 2, 10_000, now + 1)).toBe(true);
    expect(limiter.allow("socket-1:event", 2, 10_000, now + 2)).toBe(false);
  });

  it("다음 윈도우에서는 카운터를 초기화한다", () => {
    const limiter = new EventRateLimiter();
    const now = 1_700_000_000_000;

    expect(limiter.allow("socket-1:event", 1, 1000, now)).toBe(true);
    expect(limiter.allow("socket-1:event", 1, 1000, now + 100)).toBe(false);
    expect(limiter.allow("socket-1:event", 1, 1000, now + 1001)).toBe(true);
  });

  it("prefix 기준으로 소켓 카운터를 정리한다", () => {
    const limiter = new EventRateLimiter();
    const now = 1_700_000_000_000;

    expect(limiter.allow("socket-1:event", 1, 10_000, now)).toBe(true);
    expect(limiter.allow("socket-1:event", 1, 10_000, now + 1)).toBe(false);

    limiter.resetByPrefix("socket-1:");

    expect(limiter.allow("socket-1:event", 1, 10_000, now + 2)).toBe(true);
  });

  it("잘못된 limit/window 값이 와도 최소값으로 방어한다", () => {
    const limiter = new EventRateLimiter();
    const now = 1_700_000_000_000;

    expect(limiter.allow("socket-1:event", 0, 0, now)).toBe(true);
    expect(limiter.allow("socket-1:event", -1, -100, now)).toBe(false);
    expect(limiter.allow("socket-1:event", 1, 1, now + 1)).toBe(true);
  });
});
