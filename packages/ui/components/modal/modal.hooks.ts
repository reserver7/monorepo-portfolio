export const useBuiltInModalActions = (onCancel?: () => void, onConfirm?: () => void) =>
  Boolean(onCancel || onConfirm);
