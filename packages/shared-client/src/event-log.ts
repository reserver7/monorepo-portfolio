const DEFAULT_LOCALE = "ko-KR";

export const formatEventLogLine = (message: string, locale = DEFAULT_LOCALE): string => {
  const timestamp = new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  }).format(new Date());

  return `${timestamp} · ${message}`;
};

export const appendEventLog = (
  existing: readonly string[],
  message: string,
  maxEntries: number,
  locale = DEFAULT_LOCALE
): string[] => {
  return [formatEventLogLine(message, locale), ...existing].slice(0, maxEntries);
};
