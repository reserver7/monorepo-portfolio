import type { InputStatus } from "./input.types";

export const resolveInputStatus = (
  status?: InputStatus,
  state?: InputStatus,
  hasErrorMessage?: boolean
): InputStatus => {
  if (status) {
    return status;
  }

  if (state) {
    return state;
  }

  return hasErrorMessage ? "error" : "default";
};
