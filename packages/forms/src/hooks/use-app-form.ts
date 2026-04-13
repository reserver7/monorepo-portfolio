import {
  type DefaultValues,
  type FieldValues,
  type UseFormProps,
  type UseFormReturn,
  useForm
} from "react-hook-form";
import { APP_FORM_DEFAULTS } from "../constants";

export type AppFormOptions<TFieldValues extends FieldValues> = Omit<
  UseFormProps<TFieldValues>,
  "defaultValues"
> & {
  defaultValues?: DefaultValues<TFieldValues>;
};

export const useAppForm = <TFieldValues extends FieldValues = FieldValues>(
  options?: AppFormOptions<TFieldValues>
): UseFormReturn<TFieldValues> => {
  return useForm<TFieldValues>({
    ...APP_FORM_DEFAULTS,
    ...options
  });
};
