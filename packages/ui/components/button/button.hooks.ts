export function useButtonDisabledState(disabled?: boolean, loading?: boolean) {
  return Boolean(disabled || loading);
}
