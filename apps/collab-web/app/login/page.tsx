import { redirect } from "next/navigation";
import { requiredAuthEnv } from "@/lib/auth/config";

interface LoginPageProps {
  searchParams: Promise<{ next?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { next = "/workspace" } = await searchParams;
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/workspace";
  const callback = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/auth/callback?next=${encodeURIComponent(safeNext)}`;
  const opsLogin = new URL("/login", requiredAuthEnv("OPSLENS_WEB_URL"));
  opsLogin.searchParams.set("next", `/api/opslens-auth/bridge?returnTo=${encodeURIComponent(callback)}`);
  redirect(opsLogin.toString());
}
