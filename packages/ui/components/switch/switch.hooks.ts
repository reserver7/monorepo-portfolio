import type { SwitchFieldProps } from "./switch.types";

export const mergeSwitchRules = (
  required: boolean | undefined,
  rules: SwitchFieldProps["rules"]
): SwitchFieldProps["rules"] => {
  if (!required || rules?.required) {
    return rules;
  }

  return { required: "필수 설정 항목입니다.", ...rules };
};
