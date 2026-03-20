const relativeFormatter = new Intl.RelativeTimeFormat("ko", {
  numeric: "auto"
});

export const formatRelativeTime = (isoString: string): string => {
  const date = new Date(isoString);
  const diffMs = date.getTime() - Date.now();
  const diffMinutes = Math.round(diffMs / (1000 * 60));

  if (Math.abs(diffMinutes) < 1) {
    return "방금";
  }

  if (Math.abs(diffMinutes) < 60) {
    return relativeFormatter.format(diffMinutes, "minute");
  }

  const diffHours = Math.round(diffMinutes / 60);
  if (Math.abs(diffHours) < 24) {
    return relativeFormatter.format(diffHours, "hour");
  }

  const diffDays = Math.round(diffHours / 24);
  return relativeFormatter.format(diffDays, "day");
};

export const formatExactTime = (isoString: string): string => {
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(isoString));
};
