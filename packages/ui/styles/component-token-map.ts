export const COMPONENT_TOKEN_MAP = {
  button: {
    default: ["--ds-primary", "--ds-primary-foreground"],
    destructive: ["--ds-danger", "--ds-danger-foreground"],
    success: ["--ds-success", "--ds-success-foreground"],
    warning: ["--ds-warning", "--ds-warning-foreground"],
    outline: ["--ds-border", "--ds-surface", "--ds-foreground"]
  },
  input: {
    base: ["--ds-border", "--ds-surface", "--ds-foreground", "--ds-muted"],
    focus: ["--ds-primary"],
    error: ["--ds-danger"],
    success: ["--ds-success"]
  },
  select: {
    trigger: ["--ds-border", "--ds-surface", "--ds-foreground", "--ds-muted"],
    focus: ["--ds-primary"],
    error: ["--ds-danger"],
    success: ["--ds-success"]
  },
  textarea: {
    base: ["--ds-border", "--ds-surface", "--ds-foreground", "--ds-muted"],
    focus: ["--ds-primary"],
    error: ["--ds-danger"],
    success: ["--ds-success"]
  },
  badge: {
    default: ["--ds-primary"],
    success: ["--ds-success"],
    warning: ["--ds-warning"],
    danger: ["--ds-danger"],
    info: ["--ds-info"],
    outline: ["--ds-border", "--ds-foreground"]
  },
  stateView: {
    empty: ["--ds-surface-elevated", "--ds-muted"],
    loading: ["--ds-surface-elevated", "--ds-primary"],
    error: ["--ds-danger"],
    warning: ["--ds-warning"],
    success: ["--ds-success"],
    info: ["--ds-info"]
  }
} as const;
