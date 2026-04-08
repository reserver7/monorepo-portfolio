import type { CheckedState } from "@radix-ui/react-checkbox";

export const toBooleanChecked = (value: CheckedState): boolean => value === true;
