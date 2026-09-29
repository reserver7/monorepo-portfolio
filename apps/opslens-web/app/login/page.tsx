"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";
import { useAppForm } from "@repo/forms";
import { useMutation } from "@repo/react-query";
import { Box, Button, Card, CardContent, Checkbox, FormField, Input, Typography, toast } from "@repo/ui";
import {
  loginWithPassword,
  requestPasswordReset,
  resendEmailVerification,
  signupWithPassword,
  validateCurrentSession
} from "@/lib/auth";
import { resolveLocalizedError } from "@/lib/i18n/errors";

type LoginFormValues = {
  email: string;
  password: string;
  otp: string;
  confirmPassword: string;
};

const resolveNextPath = (rawNext: string | null): string => {
  if (!rawNext) return "/";
  const trimmed = rawNext.trim();
  if (!trimmed.startsWith("/")) return "/";
  if (trimmed.startsWith("/login")) return "/";
  return trimmed;
};

const deriveNameFromEmail = (email: string): string => {
  const localPart = email.split("@")[0]?.trim();
  return localPart && localPart.length > 0 ? localPart : "user";
};

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { resolvedTheme } = useTheme();
  const t = useTranslations("auth");
  const tError = useTranslations("error");

  const nextPath = useMemo(() => resolveNextPath(searchParams.get("next")), [searchParams]);
  const oauthPending = searchParams.get("oauth") === "1";
  const oauthError = searchParams.get("error");

  const heroContentRef = useRef<HTMLDivElement | null>(null);
  const formHeaderRef = useRef<HTMLDivElement | null>(null);
  const formBodyRef = useRef<HTMLDivElement | null>(null);
  const [authMode, setAuthMode] = useState<"login" | "signup">(
    searchParams.get("mode") === "signup" ? "signup" : "login"
  );
  const [rememberMe, setRememberMe] = useState(true);
  const [entered, setEntered] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState<string | null>(null);
  const [verificationLoginEmail, setVerificationLoginEmail] = useState<string | null>(null);
  const [verificationCooldown, setVerificationCooldown] = useState(0);

  const form = useAppForm<LoginFormValues>({
    mode: "onSubmit",
    reValidateMode: "onBlur",
    defaultValues: {
      email: "",
      password: "",
      otp: "",
      confirmPassword: ""
    }
  });

  const loginMutation = useMutation({
    mutationFn: loginWithPassword,
    onSuccess: () => {
      setVerificationLoginEmail(null);
      toast.success(t("loginSuccess"));
      router.replace(nextPath);
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "";
      if (/이메일 인증|email verification/i.test(message)) {
        setVerificationLoginEmail(form.getValues("email")?.trim() || null);
      }
      toast.error(resolveLocalizedError(error, tError as never, t("loginErrorFallback")));
    }
  });

  const signupMutation = useMutation({
    mutationFn: signupWithPassword,
    onSuccess: (result) => {
      setVerificationEmail(result.email);
      toast.success(t("verificationRequired"));
    },
    onError: (error) => {
      toast.error(resolveLocalizedError(error, tError as never, t("signupErrorFallback")));
    }
  });

  const resendVerificationMutation = useMutation({
    mutationFn: resendEmailVerification,
    onSuccess: (result) => {
      if (result.sent) setVerificationCooldown(60);
      toast.success(result.sent ? t("verificationResent") : t("verificationUnavailable"));
    },
    onError: (error) => {
      toast.error(resolveLocalizedError(error, tError as never, t("verificationResendFailed")));
    }
  });

  const forgotPasswordMutation = useMutation({
    mutationFn: requestPasswordReset,
    onSuccess: () => {
      toast.success(t("resetRequested"));
    },
    onError: (error) => {
      toast.error(resolveLocalizedError(error, tError as never, t("resetErrorFallback")));
    }
  });

  const switchMode = (nextMode: "login" | "signup") => {
    if (nextMode === authMode) return;
    setAuthMode(nextMode);
    form.setValue("email", "");
    form.setValue("password", "");
    form.setValue("otp", "");
    form.setValue("confirmPassword", "");
    form.clearErrors();
  };

  const submitAuth = form.handleSubmit((values) => {
    if (authMode === "signup") {
      if (values.password !== values.confirmPassword) {
        form.setError("confirmPassword", { type: "validate", message: t("passwordMismatch") });
        toast.error(t("passwordMismatch"));
        return;
      }
      signupMutation.mutate({
        email: values.email.trim(),
        name: deriveNameFromEmail(values.email.trim()),
        password: values.password,
        next: nextPath
      });
      return;
    }

    loginMutation.mutate({
      email: values.email.trim(),
      password: values.password,
      otp: values.otp || undefined,
      rememberMe
    });
  });

  const handleForgotPassword = () => {
    const email = form.getValues("email")?.trim() ?? "";
    if (!email) {
      form.setError("email", { type: "required", message: t("emailRequired") });
      toast.error(t("emailRequired"));
      return;
    }

    forgotPasswordMutation.mutate({ email });
  };

  const startOAuthLogin = async (provider: "google" | "github") => {
    await signIn(provider, {
      callbackUrl: `/oauth/callback?next=${encodeURIComponent(nextPath)}`
    });
  };

  useEffect(() => {
    setEntered(true);
  }, []);

  useEffect(() => {
    if (verificationCooldown <= 0) return;
    const timer = window.setInterval(() => {
      setVerificationCooldown((current) => Math.max(0, current - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [verificationCooldown]);

  useEffect(() => {
    let active = true;
    void validateCurrentSession().then((session) => {
      if (active && session?.accessToken) router.replace(nextPath);
    });
    return () => {
      active = false;
    };
  }, [nextPath, router]);

  useEffect(() => {
    if (!oauthPending) return;
    router.replace(`/oauth/callback?next=${encodeURIComponent(nextPath)}`);
  }, [nextPath, oauthPending, router]);

  useEffect(() => {
    if (!oauthError) return;
    toast.error(t("oauthProviderError"));
  }, [oauthError]);

  useEffect(() => {
    const easing = "cubic-bezier(0.22, 1, 0.36, 1)";
    const animateIn = (node: HTMLDivElement | null, offsetX: number) => {
      if (!node) return;
      node.animate(
        [
          { opacity: 0, transform: `translateX(${offsetX}px)` },
          { opacity: 1, transform: "translateX(0)" }
        ],
        { duration: 280, easing, fill: "both" }
      );
    };

    animateIn(heroContentRef.current, authMode === "signup" ? -14 : 14);
    animateIn(formHeaderRef.current, authMode === "signup" ? 12 : -12);
    animateIn(formBodyRef.current, authMode === "signup" ? 10 : -10);
  }, [authMode]);

  return (
    <Box className="bg-surface-elevated flex min-h-screen items-center justify-center p-[var(--space-4)]">
      <Card
        className={`w-full max-w-[1180px] overflow-hidden rounded-[var(--radius-xl)] border shadow-sm transition-all duration-500 ${
          entered ? "translate-y-0 opacity-100" : "translate-y-[8px] opacity-0"
        }`}
      >
        <Box className="bg-surface grid min-h-[760px] grid-cols-1 lg:grid-cols-2">
          <Box
            className="flex flex-col justify-center gap-[var(--space-6)] px-[var(--space-7)] py-[var(--space-8)] transition-all duration-300"
            style={{
              background:
                "linear-gradient(150deg, rgb(var(--color-accent-primary)) 0%, rgb(var(--color-accent-primary-hover)) 48%, rgb(var(--color-accent-primary-active)) 100%)"
            }}
          >
            <Box
              ref={heroContentRef}
              className="mx-auto grid max-w-[420px] justify-items-center gap-[var(--space-4)] text-center"
            >
              <Typography
                as="p"
                className="text-[56px] font-semibold leading-[1.05] tracking-[-0.02em] text-white"
              >
                {authMode === "login" ? t("heroLoginTitle") : t("heroSignupTitle")}
              </Typography>
              <Typography as="p" className="max-w-[380px] text-[18px] leading-[1.55] text-white">
                {authMode === "login" ? t("heroLoginDescription") : t("heroSignupDescription")}
              </Typography>
              <Button
                type="button"
                variant="outline"
                className="hover:bg-white/12 mt-[var(--space-3)] h-[54px] min-w-[220px] rounded-full border-white/85 bg-transparent text-white"
                onClick={() => switchMode(authMode === "login" ? "signup" : "login")}
              >
                {authMode === "login" ? t("modeSignup") : t("modeLogin")}
              </Button>
            </Box>
          </Box>

          <Box className="px-[var(--space-7)] py-[var(--space-8)] transition-all duration-300">
            <Box className="mx-auto grid h-full w-full max-w-[460px] content-start gap-[var(--space-5)]">
              <Box className="h-10 w-[148px]">
                <Image src="/icons/opslens-logo.svg" alt="OpsLens" width={148} height={32} priority />
              </Box>

              <Box ref={formHeaderRef} className="grid gap-[var(--space-2)]">
                <Typography
                  as="p"
                  className="text-foreground text-[56px] font-semibold leading-[1.05] tracking-[-0.02em]"
                >
                  {authMode === "signup" ? t("createAccountTitle") : t("modeLogin")}
                </Typography>
                <Typography as="p" variant="bodyMd" color="muted" className="leading-[1.6]">
                  {authMode === "signup" ? t("emailRegistrationHint") : t("accountHint")}
                </Typography>
              </Box>

              <CardContent className="mt-[var(--space-1)] px-0 pb-0">
                {verificationEmail ? (
                  <Box className="bg-surface-elevated mb-[var(--space-4)] grid gap-2 rounded-[var(--radius-md)] p-4">
                    <Typography as="p" variant="bodyMd" className="font-semibold">
                      {t("verificationRequired")}
                    </Typography>
                    <Typography as="p" variant="bodySm" color="muted">
                      {t("verificationDescription", { email: verificationEmail })}
                    </Typography>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="justify-self-start px-0"
                      loading={resendVerificationMutation.isPending}
                      onClick={() =>
                        resendVerificationMutation.mutate({ email: verificationEmail, next: nextPath })
                      }
                    >
                      {t("resendVerification")}
                    </Button>
                  </Box>
                ) : null}
                <Box ref={formBodyRef} className="grid gap-[var(--space-3)]">
                  <Box className="flex justify-center gap-[var(--space-3)]">
                    <Button
                      type="button"
                      variant="secondary"
                      className="border-default h-[56px] w-[56px] rounded-full border p-0"
                      aria-label={t("continueWithGoogle")}
                      onClick={() => startOAuthLogin("google")}
                    >
                      <Image src="/icons/google-color.svg" alt="Google" width={22} height={22} />
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      className="border-default h-[56px] w-[56px] rounded-full border p-0"
                      aria-label={t("continueWithGithub")}
                      onClick={() => startOAuthLogin("github")}
                    >
                      <Image
                        src={
                          resolvedTheme === "dark" ? "/icons/github-mark-white.svg" : "/icons/github-mark.svg"
                        }
                        alt="GitHub"
                        width={22}
                        height={22}
                      />
                    </Button>
                  </Box>

                  <FormField label={t("email")} htmlFor="opslens-login-email">
                    <Input
                      id="opslens-login-email"
                      type="email"
                      autoComplete="email"
                      control={form.control}
                      name="email"
                      rules={{
                        required: t("emailRequired"),
                        pattern: {
                          value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                          message: t("emailInvalid")
                        }
                      }}
                      errorMessage={form.formState.errors.email?.message}
                      onEnter={() => submitAuth()}
                      className="bg-surface-elevated h-[56px]"
                    />
                  </FormField>

                  <FormField label={t("password")} htmlFor="opslens-login-password">
                    <Input
                      id="opslens-login-password"
                      type="password"
                      autoComplete={authMode === "signup" ? "new-password" : "current-password"}
                      control={form.control}
                      name="password"
                      rules={{
                        required: t("passwordRequired"),
                        minLength: {
                          value: 8,
                          message: t("passwordMinLength")
                        }
                      }}
                      errorMessage={form.formState.errors.password?.message}
                      onEnter={() => submitAuth()}
                      className="bg-surface-elevated h-[56px]"
                    />
                  </FormField>

                  {authMode === "login" ? (
                    <FormField label={t("twoFactorCode")} htmlFor="opslens-login-otp">
                      <Input
                        id="opslens-login-otp"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        control={form.control}
                        name="otp"
                        rules={{
                          pattern: {
                            value: /^(?:\d{6}|[A-Za-z0-9]{10})$/,
                            message: t("twoFactorCodeInvalid")
                          }
                        }}
                        errorMessage={form.formState.errors.otp?.message}
                        onEnter={() => submitAuth()}
                        className="bg-surface-elevated h-[56px]"
                      />
                    </FormField>
                  ) : null}

                  <Box className="min-h-[96px]">
                    {authMode === "signup" ? (
                      <FormField label={t("confirmPassword")} htmlFor="opslens-signup-confirm-password">
                        <Input
                          id="opslens-signup-confirm-password"
                          type="password"
                          autoComplete="new-password"
                          control={form.control}
                          name="confirmPassword"
                          rules={{
                            required: t("confirmPasswordRequired"),
                            validate: (value) =>
                              authMode !== "signup" ||
                              value === form.getValues("password") ||
                              t("passwordMismatch")
                          }}
                          errorMessage={form.formState.errors.confirmPassword?.message}
                          onEnter={() => submitAuth()}
                          className="bg-surface-elevated h-[56px]"
                        />
                      </FormField>
                    ) : (
                      <Box className="grid min-h-[96px] gap-2 py-2">
                        <Box className="flex items-center justify-between">
                          <Checkbox
                            checked={rememberMe}
                            onCheckedChange={(next) => setRememberMe(Boolean(next))}
                            label={t("keepLoggedIn")}
                            size="sm"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-muted hover:bg-surface-elevated hover:text-foreground h-8 rounded-[var(--radius-sm)] px-2 text-[13px] font-medium"
                            onClick={handleForgotPassword}
                            loading={forgotPasswordMutation.isPending}
                          >
                            {t("forgotPassword")}
                          </Button>
                        </Box>
                        {verificationLoginEmail ? (
                          <Box className="flex items-center justify-between gap-2">
                            <Typography as="p" variant="bodySm" color="muted">
                              {t("verificationLoginRequired")}
                            </Typography>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="shrink-0 px-1"
                              disabled={verificationCooldown > 0}
                              loading={resendVerificationMutation.isPending}
                              onClick={() =>
                                resendVerificationMutation.mutate({
                                  email: verificationLoginEmail,
                                  next: nextPath
                                })
                              }
                            >
                              {verificationCooldown > 0
                                ? t("verificationResendCooldown", { seconds: verificationCooldown })
                                : t("resendVerificationFromLogin")}
                            </Button>
                          </Box>
                        ) : null}
                      </Box>
                    )}
                  </Box>

                  <Button
                    type="button"
                    className="h-[54px] rounded-full text-[20px] font-semibold"
                    loading={authMode === "signup" ? signupMutation.isPending : loginMutation.isPending}
                    onClick={() => submitAuth()}
                  >
                    {authMode === "signup"
                      ? signupMutation.isPending
                        ? t("signingUp")
                        : t("signupSubmit")
                      : loginMutation.isPending
                        ? t("loggingIn")
                        : t("submit")}
                  </Button>
                </Box>
              </CardContent>
            </Box>
          </Box>
        </Box>
      </Card>
    </Box>
  );
}
