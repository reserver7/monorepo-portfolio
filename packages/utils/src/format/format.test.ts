import test from "node:test";
import assert from "node:assert/strict";
import { formatCurrency, formatDateTime, formatNumber, formatPercent, formatPlural } from "./format";
import { formatRelativeTime } from "../collab/time/time";

test("formats numbers with the requested locale", () => {
  assert.equal(formatNumber(1234567.5, "en-US"), "1,234,567.5");
  assert.equal(formatNumber(1234567.5, "de-DE"), "1.234.567,5");
});

test("formats currency with the requested locale and currency", () => {
  assert.equal(formatCurrency(1234.5, "en-US", "USD"), "$1,234.50");
  assert.equal(formatCurrency(1234.5, "ja-JP", "JPY"), "￥1,235");
});

test("formats percentages with the requested locale", () => {
  assert.equal(formatPercent(0.125, "en-US"), "12.5%");
  assert.equal(formatPercent(0.125, "ko-KR"), "12.5%");
});

test("formats date-time in the configured time zone", () => {
  assert.equal(formatDateTime("2026-01-01T15:30:00.000Z", "en"), "01/02, 12:30 AM");
  assert.match(formatDateTime("2026-01-01T15:30:00.000Z", "ko"), /01.*02/);
});

test("formats relative time with the requested locale", () => {
  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
  assert.equal(formatRelativeTime(twoHoursAgo, "en"), "2 hours ago");
});

test("formats relative time and plural categories with the requested locale", () => {
  assert.equal(formatPlural(1, "en-US"), "one");
  assert.equal(formatPlural(2, "en-US"), "other");
});
