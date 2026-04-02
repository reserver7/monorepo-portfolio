"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "./alert-dialog";
import type { ButtonProps } from "./button";
import { Button } from "./button";
import { Input } from "./input";
import { Label } from "./label";

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

type AlertRequest = {
  id: number;
  kind: "alert";
  options: AlertOptions;
  resolve: () => void;
};

type ConfirmRequest = {
  id: number;
  kind: "confirm";
  options: ConfirmOptions;
  resolve: (value: boolean) => void;
};

type PromptRequest = {
  id: number;
  kind: "prompt";
  options: PromptConfirmOptions;
  resolve: (value: string | null) => void;
};

type DialogRequest = AlertRequest | ConfirmRequest | PromptRequest;

type DialogApi = {
  alert: (options: AlertOptions) => Promise<void>;
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  promptConfirm: (options: PromptConfirmOptions) => Promise<string | null>;
};

const UI_ALERT_CONFIRM_EVENT_NAME = "repo-ui:alert-confirm-request";

type AlertBridgeDetail = {
  kind: "alert";
  options: AlertOptions;
  acknowledge: () => void;
  respond: () => void;
};

type ConfirmBridgeDetail = {
  kind: "confirm";
  options: ConfirmOptions;
  acknowledge: () => void;
  respond: (value: boolean) => void;
};

type PromptBridgeDetail = {
  kind: "prompt";
  options: PromptConfirmOptions;
  acknowledge: () => void;
  respond: (value: string | null) => void;
};

type AlertConfirmBridgeDetail = AlertBridgeDetail | ConfirmBridgeDetail | PromptBridgeDetail;

let activeDialogApi: DialogApi | null = null;
let requestIdSeed = 0;

const nextRequestId = () => {
  requestIdSeed += 1;
  return requestIdSeed;
};

const normalizeAlertOptions = (input: AlertInput): AlertOptions => {
  if (typeof input === "string") {
    return {
      description: input
    };
  }

  return input;
};

const normalizeConfirmOptions = (input: ConfirmInput): ConfirmOptions => {
  if (typeof input === "string") {
    return {
      description: input
    };
  }

  return input;
};

const normalizePromptConfirmOptions = (input: PromptConfirmInput): PromptConfirmOptions => {
  if (typeof input === "string") {
    return {
      description: input
    };
  }

  return input;
};

const toFallbackText = (options: { title?: string; description?: string }) => {
  if (options.description?.trim()) {
    return options.description;
  }
  if (options.title?.trim()) {
    return options.title;
  }
  return "";
};

const normalizePromptValue = (options: PromptConfirmOptions, rawValue: string) => {
  if (options.trimResult === false) {
    return rawValue;
  }
  return rawValue.trim();
};

export async function alert(input: AlertInput): Promise<void> {
  const options = normalizeAlertOptions(input);

  if (activeDialogApi) {
    await activeDialogApi.alert(options);
    return;
  }

  if (typeof globalThis.window !== "undefined" && typeof globalThis.window.dispatchEvent === "function") {
    await new Promise<void>((resolve) => {
      let acknowledged = false;

      const detail: AlertBridgeDetail = {
        kind: "alert",
        options,
        acknowledge: () => {
          acknowledged = true;
        },
        respond: () => {
          resolve();
        }
      };

      globalThis.window.dispatchEvent(
        new CustomEvent<AlertConfirmBridgeDetail>(UI_ALERT_CONFIRM_EVENT_NAME, {
          detail
        })
      );

      queueMicrotask(() => {
        if (acknowledged) {
          return;
        }

        if (typeof globalThis.alert === "function") {
          globalThis.alert(toFallbackText(options));
        }
        resolve();
      });
    });
    return;
  }

  if (typeof globalThis.alert === "function") {
    globalThis.alert(toFallbackText(options));
  }
}

export async function confirm(input: ConfirmInput): Promise<boolean> {
  const options = normalizeConfirmOptions(input);

  if (activeDialogApi) {
    return activeDialogApi.confirm(options);
  }

  if (typeof globalThis.window !== "undefined" && typeof globalThis.window.dispatchEvent === "function") {
    return new Promise<boolean>((resolve) => {
      let acknowledged = false;

      const detail: ConfirmBridgeDetail = {
        kind: "confirm",
        options,
        acknowledge: () => {
          acknowledged = true;
        },
        respond: (value) => {
          resolve(value);
        }
      };

      globalThis.window.dispatchEvent(
        new CustomEvent<AlertConfirmBridgeDetail>(UI_ALERT_CONFIRM_EVENT_NAME, {
          detail
        })
      );

      queueMicrotask(() => {
        if (acknowledged) {
          return;
        }

        if (typeof globalThis.confirm === "function") {
          resolve(globalThis.confirm(toFallbackText(options)));
          return;
        }

        resolve(false);
      });
    });
  }

  if (typeof globalThis.confirm === "function") {
    return globalThis.confirm(toFallbackText(options));
  }

  return false;
}

export async function promptConfirm(input: PromptConfirmInput): Promise<string | null> {
  const options = normalizePromptConfirmOptions(input);

  if (activeDialogApi) {
    return activeDialogApi.promptConfirm(options);
  }

  if (typeof globalThis.window !== "undefined" && typeof globalThis.window.dispatchEvent === "function") {
    return new Promise<string | null>((resolve) => {
      let acknowledged = false;

      const detail: PromptBridgeDetail = {
        kind: "prompt",
        options,
        acknowledge: () => {
          acknowledged = true;
        },
        respond: (value) => {
          resolve(value);
        }
      };

      globalThis.window.dispatchEvent(
        new CustomEvent<AlertConfirmBridgeDetail>(UI_ALERT_CONFIRM_EVENT_NAME, {
          detail
        })
      );

      queueMicrotask(() => {
        if (acknowledged) {
          return;
        }

        if (typeof globalThis.prompt === "function") {
          const value = globalThis.prompt(toFallbackText(options), options.inputDefaultValue ?? "");
          if (value === null) {
            resolve(null);
            return;
          }
          resolve(normalizePromptValue(options, value));
          return;
        }

        resolve(null);
      });
    });
  }

  if (typeof globalThis.prompt === "function") {
    const value = globalThis.prompt(toFallbackText(options), options.inputDefaultValue ?? "");
    if (value === null) {
      return null;
    }
    return normalizePromptValue(options, value);
  }

  return null;
}

export function useAlertConfirm() {
  return useMemo(() => ({ alert, confirm, promptConfirm }), []);
}

export function AlertConfirmProvider() {
  const [queue, setQueue] = useState<DialogRequest[]>([]);
  const settledRequestIdsRef = useRef<Set<number>>(new Set());
  const [promptSubmitting, setPromptSubmitting] = useState(false);
  const promptInputRef = useRef<HTMLInputElement | null>(null);
  const promptForm = useForm<{ value: string }>({
    defaultValues: {
      value: ""
    }
  });
  const promptValue = promptForm.watch("value");
  const promptFieldError = promptForm.formState.errors.value?.message;

  const enqueueAlert = useCallback((options: AlertOptions) => {
    return new Promise<void>((resolve) => {
      const request: AlertRequest = {
        id: nextRequestId(),
        kind: "alert",
        options,
        resolve
      };
      setQueue((prev) => [...prev, request]);
    });
  }, []);

  const enqueueConfirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      const request: ConfirmRequest = {
        id: nextRequestId(),
        kind: "confirm",
        options,
        resolve
      };
      setQueue((prev) => [...prev, request]);
    });
  }, []);

  const enqueuePromptConfirm = useCallback((options: PromptConfirmOptions) => {
    return new Promise<string | null>((resolve) => {
      const request: PromptRequest = {
        id: nextRequestId(),
        kind: "prompt",
        options,
        resolve
      };
      setQueue((prev) => [...prev, request]);
    });
  }, []);

  useEffect(() => {
    activeDialogApi = {
      alert: enqueueAlert,
      confirm: enqueueConfirm,
      promptConfirm: enqueuePromptConfirm
    };

    const handleBridgeRequest = (event: Event) => {
      const customEvent = event as CustomEvent<AlertConfirmBridgeDetail>;
      const detail = customEvent.detail;
      if (!detail) {
        return;
      }

      detail.acknowledge();

      if (detail.kind === "confirm") {
        void enqueueConfirm(detail.options).then((value) => {
          detail.respond(value);
        });
        return;
      }

      if (detail.kind === "prompt") {
        void enqueuePromptConfirm(detail.options).then((value) => {
          detail.respond(value);
        });
        return;
      }

      void enqueueAlert(detail.options).then(() => {
        detail.respond();
      });
    };

    if (typeof globalThis.window !== "undefined") {
      globalThis.window.addEventListener(UI_ALERT_CONFIRM_EVENT_NAME, handleBridgeRequest as EventListener);
    }

    return () => {
      if (
        activeDialogApi?.alert === enqueueAlert &&
        activeDialogApi.confirm === enqueueConfirm &&
        activeDialogApi.promptConfirm === enqueuePromptConfirm
      ) {
        activeDialogApi = null;
      }

      if (typeof globalThis.window !== "undefined") {
        globalThis.window.removeEventListener(UI_ALERT_CONFIRM_EVENT_NAME, handleBridgeRequest as EventListener);
      }
    };
  }, [enqueueAlert, enqueueConfirm, enqueuePromptConfirm]);

  const current = queue[0] ?? null;

  useEffect(() => {
    if (!current || current.kind !== "prompt") {
      promptForm.reset({ value: "" });
      promptForm.clearErrors("value");
      setPromptSubmitting(false);
      return;
    }

    promptForm.reset({ value: current.options.inputDefaultValue ?? "" });
    promptForm.clearErrors("value");
    setPromptSubmitting(false);

    const timer = setTimeout(() => {
      promptInputRef.current?.focus();
      promptInputRef.current?.select();
    }, 0);

    return () => {
      clearTimeout(timer);
    };
  }, [current, promptForm]);

  const settleRequest = useCallback(
    (request: DialogRequest, result?: boolean | string | null) => {
      if (settledRequestIdsRef.current.has(request.id)) {
        return;
      }
      settledRequestIdsRef.current.add(request.id);

      if (request.kind === "confirm") {
        request.resolve(Boolean(result));
      } else if (request.kind === "prompt") {
        request.resolve(typeof result === "string" ? result : null);
      } else {
        request.resolve();
      }

      setQueue((prev) => {
        if (prev[0]?.id === request.id) {
          return prev.slice(1);
        }
        return prev.filter((entry) => entry.id !== request.id);
      });
    },
    []
  );

  if (!current) {
    return null;
  }

  const title = current.options.title ?? (current.kind === "alert" ? "알림" : "확인");
  const description = current.options.description;
  const confirmText = current.options.confirmText ?? "확인";
  const confirmVariant = current.options.confirmVariant ?? "primary";

  const handlePromptConfirm = async () => {
    if (current.kind !== "prompt") {
      return;
    }
    if (promptSubmitting) {
      return;
    }

    const normalizedValue = normalizePromptValue(current.options, promptValue);
    const isRequired = current.options.inputRequired !== false;
    if (isRequired && normalizedValue.length === 0) {
      promptForm.setError("value", {
        type: "required",
        message: "값을 입력해 주세요."
      });
      return;
    }

    const validationError = current.options.validator?.(normalizedValue) ?? null;
    if (validationError) {
      promptForm.setError("value", {
        type: "validate",
        message: validationError
      });
      return;
    }

    if (current.options.asyncValidator) {
      setPromptSubmitting(true);
      let asyncValidationError: string | null = null;
      try {
        asyncValidationError = await current.options.asyncValidator(normalizedValue);
      } catch {
        asyncValidationError = "요청 처리 중 문제가 발생했습니다. 다시 시도해 주세요.";
      } finally {
        setPromptSubmitting(false);
      }

      if (asyncValidationError) {
        promptForm.setError("value", {
          type: "validate",
          message: asyncValidationError
        });
        return;
      }
    }

    settleRequest(current, normalizedValue);
  };

  const promptConfirmDisabled =
    current.kind === "prompt" &&
    (promptSubmitting ||
      (current.options.inputRequired !== false &&
        normalizePromptValue(current.options, promptValue).length === 0));

  return (
    <AlertDialog
      open
      onOpenChange={(open) => {
        if (!open) {
          if (current.kind === "confirm") {
            settleRequest(current, false);
            return;
          }

          if (current.kind === "prompt") {
            settleRequest(current, null);
            return;
          }

          settleRequest(current);
        }
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description ? <AlertDialogDescription>{description}</AlertDialogDescription> : null}
        </AlertDialogHeader>

        {current.kind === "prompt" ? (
          <div className="space-y-2">
            {current.options.inputLabel ? (
              <Label htmlFor={`prompt-confirm-input-${current.id}`} size="sm">
                {current.options.inputLabel}
              </Label>
            ) : null}
            <Input
              id={`prompt-confirm-input-${current.id}`}
              ref={promptInputRef}
              type={current.options.inputType ?? "text"}
              value={promptValue}
              onChange={(event) => {
                promptForm.setValue("value", event.target.value, {
                  shouldDirty: true
                });
                promptForm.clearErrors("value");
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  void handlePromptConfirm();
                }
              }}
              placeholder={current.options.inputPlaceholder}
              size="md"
              status={promptFieldError ? "error" : "default"}
            />
            {promptFieldError ? <p className="text-sm text-danger">{promptFieldError}</p> : null}
          </div>
        ) : null}

        {current.kind === "confirm" ? (
          <AlertDialogFooter
            cancelText={current.options.cancelText ?? "취소"}
            confirmText={confirmText}
            cancelVariant={current.options.cancelVariant ?? "outline"}
            confirmVariant={confirmVariant}
            onCancel={() => settleRequest(current, false)}
            onConfirm={() => settleRequest(current, true)}
          />
        ) : null}

        {current.kind === "prompt" ? (
          <AlertDialogFooter>
            <Button
              variant={current.options.cancelVariant ?? "outline"}
              onClick={() => settleRequest(current, null)}
              disabled={promptSubmitting}
            >
              {current.options.cancelText ?? "취소"}
            </Button>
            <Button
              variant={confirmVariant}
              onClick={() => {
                void handlePromptConfirm();
              }}
              disabled={promptConfirmDisabled}
              loading={promptSubmitting}
            >
              {confirmText}
            </Button>
          </AlertDialogFooter>
        ) : null}

        {current.kind === "alert" ? (
          <AlertDialogFooter
            confirmText={confirmText}
            confirmVariant={confirmVariant}
            onConfirm={() => settleRequest(current)}
          />
        ) : null}
      </AlertDialogContent>
    </AlertDialog>
  );
}
