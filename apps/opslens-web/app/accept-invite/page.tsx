"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Box, Button, Card, FormField, Input, Typography, toast } from "@repo/ui";
import { PasswordStrength } from "@/features/auth/components/password-strength";

export default function AcceptInvitePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("auth");
  const token = searchParams.get("token") ?? "";
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    void fetch(`/api/opslens-auth/invitations/resolve?token=${encodeURIComponent(token)}`)
      .then(async (response) => {
        const payload = (await response.json()) as { email?: string; message?: string };
        if (!response.ok) throw new Error(payload.message || t("inviteInvalid"));
        setEmail(payload.email ?? "");
      })
      .catch((error: Error) => toast.error(error.message))
      .finally(() => setLoading(false));
  }, [token, t]);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (password !== confirmPassword) {
      toast.error(t("passwordMismatch"));
      return;
    }
    setSubmitting(true);
    try {
      const response = await fetch("/api/opslens-auth/invitations/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, name, password })
      });
      const payload = (await response.json()) as { message?: string };
      if (!response.ok) throw new Error(payload.message || t("inviteInvalid"));
      toast.success(t("inviteAccepted"));
      router.replace(`/login?email=${encodeURIComponent(email)}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("inviteInvalid"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box as="main" className="bg-surface-elevated flex min-h-screen items-center justify-center p-6">
      <Card className="bg-surface border-default w-full max-w-md border p-6 shadow-lg">
        <Typography as="h1" variant="headingLg">
          {t("inviteTitle")}
        </Typography>
        <Typography as="p" variant="bodyMd" color="muted" className="mt-3">
          {loading ? t("inviteChecking") : email || t("inviteInvalid")}
        </Typography>
        {!loading && email ? (
          <form className="mt-6 grid gap-4" onSubmit={submit}>
            <FormField label={t("name")} htmlFor="invite-name">
              <Input id="invite-name" value={name} onChange={(event) => setName(event.target.value)} />
            </FormField>
            <FormField label={t("password")} htmlFor="invite-password">
              <Input
                id="invite-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="new-password"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowPassword((value) => !value)}
              >
                {showPassword ? t("hidePassword") : t("showPassword")}
              </Button>
            </FormField>
            <PasswordStrength password={password} />
            <FormField label={t("confirmPassword")} htmlFor="invite-confirm-password">
              <Input
                id="invite-confirm-password"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                autoComplete="new-password"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowConfirmPassword((value) => !value)}
              >
                {showConfirmPassword ? t("hidePassword") : t("showPassword")}
              </Button>
            </FormField>
            <Button type="submit" loading={submitting}>
              {t("inviteAccept")}
            </Button>
          </form>
        ) : null}
        <Button className="mt-4" variant="outline" onClick={() => router.replace("/login")}>
          {t("backToLogin")}
        </Button>
      </Card>
    </Box>
  );
}
