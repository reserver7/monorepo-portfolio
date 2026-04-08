import * as React from "react";

export const useBuiltInModalActions = (onCancel?: () => void, onConfirm?: () => void) =>
  React.useMemo(() => Boolean(onCancel || onConfirm), [onCancel, onConfirm]);
