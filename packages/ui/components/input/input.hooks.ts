import { resolveFieldStatus } from "../field/field-utils";
import type { InputStatus } from "./input.types";

export const resolveInputStatus = (
  status?: InputStatus,
  state?: InputStatus,
  hasErrorMessage?: boolean
): InputStatus => resolveFieldStatus(status, state, hasErrorMessage);
