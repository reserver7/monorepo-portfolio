export const useBuiltInActions = (onCancel?: () => void, onConfirm?: () => void) =>
  Boolean(onCancel || onConfirm);
