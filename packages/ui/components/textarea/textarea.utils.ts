import { resolveFieldStatus } from "../field/field-utils";
import type { TextareaStatus } from "./textarea.types";

export const resolveTextareaStatus = (
  status?: TextareaStatus,
  hasErrorMessage?: boolean
): TextareaStatus => resolveFieldStatus(status, hasErrorMessage);
