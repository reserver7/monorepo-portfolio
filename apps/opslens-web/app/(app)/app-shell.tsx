"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { signOut } from "next-auth/react";
import { useTranslations } from "next-intl";
import { subscribeHttpUnauthorized } from "@repo/react-query";
import { Box, ConsoleAppLayout, Skeleton, toast, useDisclosure } from "@repo/ui";
import {
  clearAuthSession,
  logoutCurrentSession,
  OPS_AVATAR_COLOR_CHANGED_EVENT,
  readAuthAvatarColor,
  validateCurrentSession
} from "@/lib/auth";
import { opsNavItems } from "@/lib/navigation";
import { useOpsFilterStore, useOpsFilterStoreApi } from "@/features/common/stores";

const DynamicAppShellHeaderControls = dynamic(() => import("./app-shell-header-controls"), {
  ssr: false,
  loading: () => <Box className="h-[var(--toolbar-height)] w-full" />
});

const NAV_LABEL_KEYS: Record<string, string> = {
  "/": "dashboard",
  "/command-center": "commandCenter",
  "/logs": "logs",
  "/issues": "issues",
  "/qa-assistant": "qaAssistant",
  "/deployments": "deployments",
  "/reports": "reports",
  "/settings": "settings"
};

export function AppShell({ children }: { children: React.ReactNode }) {
  const tCommon = useTranslations("common");
  const tNav = useTranslations("nav");
  const tAuth = useTranslations("auth");
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const querySnapshot = searchParams.toString();

  const { isOpen: mobileOpen, onOpen: openMobile, onClose: closeMobile } = useDisclosure();

  const sidebarCollapsed = useOpsFilterStore((state) => state.sidebarCollapsed);
  const toggleSidebar = useOpsFilterStore((state) => state.toggleSidebar);
  const filterStoreApi = useOpsFilterStoreApi();

  const [authReady, setAuthReady] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [authProfile, setAuthProfile] = useState<{
    name: string;
    email: string;
    role: string;
    authProvider: "local" | "google" | "github";
  } | null>(null);
  const [avatarColor, setAvatarColor] = useState<string>("#64748B");

  useEffect(() => {
    setAvatarColor(readAuthAvatarColor());
  }, [pathname]);

  useEffect(() => {
    const listener = (event: Event) => {
      const custom = event as CustomEvent<{ avatarColor?: string }>;
      if (custom.detail?.avatarColor) {
        setAvatarColor(custom.detail.avatarColor);
      }
    };
    window.addEventListener(OPS_AVATAR_COLOR_CHANGED_EVENT, listener as EventListener);
    return () => window.removeEventListener(OPS_AVATAR_COLOR_CHANGED_EVENT, listener as EventListener);
  }, []);

  const localizedNavItems = useMemo(
    () =>
      opsNavItems.map((item) => {
        const key = NAV_LABEL_KEYS[item.href];
        return { ...item, label: key ? tNav(key) : item.label };
      }),
    [tNav]
  );

  useEffect(() => {
    let active = true;
    setAuthReady(false);
    void validateCurrentSession().then((session) => {
      if (!active) return;
      if (!session?.accessToken) {
        const nextPath = `${pathname}${querySnapshot.length > 0 ? `?${querySnapshot}` : ""}`;
        router.replace(`/login?next=${encodeURIComponent(nextPath)}`);
        setAuthenticated(false);
        setAuthProfile(null);
        setAuthReady(true);
        return;
      }

      setAuthProfile({
        name: session.user.name,
        email: session.user.email,
        role: session.user.role,
        authProvider: session.user.authProvider ?? "local"
      });
      setAvatarColor(session.user.avatarColor);
      setAuthenticated(true);
      setAuthReady(true);
    });
    return () => {
      active = false;
    };
  }, [pathname, querySnapshot, router]);

  useEffect(
    () =>
      subscribeHttpUnauthorized(() => {
        clearAuthSession();
        setAuthenticated(false);
        setAuthProfile(null);
        toast.error(tAuth("sessionExpired"));
        const nextPath = `${pathname}${querySnapshot.length > 0 ? `?${querySnapshot}` : ""}`;
        router.replace(`/login?next=${encodeURIComponent(nextPath)}`);
      }),
    [pathname, querySnapshot, router, tAuth]
  );

  const handleLogout = async () => {
    await logoutCurrentSession();
    await signOut({ redirect: false }).catch(() => undefined);
    setAuthenticated(false);
    setAuthProfile(null);
    toast.success(tAuth("logoutSuccess"));
    router.replace("/login");
  };

  useEffect(() => {
    if (typeof window === "undefined") return;

    const media = window.matchMedia("(max-width: 767.98px)");
    const syncResponsiveSidebarState = (isMobile: boolean) => {
      if (isMobile) {
        if (filterStoreApi.getState().sidebarCollapsed) {
          filterStoreApi.setState({ sidebarCollapsed: false });
        }
        return;
      }

      closeMobile();
    };

    syncResponsiveSidebarState(media.matches);

    const onChange = (event: MediaQueryListEvent) => {
      syncResponsiveSidebarState(event.matches);
    };

    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [closeMobile, filterStoreApi]);

  if (!authReady || !authenticated) {
    return (
      <Box className="bg-surface min-h-screen space-y-[var(--space-4)] p-[var(--space-5)]" aria-busy="true" aria-label="세션을 확인하는 중입니다.">
        <Skeleton className="h-10 w-44 rounded-[var(--radius-md)]" />
        <Skeleton className="h-24 w-full rounded-[var(--radius-lg)]" />
        <Skeleton className="h-64 w-full rounded-[var(--radius-lg)]" />
      </Box>
    );
  }

  return (
    <ConsoleAppLayout
      pathname={pathname}
      navItems={localizedNavItems}
      sidebarCollapsed={sidebarCollapsed}
      mobileOpen={mobileOpen}
      onToggleSidebar={toggleSidebar}
      onOpenMobile={openMobile}
      onCloseMobile={closeMobile}
      headerTitle={tCommon("headerTitle")}
      headerContent={
        <DynamicAppShellHeaderControls
          pathname={pathname}
          querySnapshot={querySnapshot}
          authProfile={authProfile}
          avatarColor={avatarColor}
          onOpenMobile={openMobile}
          onLogout={handleLogout}
        />
      }
      brandEyebrow={tCommon("brandEyebrow")}
      brandTitle={tCommon("brandTitle")}
      brandSlot={
        sidebarCollapsed ? (
          <Box
            className="flex h-10 w-10 items-center justify-center"
            role="button"
            tabIndex={0}
            aria-label="대시보드로 이동"
            onClick={() => router.push("/")}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                router.push("/");
              }
            }}
          >
            <Image src="/icons/opslens-icon.svg" alt="OpsLens" width={40} height={40} priority />
          </Box>
        ) : (
          <Box
            className="flex h-10 w-[148px] items-center justify-start"
            role="button"
            tabIndex={0}
            aria-label="대시보드로 이동"
            onClick={() => router.push("/")}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                router.push("/");
              }
            }}
          >
            <Image src="/icons/opslens-logo.svg" alt="OpsLens" width={148} height={32} priority />
          </Box>
        )
      }
    >
      {children}
    </ConsoleAppLayout>
  );
}
