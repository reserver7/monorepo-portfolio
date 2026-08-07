const DEFAULT_OPSLENS_API_URL = "http://localhost:4100/graphql";
let opslensApiUrl = DEFAULT_OPSLENS_API_URL;
let opslensLogTailUrl: string | undefined;

export function configureOpslensClient(options: { apiUrl?: string; logTailUrl?: string }): void {
  const nextApiUrl = options.apiUrl?.trim();
  opslensApiUrl = nextApiUrl && nextApiUrl.length > 0 ? nextApiUrl : DEFAULT_OPSLENS_API_URL;
  const nextLogTailUrl = options.logTailUrl?.trim();
  opslensLogTailUrl = nextLogTailUrl && nextLogTailUrl.length > 0 ? nextLogTailUrl : undefined;
}

export const getOpslensApiUrl = (): string => opslensApiUrl;

export const resolveAuthApiUrl = (): string => {
  const trimmed = opslensApiUrl.trim().replace(/\/+$/, "");
  if (trimmed.endsWith("/graphql")) {
    return trimmed.slice(0, -"/graphql".length);
  }
  return trimmed;
};

export const resolveOpsApiUrl = (): string => {
  const trimmed = opslensApiUrl.trim().replace(/\/+$/, "");
  if (trimmed.endsWith("/graphql")) {
    return trimmed.slice(0, -"/graphql".length);
  }
  return trimmed;
};

export const getOpsLogTailUrl = (): string => opslensLogTailUrl ?? `${resolveOpsApiUrl()}/ops/log-tail`;

export const parseErrorMessage = async (response: Response): Promise<string> => {
  try {
    const payload = (await response.json()) as { message?: string | string[] };
    const message = payload?.message;
    if (Array.isArray(message)) {
      const joined = message.filter((entry) => typeof entry === "string").join(", ");
      if (joined.length > 0) {
        return joined;
      }
    }
    if (typeof message === "string" && message.trim().length > 0) {
      return message;
    }
  } catch {
    // noop
  }
  return response.status === 401 ? "로그인이 필요합니다." : "요청 처리 중 오류가 발생했습니다.";
};
