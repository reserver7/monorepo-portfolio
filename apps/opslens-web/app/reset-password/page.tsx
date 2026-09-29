"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Box, Button, Card, FormField, Input, Typography, toast } from "@repo/ui";
import { useAppForm } from "@repo/forms";
import { resetPassword } from "@/lib/auth";

type ResetFormValues = { password: string; confirmPassword: string };

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("auth");
  const token = searchParams.get("token") ?? "";
  const [completed, setCompleted] = useState(false);
  const form = useAppForm<ResetFormValues>({
    mode: "onSubmit",
    defaultValues: { password: "", confirmPassword: "" }
  });

  const submit = form.handleSubmit(async (values) => {
    if (!token) {
      toast.error(t("resetInvalid"));
      return;
    }
    if (values.password !== values.confirmPassword) {
      form.setError("confirmPassword", { type: "validate", message: t("passwordMismatch") });
      return;
    }
    try {
      await resetPassword({ token, password: values.password });
      setCompleted(true);
      window.setTimeout(() => router.replace("/login"), 900);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("resetInvalid"));
    }
  });

  return (
    <Box as="main" className="bg-surface-elevated flex min-h-screen items-center justify-center p-6">
      <Card className="bg-surface border-default w-full max-w-md border p-6 shadow-lg">
        <Typography as="h1" variant="headingLg">
          {t("resetTitle")}
        </Typography>
        <Typography as="p" variant="bodyMd" color="muted" className="mt-3">
          {completed ? t("resetComplete") : t("resetDescription")}
        </Typography>
        {!completed ? (
          <form className="mt-6 grid gap-4" onSubmit={submit}>
            <FormField label={t("password")} htmlFor="reset-password">
              <Input
                id="reset-password"
                type="password"
                autoComplete="new-password"
                control={form.control}
                name="password"
                rules={{
                  required: t("passwordRequired"),
                  minLength: { value: 8, message: t("passwordMinLength") }
                }}
                errorMessage={form.formState.errors.password?.message}
              />
            </FormField>
            <FormField label={t("confirmPassword")} htmlFor="reset-confirm-password">
              <Input
                id="reset-confirm-password"
                type="password"
                autoComplete="new-password"
                control={form.control}
                name="confirmPassword"
                rules={{ required: t("confirmPasswordRequired") }}
                errorMessage={form.formState.errors.confirmPassword?.message}
              />
            </FormField>
            <Button type="submit">{t("resetSubmit")}</Button>
          </form>
        ) : null}
        <Button className="mt-4" variant="outline" onClick={() => router.replace("/login")}>
          {t("backToLogin")}
        </Button>
      </Card>
    </Box>
  );
}
