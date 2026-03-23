const resolveErrorMessage = (status: number, rawBody: string): string => {
  const trimmed = rawBody.trim();
  if (!trimmed) {
    return `요청 실패 (${status})`;
  }

  try {
    const parsed = JSON.parse(trimmed) as { message?: unknown };
    if (typeof parsed.message === "string" && parsed.message.trim().length > 0) {
      return parsed.message;
    }
  } catch {
    // Falls back to plain text.
  }

  return trimmed || `요청 실패 (${status})`;
};

export const requestJson = async <T>(apiBaseUrl: string, path: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {})
    },
    cache: "no-store"
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(resolveErrorMessage(response.status, body));
  }

  return (await response.json()) as T;
};
