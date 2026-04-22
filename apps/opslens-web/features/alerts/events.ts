import type { CreateOpsAlertInput } from "./types";

export const OPS_ALERT_EVENT_NAME = "opslens:alert";

export const emitOpsAlert = (payload: CreateOpsAlertInput) => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<CreateOpsAlertInput>(OPS_ALERT_EVENT_NAME, { detail: payload }));
};
