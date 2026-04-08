import type { ButtonProps } from "../button";

export interface AlertOptions {
  title?: string;
  description?: string;
  confirmText?: string;
  confirmVariant?: ButtonProps["variant"];
}

export interface ConfirmOptions extends AlertOptions {
  cancelText?: string;
  cancelVariant?: ButtonProps["variant"];
}

export interface PromptConfirmOptions extends ConfirmOptions {
  inputLabel?: string;
  inputPlaceholder?: string;
  inputType?: "text" | "password";
  inputDefaultValue?: string;
  inputRequired?: boolean;
  trimResult?: boolean;
  validator?: (value: string) => string | null;
  asyncValidator?: (value: string) => Promise<string | null>;
}

export type AlertInput = string | AlertOptions;
export type ConfirmInput = string | ConfirmOptions;
export type PromptConfirmInput = string | PromptConfirmOptions;

export type AlertRequest = {
  id: number;
  kind: "alert";
  options: AlertOptions;
  resolve: () => void;
};

export type ConfirmRequest = {
  id: number;
  kind: "confirm";
  options: ConfirmOptions;
  resolve: (value: boolean) => void;
};

export type PromptRequest = {
  id: number;
  kind: "prompt";
  options: PromptConfirmOptions;
  resolve: (value: string | null) => void;
};

export type DialogRequest = AlertRequest | ConfirmRequest | PromptRequest;

export type DialogApi = {
  alert: (options: AlertOptions) => Promise<void>;
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  promptConfirm: (options: PromptConfirmOptions) => Promise<string | null>;
};

export type AlertBridgeDetail = {
  kind: "alert";
  options: AlertOptions;
  acknowledge: () => void;
  respond: () => void;
};

export type ConfirmBridgeDetail = {
  kind: "confirm";
  options: ConfirmOptions;
  acknowledge: () => void;
  respond: (value: boolean) => void;
};

export type PromptBridgeDetail = {
  kind: "prompt";
  options: PromptConfirmOptions;
  acknowledge: () => void;
  respond: (value: string | null) => void;
};

export type AlertConfirmBridgeDetail = AlertBridgeDetail | ConfirmBridgeDetail | PromptBridgeDetail;
