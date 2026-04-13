export const resolveOption = <T extends PropertyKey>(
  value: T | undefined,
  allowed: Record<T, unknown>,
  fallback: T
): T => {
  if (!value) return fallback;
  return Object.prototype.hasOwnProperty.call(allowed, value) ? value : fallback;
};
