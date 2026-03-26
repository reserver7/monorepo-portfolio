export function formatDateTime(value?: string | Date | null): string {
  if (!value) return "-";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

export function formatNumber(value?: number | null): string {
  if (typeof value !== "number") return "0";
  return new Intl.NumberFormat("ko-KR").format(value);
}

export function toIsoDate(value: Date): string {
  return value.toISOString().slice(0, 10);
}
