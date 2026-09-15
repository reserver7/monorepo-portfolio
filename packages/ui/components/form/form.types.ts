import * as React from "react";

export type FormRule = {
  required?: boolean;
  message?: React.ReactNode;
  validator?: (value: unknown, values: Record<string, unknown>) => React.ReactNode | Promise<React.ReactNode>;
};
export interface FormProps extends Omit<
  React.FormHTMLAttributes<HTMLFormElement>,
  "onSubmit" | "onChange" | "onReset"
> {
  layout?: "horizontal" | "vertical" | "inline";
  initialValues?: Record<string, unknown>;
  onFinish?: (values: Record<string, unknown>) => void | Promise<void>;
  onFinishFailed?: (errors: Record<string, React.ReactNode>) => void;
  onValuesChange?: (changed: Record<string, unknown>, values: Record<string, unknown>) => void;
  onReset?: () => void;
}
export interface FormItemProps {
  name?: string;
  label?: React.ReactNode;
  rules?: readonly FormRule[];
  required?: boolean;
  help?: React.ReactNode;
  children: React.ReactElement;
  className?: string;
}
