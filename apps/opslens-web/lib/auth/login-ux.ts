export const isTwoFactorChallengeError = (message: string): boolean =>
  /2FA 인증 코드가 필요하거나 올바르지 않습니다\.|2FA code is required or invalid/i.test(message);
