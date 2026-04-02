export const COMPONENT_TOKEN_MAP = {
  button: {
    default: ["--color-accent-primary", "--color-fg-on-accent"],
    destructive: ["--color-feedback-danger", "--color-fg-on-danger"],
    success: ["--color-feedback-success", "--color-fg-on-success"],
    warning: ["--color-feedback-warning", "--color-fg-on-warning"],
    outline: ["--color-border-default", "--color-bg-surface", "--color-fg-default"]
  },
  input: {
    base: ["--color-border-default", "--color-bg-surface", "--color-fg-default", "--color-fg-muted"],
    focus: ["--color-accent-primary"],
    error: ["--color-feedback-danger"],
    success: ["--color-feedback-success"]
  },
  select: {
    trigger: ["--color-border-default", "--color-bg-surface", "--color-fg-default", "--color-fg-muted"],
    focus: ["--color-accent-primary"],
    error: ["--color-feedback-danger"],
    success: ["--color-feedback-success"]
  },
  textarea: {
    base: ["--color-border-default", "--color-bg-surface", "--color-fg-default", "--color-fg-muted"],
    focus: ["--color-accent-primary"],
    error: ["--color-feedback-danger"],
    success: ["--color-feedback-success"]
  },
  badge: {
    default: ["--color-accent-primary"],
    success: ["--color-feedback-success"],
    warning: ["--color-feedback-warning"],
    danger: ["--color-feedback-danger"],
    info: ["--color-feedback-info"],
    outline: ["--color-border-default", "--color-fg-default"]
  },
  stateView: {
    empty: ["--color-bg-surface-raised", "--color-fg-muted"],
    loading: ["--color-bg-surface-raised", "--color-accent-primary"],
    error: ["--color-feedback-danger"],
    warning: ["--color-feedback-warning"],
    success: ["--color-feedback-success"],
    info: ["--color-feedback-info"]
  }
} as const;
