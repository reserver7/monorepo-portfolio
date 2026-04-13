import { useCallback, useRef, useState } from "react";
import type { FieldValues, SubmitErrorHandler, SubmitHandler, UseFormReturn } from "react-hook-form";
import { toErrorMessage } from "@repo/utils";

type UseFormSubmitOptions<TFieldValues extends FieldValues> = {
  form: UseFormReturn<TFieldValues>;
  onValid: SubmitHandler<TFieldValues>;
  onInvalid?: SubmitErrorHandler<TFieldValues>;
  onError?: (message: string, error: unknown) => void;
};

export const useFormSubmit = <TFieldValues extends FieldValues>({
  form,
  onValid,
  onInvalid,
  onError
}: UseFormSubmitOptions<TFieldValues>) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submittingRef = useRef(false);

  const submit = useCallback(async () => {
    if (submittingRef.current) {
      return;
    }

    submittingRef.current = true;
    setIsSubmitting(true);

    const runner = form.handleSubmit(onValid, onInvalid);

    try {
      await runner();
    } catch (error) {
      onError?.(toErrorMessage(error), error);
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  }, [form, onError, onInvalid, onValid]);

  return {
    submit,
    isSubmitting
  };
};
