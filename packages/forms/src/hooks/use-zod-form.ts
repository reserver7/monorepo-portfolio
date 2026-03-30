import { zodResolver } from "@hookform/resolvers/zod";
import type { FieldValues, UseFormReturn } from "react-hook-form";
import { type DefaultValues, type UseFormProps } from "react-hook-form";
import type { ZodTypeAny } from "zod";
import { useAppForm } from "./use-app-form";

type SchemaOutput<TSchema extends ZodTypeAny> = TSchema["_output"];

type UseZodFormOptions<TSchema extends ZodTypeAny> = Omit<UseFormProps<SchemaOutput<TSchema>>, "resolver" | "defaultValues"> & {
  defaultValues?: DefaultValues<SchemaOutput<TSchema>>;
};

export const useZodForm = <TSchema extends ZodTypeAny>(
  schema: TSchema,
  options?: UseZodFormOptions<TSchema>
): UseFormReturn<SchemaOutput<TSchema> & FieldValues> => {
  return useAppForm<SchemaOutput<TSchema> & FieldValues>({
    ...options,
    resolver: zodResolver(schema),
  });
};
