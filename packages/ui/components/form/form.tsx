"use client";

import * as React from "react";
import { FormField } from "../form-field";
import { cn } from "../cn";
import type { FormItemProps, FormProps, FormRule } from "./form.types";

type FormContextValue = {
  register: (name: string, rules: readonly FormRule[]) => void;
  errors: Record<string, React.ReactNode>;
  setValue: (name: string, value: unknown) => void;
  initialValues: Record<string, unknown>;
};
const FormContext = React.createContext<FormContextValue | null>(null);

export function Form({
  layout = "vertical",
  initialValues = {},
  onFinish,
  onFinishFailed,
  onValuesChange,
  onReset,
  className,
  children,
  ...props
}: FormProps) {
  const formRef = React.useRef<HTMLFormElement>(null);
  const rulesRef = React.useRef<Record<string, readonly FormRule[]>>({});
  const [errors, setErrors] = React.useState<Record<string, React.ReactNode>>({});
  const valuesRef = React.useRef<Record<string, unknown>>({ ...initialValues });
  const register = React.useCallback((name: string, rules: readonly FormRule[]) => {
    rulesRef.current[name] = rules;
  }, []);
  const setValue = React.useCallback(
    (name: string, value: unknown) => {
      valuesRef.current[name] = value;
      onValuesChange?.({ [name]: value }, valuesRef.current);
    },
    [onValuesChange]
  );
  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = { ...Object.fromEntries(new FormData(event.currentTarget).entries()), ...valuesRef.current };
    valuesRef.current = data;
    const nextErrors: Record<string, React.ReactNode> = {};
    for (const [name, rules] of Object.entries(rulesRef.current))
      for (const rule of rules) {
        const value = data[name];
        if (rule.required && (value === undefined || value === "")) {
          nextErrors[name] = rule.message ?? "This field is required";
          break;
        }
        if (rule.validator) {
          try {
            const result = await rule.validator(value, data);
            if (result) {
              nextErrors[name] = result;
              break;
            }
          } catch (error) {
            nextErrors[name] = error instanceof Error ? error.message : (rule.message ?? "Validation failed");
            break;
          }
        }
      }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      const firstErrorName = Object.keys(nextErrors)[0];
      if (firstErrorName)
        window.requestAnimationFrame(() =>
          formRef.current?.querySelector<HTMLElement>(`[name="${CSS.escape(firstErrorName)}"]`)?.focus()
        );
      onFinishFailed?.(nextErrors);
      return;
    }
    await onFinish?.(data);
  };
  const context = React.useMemo(
    () => ({ register, errors, setValue, initialValues }),
    [errors, initialValues, register, setValue]
  );
  return (
    <FormContext.Provider value={context}>
      <form
        ref={formRef}
        noValidate
        className={cn(
          layout === "inline"
            ? "flex flex-wrap items-end gap-4"
            : layout === "horizontal"
              ? "grid gap-4 md:grid-cols-[minmax(10rem,0.35fr)_minmax(0,1fr)]"
              : "grid gap-4",
          className
        )}
        onSubmit={submit}
        onReset={() => {
          setErrors({});
          valuesRef.current = { ...initialValues };
          onReset?.();
        }}
        {...props}
      >
        {children}
      </form>
    </FormContext.Provider>
  );
}

export function FormItem({ name, label, rules = [], required, help, children, className }: FormItemProps) {
  const context = React.useContext(FormContext);
  React.useEffect(() => {
    if (!name) return;
    const normalizedRules =
      required && !rules.some((rule) => rule.required) ? [{ required: true }, ...rules] : rules;
    context?.register(name, normalizedRules);
  }, [context, name, required, rules]);
  const error = name ? context?.errors[name] : undefined;
  const childProps = children.props as { onChange?: (value: unknown) => void };
  const initialValue = name ? context?.initialValues[name] : undefined;
  const child = name
    ? React.cloneElement(children as React.ReactElement<Record<string, unknown>>, {
        name,
        "aria-invalid": Boolean(error),
        ...(initialValue !== undefined &&
        (children.props as Record<string, unknown>).value === undefined &&
        (children.props as Record<string, unknown>).defaultValue === undefined
          ? { defaultValue: initialValue }
          : {}),
        onChange: (value: unknown) => {
          const nextValue =
            value && typeof value === "object" && "target" in value
              ? (value as React.ChangeEvent<HTMLInputElement>).target.type === "checkbox"
                ? (value as React.ChangeEvent<HTMLInputElement>).target.checked
                : (value as React.ChangeEvent<HTMLInputElement>).target.value
              : value;
          context?.setValue(name, nextValue);
          childProps.onChange?.(value);
        }
      })
    : children;
  return (
    <FormField
      label={label}
      htmlFor={name}
      requiredMark={Boolean(required || rules.some((rule) => rule.required))}
      description={help}
      error={error}
      className={className}
    >
      {child}
    </FormField>
  );
}
