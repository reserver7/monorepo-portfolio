import type { ReactElement } from "react";
import {
  Controller,
  type ControllerFieldState,
  type ControllerProps,
  type ControllerRenderProps,
  type FieldPath,
  type FieldValues,
} from "react-hook-form";

type RhfFieldRenderParams<TFieldValues extends FieldValues, TName extends FieldPath<TFieldValues>> = {
  field: ControllerRenderProps<TFieldValues, TName>;
  fieldState: ControllerFieldState;
};

type RhfFieldProps<TFieldValues extends FieldValues, TName extends FieldPath<TFieldValues>> = Omit<
  ControllerProps<TFieldValues, TName>,
  "render"
> & {
  render: (params: RhfFieldRenderParams<TFieldValues, TName>) => ReactElement;
};

export const RhfField = <TFieldValues extends FieldValues, TName extends FieldPath<TFieldValues>>(
  props: RhfFieldProps<TFieldValues, TName>
) => {
  return <Controller {...props} render={(params) => props.render(params)} />;
};
