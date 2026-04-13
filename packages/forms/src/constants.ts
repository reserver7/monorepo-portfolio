import type { UseFormProps } from "react-hook-form";

export const APP_FORM_DEFAULTS: Pick<
  UseFormProps,
  "mode" | "reValidateMode" | "criteriaMode" | "shouldFocusError"
> = {
  mode: "onSubmit",
  reValidateMode: "onChange",
  criteriaMode: "firstError",
  shouldFocusError: true
};
