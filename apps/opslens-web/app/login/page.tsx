"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useTheme } from "next-themes";
import { useAppForm } from "@repo/forms";
import { useMutation } from "@repo/react-query";
import { Box, Button, Card, CardContent, Checkbox, FormField, Input, Typography, toast } from "@repo/ui";
import { loginWithPassword, readAuthSession, requestPasswordReset, signupWithPassword } from "@/lib/auth";

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

const getErrorMessage = (error: unknown, fallback: string): string => {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }
  return fallback;
};

const deriveNameFromEmail = (email: string): string => {
  const localPart = email.split("@")[0]?.trim();
  return localPart && localPart.length > 0 ? localPart : "user";
};

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { resolvedTheme } = useTheme();

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
      toast.success("로그인되었습니다.");
      router.replace(nextPath);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "로그인에 실패했습니다."));
    }
  });

  const signupMutation = useMutation({
    mutationFn: signupWithPassword,
    onSuccess: () => {
      toast.success("회원가입이 완료되었습니다.");
      router.replace(nextPath);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "회원가입에 실패했습니다."));
    }
  });

  const forgotPasswordMutation = useMutation({
    mutationFn: requestPasswordReset,
    onSuccess: () => {
      toast.success("비밀번호 재설정 요청이 접수되었습니다.");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "비밀번호 재설정 요청 처리에 실패했습니다."));
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
        form.setError("confirmPassword", { type: "validate", message: "비밀번호가 일치하지 않습니다." });
        toast.error("비밀번호가 일치하지 않습니다.");
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
      form.setError("email", { type: "required", message: "이메일을 입력해 주세요." });
      toast.error("이메일을 먼저 입력해 주세요.");
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
    const session = readAuthSession();
    if (session?.accessToken) {
      router.replace(nextPath);
    }
  }, [nextPath, router]);

  useEffect(() => {
    if (!oauthPending) return;
    router.replace(`/oauth/callback?next=${encodeURIComponent(nextPath)}`);
  }, [nextPath, oauthPending, router]);

  useEffect(() => {
    if (!oauthError) return;
    toast.error("소셜 로그인 인증에 실패했습니다. 다시 시도해 주세요.");
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
                {authMode === "login" ? "Hello, Friend!" : "Welcome Back!"}
              </Typography>
              <Typography as="p" className="max-w-[380px] text-[18px] leading-[1.55] text-white">
                {authMode === "login"
                  ? "Enter your personal details and start your journey with us"
                  : "To stay connected with us, please log in with your personal info"}
              </Typography>
              <Button
                type="button"
                variant="outline"
                className="hover:bg-white/12 mt-[var(--space-3)] h-[54px] min-w-[220px] rounded-full border-white/85 bg-transparent text-white"
                onClick={() => switchMode(authMode === "login" ? "signup" : "login")}
              >
                {authMode === "login" ? "SIGN UP" : "SIGN IN"}
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
                  {authMode === "signup" ? "Create Account" : "Sign in"}
                </Typography>
                <Typography as="p" variant="bodyMd" color="muted" className="leading-[1.6]">
                  or use your {authMode === "signup" ? "email for registration" : "account"}
                </Typography>
              </Box>

              <CardContent className="mt-[var(--space-1)] px-0 pb-0">
                <Box ref={formBodyRef} className="grid gap-[var(--space-3)]">
                  <Box className="flex justify-center gap-[var(--space-3)]">
                    <Button
                      type="button"
                      variant="secondary"
                      className="border-default h-[56px] w-[56px] rounded-full border p-0"
                      aria-label="Continue with Google"
                      onClick={() => startOAuthLogin("google")}
                    >
                      <Image src="/icons/google-color.svg" alt="Google" width={22} height={22} />
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      className="border-default h-[56px] w-[56px] rounded-full border p-0"
                      aria-label="Continue with GitHub"
                      onClick={() => startOAuthLogin("github")}
                    >
                      <Image
                        src={resolvedTheme === "dark" ? "/icons/github-mark-white.svg" : "/icons/github-mark.svg"}
                        alt="GitHub"
                        width={22}
                        height={22}
                      />
                    </Button>
                  </Box>

                  <FormField label="Email" htmlFor="opslens-login-email">
                    <Input
                      id="opslens-login-email"
                      type="email"
                      autoComplete="email"
                      control={form.control}
                      name="email"
                      rules={{
                        required: "이메일을 입력해 주세요.",
                        pattern: {
                          value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                          message: "올바른 이메일 형식을 입력해 주세요."
                        }
                      }}
                      errorMessage={form.formState.errors.email?.message}
                      onEnter={() => submitAuth()}
                      className="bg-surface-elevated h-[56px]"
                    />
                  </FormField>

                  <FormField label="Password" htmlFor="opslens-login-password">
                    <Input
                      id="opslens-login-password"
                      type="password"
                      autoComplete={authMode === "signup" ? "new-password" : "current-password"}
                      control={form.control}
                      name="password"
                      rules={{
                        required: "비밀번호를 입력해 주세요.",
                        minLength: {
                          value: 8,
                          message: "비밀번호는 8자 이상이어야 합니다."
                        }
                      }}
                      errorMessage={form.formState.errors.password?.message}
                      onEnter={() => submitAuth()}
                      className="bg-surface-elevated h-[56px]"
                    />
                  </FormField>

                  <Box className="min-h-[96px]">
                    {authMode === "signup" ? (
                      <FormField label="Confirm Password" htmlFor="opslens-signup-confirm-password">
                        <Input
                          id="opslens-signup-confirm-password"
                          type="password"
                          autoComplete="new-password"
                          control={form.control}
                          name="confirmPassword"
                          rules={{
                            required: "비밀번호 확인을 입력해 주세요.",
                            validate: (value) =>
                              authMode !== "signup" ||
                              value === form.getValues("password") ||
                              "비밀번호가 일치하지 않습니다."
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
                          label="Keep me logged in"
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
                          Forgot Password?
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
                        ? "Signing up..."
                        : "Sign up"
                      : loginMutation.isPending
                        ? "Signing in..."
                        : "Sign in"}
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
