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
  signupWithPassword,
  validateCurrentSession
} from "@/lib/auth";
import { resolveLocalizedError } from "@/lib/i18n/errors";

type LoginFormValues = {
  email: string;
  password: string;
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
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [rememberMe, setRememberMe] = useState(true);
  const [entered, setEntered] = useState(false);

  const form = useAppForm<LoginFormValues>({
    mode: "onSubmit",
    reValidateMode: "onBlur",
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: ""
    }
  });

  const loginMutation = useMutation({
    mutationFn: loginWithPassword,
    onSuccess: () => {
      toast.success(t("loginSuccess"));
      router.replace(nextPath);
    },
    onError: (error) => {
      toast.error(resolveLocalizedError(error, tError as never, t("loginErrorFallback")));
    }
  });

  const signupMutation = useMutation({
    mutationFn: signupWithPassword,
    onSuccess: () => {
      toast.success(t("signupSuccess"));
      router.replace(nextPath);
    },
    onError: (error) => {
      toast.error(resolveLocalizedError(error, tError as never, t("signupErrorFallback")));
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
        password: values.password
      });
      return;
    }

    loginMutation.mutate({
      email: values.email.trim(),
      password: values.password,
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
                      <Box className="flex h-[96px] items-center justify-between">
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
