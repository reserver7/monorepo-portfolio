export const formatExactTime = (isoString: string): string => {
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(isoString));
};

export const formatRelativeTime = (isoString: string): string => {
  const formatter = new Intl.RelativeTimeFormat("ko", { numeric: "auto" });
  const diffMinutes = Math.round((new Date(isoString).getTime() - Date.now()) / 60000);

  if (Math.abs(diffMinutes) < 1) {
    return "방금";
  }

  if (Math.abs(diffMinutes) < 60) {
    return formatter.format(diffMinutes, "minute");
  }

  return formatter.format(Math.round(diffMinutes / 60), "hour");
};
