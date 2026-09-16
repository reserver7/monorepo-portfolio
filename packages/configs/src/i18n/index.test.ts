import test from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_LOCALE, TIME_ZONE, normalizeLocale, resolveLocale, type Locale } from "./index";

test("normalizes supported language tags to the shared locale", () => {
  assert.equal(normalizeLocale("en-US"), "en");
  assert.equal(normalizeLocale("ja-JP"), "ja");
  assert.equal(normalizeLocale("ko"), "ko");
  assert.equal(normalizeLocale("fr-FR"), null);
});

test("resolves cookie before accept-language and default fallback", () => {
  const options = { cookieLocale: "en-US", acceptLanguage: "ja-JP,ko;q=0.8" };
  assert.equal(resolveLocale(options), "en");
  assert.equal(resolveLocale({ acceptLanguage: "ja-JP,ko;q=0.8" }), "ja");
  assert.equal(resolveLocale({ acceptLanguage: "fr-FR" }), DEFAULT_LOCALE);
});

test("exports the shared locale contract", () => {
  const locale: Locale = "ko";
  assert.equal(locale, DEFAULT_LOCALE);
  assert.equal(TIME_ZONE, "Asia/Seoul");
});
