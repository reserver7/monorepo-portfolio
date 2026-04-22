const resolveLocale = (locale?: string) => {
  return locale && locale.trim().length > 0 ? locale : "ko";
};

export const formatRelativeTime = (isoString: string, locale?: string): string => {
  const relativeFormatter = new Intl.RelativeTimeFormat(resolveLocale(locale), {
    numeric: "auto"
  });
  const diffMinutes = Math.round((new Date(isoString).getTime() - Date.now()) / 60000);

  if (Math.abs(diffMinutes) < 1) {
    return relativeFormatter.format(0, "second");
  }

  if (Math.abs(diffMinutes) < 60) {
    return relativeFormatter.format(diffMinutes, "minute");
  }

  const diffHours = Math.round(diffMinutes / 60);
  if (Math.abs(diffHours) < 24) {
    return relativeFormatter.format(diffHours, "hour");
  }

  return relativeFormatter.format(Math.round(diffHours / 24), "day");
};

export const formatExactTime = (isoString: string, locale?: string): string => {
  const exactFormatter = new Intl.DateTimeFormat(resolveLocale(locale), {
    dateStyle: "medium",
    timeStyle: "short"
  });
  return exactFormatter.format(new Date(isoString));
};
