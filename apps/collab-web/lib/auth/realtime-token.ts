export const fetchRealtimeAccountToken = async (): Promise<string | undefined> => {
  const response = await fetch("/api/workspace/realtime-token", {
    method: "POST",
    credentials: "include",
    cache: "no-store"
  });
  if (!response.ok) return undefined;
  const payload = (await response.json()) as { token?: unknown };
  return typeof payload.token === "string" ? payload.token : undefined;
};
