const relativeFormatter = new Intl.RelativeTimeFormat("ko", {
  numeric: "auto"
});

const exactFormatter = new Intl.DateTimeFormat("ko-KR", {
  dateStyle: "medium",
  timeStyle: "short"
});

export const formatRelativeTime = (isoString: string): string => {
  const diffMinutes = Math.round((new Date(isoString).getTime() - Date.now()) / 60000);

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

  return relativeFormatter.format(Math.round(diffHours / 24), "day");
};

export const formatExactTime = (isoString: string): string => {
  return exactFormatter.format(new Date(isoString));
};
