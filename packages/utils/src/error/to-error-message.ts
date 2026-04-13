export const toErrorMessage = (
  error: unknown,
  fallbackMessage = "알 수 없는 오류가 발생했습니다."
): string => {
  if (error instanceof Error) {
    const message = error.message.trim();
    return message.length > 0 ? message : fallbackMessage;
  }

  if (typeof error === "string") {
    const message = error.trim();
    return message.length > 0 ? message : fallbackMessage;
  }

  return fallbackMessage;
};
