import {
  type DefaultValues,
  type FieldValues,
  type UseFormProps,
  type UseFormReturn,
  useForm
} from "react-hook-form";

export type AppFormOptions<TFieldValues extends FieldValues> = Omit<
  UseFormProps<TFieldValues>,
  "defaultValues"
> & {
  defaultValues?: DefaultValues<TFieldValues>;
};

export const useAppForm = <TFieldValues extends FieldValues = FieldValues>(
  options?: AppFormOptions<TFieldValues>
): UseFormReturn<TFieldValues> => {
  return useForm<TFieldValues>(options);
};
