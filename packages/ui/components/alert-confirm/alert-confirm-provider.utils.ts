import type { AlertInput, AlertOptions, ConfirmInput, ConfirmOptions, PromptConfirmInput, PromptConfirmOptions } from "./alert-confirm.types";

export const normalizeAlertOptions = (input: AlertInput): AlertOptions =>
  typeof input === "string"
    ? {
        description: input
      }
    : input;

export const normalizeConfirmOptions = (input: ConfirmInput): ConfirmOptions =>
  typeof input === "string"
    ? {
        description: input
      }
    : input;

export const normalizePromptConfirmOptions = (input: PromptConfirmInput): PromptConfirmOptions =>
  typeof input === "string"
    ? {
        description: input
      }
    : input;

export const toFallbackText = (options: { title?: string; description?: string }) => {
  if (options.description?.trim()) {
    return options.description;
  }
  if (options.title?.trim()) {
    return options.title;
  }
  return "";
};

export const normalizePromptValue = (options: PromptConfirmOptions, rawValue: string) => {
  if (options.trimResult === false) {
    return rawValue;
  }
  return rawValue.trim();
};
