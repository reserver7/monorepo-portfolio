import * as React from "react";

export const useBuiltInActions = (onCancel?: () => void, onConfirm?: () => void) =>
  React.useMemo(() => Boolean(onCancel || onConfirm), [onCancel, onConfirm]);
