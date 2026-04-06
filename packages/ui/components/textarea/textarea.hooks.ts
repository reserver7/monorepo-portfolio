import { resolveFieldStatus } from "../field/field-utils";
import type { TextareaState } from "./textarea.types";

export const resolveTextareaStatus = (
  status?: TextareaState,
  state?: TextareaState,
  hasErrorMessage?: boolean
): TextareaState => resolveFieldStatus(status, state, hasErrorMessage);
