"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useAppForm } from "@repo/forms";
import { useMutation, useQuery, useQueryClient } from "@repo/react-query";
import { Badge, Box, Button, Flex, Input, Typography, toast, useDisclosure } from "@repo/ui";
import {
  createOpsAlert,
  deleteOpsAlert,
  getOpsAlerts,
  markAllOpsAlertsRead,
  markOpsAlertRead,
  opslensQueryKeys,
  type OpsAlert as ApiOpsAlert
} from "@repo/opslens";
import { Bell, Menu, Search, SlidersHorizontal } from "lucide-react";
import { OPS_ALERT_EVENT_NAME, useOpsAlertStore, type CreateOpsAlertInput } from "@/features/alerts";
import { ProfileMenu, type OpsFilterFormValues } from "@/features/modals";
import type { OpsAlert } from "@/features/alerts";
import { useOpsFilterStore } from "@/features/common/stores";
import { readNotificationPolicy } from "@/lib/auth";
import { toCalendarLocale } from "@/lib/i18n/messages";

const LazyAlertsModal = dynamic(
  () => import("@/features/modals").then((mod) => mod.AlertsModal),
  { ssr: false }
);
const LazyOpsFilterSheet = dynamic(
  () => import("@/features/modals").then((mod) => mod.OpsFilterSheet),
  { ssr: false }
);

const toUiAlert = (alert: ApiOpsAlert): OpsAlert => ({
  id: alert.id,
  title: alert.title,
  message: alert.message,
  level: alert.level === "low" ? "info" : alert.level,
  source: alert.source,
  link: alert.link ?? undefined,
  createdAt: alert.createdAt,
  readAt: alert.readAt ?? undefined
});

type AppShellHeaderControlsProps = {
  pathname: string;
  querySnapshot: string;
  authProfile: {
    name: string;
    email: string;
    role: string;
    authProvider: "local" | "google" | "github";
  } | null;
  avatarColor: string;
  onOpenMobile: () => void;
  onLogout: () => Promise<void>;
};

export default function AppShellHeaderControls({
  pathname,
  querySnapshot,
  authProfile,
  avatarColor,
  onOpenMobile,
  onLogout
}: AppShellHeaderControlsProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const tCommon = useTranslations("common");

  const environment = useOpsFilterStore((state) => state.environment);
  const locale = useOpsFilterStore((state) => state.locale);
  const serviceName = useOpsFilterStore((state) => state.serviceName);
  const search = useOpsFilterStore((state) => state.search);
  const from = useOpsFilterStore((state) => state.from);
  const to = useOpsFilterStore((state) => state.to);
  const setEnvironment = useOpsFilterStore((state) => state.setEnvironment);
  const setLocale = useOpsFilterStore((state) => state.setLocale);
  const setServiceName = useOpsFilterStore((state) => state.setServiceName);
  const setSearch = useOpsFilterStore((state) => state.setSearch);
  const setRange = useOpsFilterStore((state) => state.setRange);

  const { isOpen: alertModalOpen, onOpen: openAlertModal, onClose: closeAlertModal } = useDisclosure();
  const { isOpen: filterSheetOpen, onOpen: openFilterSheet, onClose: closeFilterSheet } = useDisclosure();

  const filterForm = useAppForm<OpsFilterFormValues>({
    defaultValues: {
      environment,
      locale,
      serviceName,
      fromDate: from?.slice(0, 10) ?? "",
      toDate: to?.slice(0, 10) ?? "",
      search
    }
  });

  const watchFromDate = filterForm.watch("fromDate");
  const watchToDate = filterForm.watch("toDate");
  const watchLocaleDraft = filterForm.watch("locale");
  const watchSearch = filterForm.watch("search");

  const fromDateFromStore = from?.slice(0, 10) ?? "";
  const toDateFromStore = to?.slice(0, 10) ?? "";

  useEffect(() => {
    if (filterForm.getValues("search") !== search) {
      filterForm.setValue("search", search);
    }
    if (filterForm.getValues("environment") !== environment) {
      filterForm.setValue("environment", environment);
    }
    if (filterForm.getValues("locale") !== locale) {
      filterForm.setValue("locale", locale);
    }
    if (filterForm.getValues("serviceName") !== serviceName) {
      filterForm.setValue("serviceName", serviceName);
    }
    if (filterForm.getValues("fromDate") !== fromDateFromStore) {
      filterForm.setValue("fromDate", fromDateFromStore);
    }
    if (filterForm.getValues("toDate") !== toDateFromStore) {
      filterForm.setValue("toDate", toDateFromStore);
    }
  }, [environment, filterForm, fromDateFromStore, locale, search, serviceName, toDateFromStore]);

  const fromDate = watchFromDate ?? "";
  const toDate = watchToDate ?? "";

  const [searchPanelOpen, setSearchPanelOpen] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>(["결제 오류", "API 500", "socket timeout"]);
  const searchWrapRef = useRef<HTMLDivElement | null>(null);
  const [urlFilterSyncInitialized, setUrlFilterSyncInitialized] = useState(false);
  const [focusModeEnabled, setFocusModeEnabled] = useState(false);

  const alerts = useOpsAlertStore((state) => state.alerts);
  const addAlert = useOpsAlertStore((state) => state.addAlert);
  const markRead = useOpsAlertStore((state) => state.markRead);
  const markAllRead = useOpsAlertStore((state) => state.markAllRead);
  const removeAlert = useOpsAlertStore((state) => state.removeAlert);
  const replaceAlerts = useOpsAlertStore((state) => state.replaceAlerts);

  const alertsQuery = useQuery({
    queryKey: opslensQueryKeys.alerts(),
    queryFn: getOpsAlerts,
    staleTime: 15_000
  });

  useEffect(() => {
    if (!alertsQuery.data) return;
    replaceAlerts(alertsQuery.data.map(toUiAlert));
  }, [alertsQuery.data, replaceAlerts]);

  const createAlertMutation = useMutation({
    mutationFn: (input: CreateOpsAlertInput) =>
      createOpsAlert({
        title: input.title,
        message: input.message ?? input.title,
        level: input.level === "info" ? "low" : input.level ?? "low",
        source: input.source ?? "web",
        link: input.link
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: opslensQueryKeys.alerts() });
    }
  });

  const markReadMutation = useMutation({
    mutationFn: markOpsAlertRead,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: opslensQueryKeys.alerts() });
    }
  });

  const markAllReadMutation = useMutation({
    mutationFn: markAllOpsAlertsRead,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: opslensQueryKeys.alerts() });
    }
  });

  const deleteAlertMutation = useMutation({
    mutationFn: deleteOpsAlert,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: opslensQueryKeys.alerts() });
    }
  });

  const handleMarkRead = (id: string) => {
    markRead(id);
    markReadMutation.mutate(id);
  };

  const handleMarkAllRead = () => {
    markAllRead();
    markAllReadMutation.mutate();
  };

  const handleRemoveAlert = (id: string) => {
    removeAlert(id);
    deleteAlertMutation.mutate(id);
  };

  const unreadAlertCount = alerts.filter((item) => !item.readAt).length;
  const draftSheetLocale = watchLocaleDraft ?? locale;
  const draftCalendarLocale = toCalendarLocale(draftSheetLocale);
  const sortedAlerts = useMemo(
    () => [...alerts].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [alerts]
  );

  const activeFilterCount = [
    locale !== "ko",
    serviceName !== "all",
    Boolean(fromDateFromStore),
    Boolean(toDateFromStore)
  ].filter(Boolean).length;
  const visibleRecent = useMemo(() => recentSearches.slice(0, 5), [recentSearches]);

  const pushRecentSearch = (term: string) => {
    const next = term.trim();
    if (!next) return;
    setRecentSearches((prev) => [next, ...prev.filter((item) => item !== next)].slice(0, 8));
  };

  const applySearchTerm = (term: string) => {
    const next = term.trim();
    filterForm.setValue("search", next);
    setSearch(next);
    pushRecentSearch(next);
    setSearchPanelOpen(false);
  };

  const deleteRecentSearch = (term: string) => {
    setRecentSearches((prev) => prev.filter((item) => item !== term));
  };

  const clearSearch = () => {
    filterForm.setValue("search", "");
    setSearch("");
    setSearchPanelOpen(false);
  };

  const toggleFocusMode = () => {
    const nextEnabled = !focusModeEnabled;
    setFocusModeEnabled(nextEnabled);
    window.localStorage.setItem("opslens.focus-mode", nextEnabled ? "1" : "0");
    toast.info(nextEnabled ? "운영 집중 모드가 켜졌습니다." : "운영 집중 모드가 꺼졌습니다.");
  };

  const commitSearch = () => {
    const next = watchSearch.trim();
    setSearch(next);
    if (next) {
      pushRecentSearch(next);
    }
    setSearchPanelOpen(false);
  };

  const resetDraftFilters = () => {
    filterForm.setValue("environment", "prod");
    filterForm.setValue("locale", "ko");
    filterForm.setValue("serviceName", "all");
    filterForm.setValue("fromDate", "");
    filterForm.setValue("toDate", "");
  };

  const applyDraftFilters = () => {
    const nextEnvironment = filterForm.getValues("environment");
    const nextLocale = filterForm.getValues("locale");
    const nextServiceName = filterForm.getValues("serviceName");
    const nextFromDate = filterForm.getValues("fromDate");
    const nextToDate = filterForm.getValues("toDate");

    setEnvironment(nextEnvironment);
    setLocale(nextLocale);
    setServiceName(nextServiceName);
    setRange(
      nextFromDate ? `${nextFromDate}T00:00:00.000Z` : undefined,
      nextToDate ? `${nextToDate}T23:59:59.999Z` : undefined
    );
    closeFilterSheet();
  };

  useEffect(() => {
    if (!filterSheetOpen) return;
    filterForm.setValue("environment", environment);
    filterForm.setValue("locale", locale);
    filterForm.setValue("serviceName", serviceName);
    filterForm.setValue("fromDate", fromDateFromStore);
    filterForm.setValue("toDate", toDateFromStore);
  }, [environment, filterForm, filterSheetOpen, fromDateFromStore, locale, serviceName, toDateFromStore]);

  useEffect(() => {
    const params = new URLSearchParams(querySnapshot);
    const nextEnvironment = params.get("env");
    const nextLocale = params.get("lang");
    const nextServiceName = params.get("service");
    const nextSearch = params.get("q");
    const nextFromDate = params.get("from");
    const nextToDate = params.get("to");

    const resolvedEnvironment = nextEnvironment === "dev" || nextEnvironment === "stage" || nextEnvironment === "prod" ? nextEnvironment : "prod";
    if (resolvedEnvironment !== environment) setEnvironment(resolvedEnvironment);

    if ((nextLocale === "ko" || nextLocale === "en" || nextLocale === "ja") && nextLocale !== locale) {
      setLocale(nextLocale);
    }

    const resolvedServiceName =
      typeof nextServiceName === "string" && nextServiceName.trim().length > 0 ? nextServiceName : "all";
    if (resolvedServiceName !== serviceName) setServiceName(resolvedServiceName);

    const normalizedSearchFromUrl = nextSearch?.trim() ?? "";
    if (normalizedSearchFromUrl !== search) setSearch(normalizedSearchFromUrl);

    const normalizedFrom =
      typeof nextFromDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(nextFromDate)
        ? `${nextFromDate}T00:00:00.000Z`
        : undefined;
    const normalizedTo =
      typeof nextToDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(nextToDate)
        ? `${nextToDate}T23:59:59.999Z`
        : undefined;
    if (normalizedFrom !== from || normalizedTo !== to) {
      setRange(normalizedFrom, normalizedTo);
    }

    if (!urlFilterSyncInitialized) setUrlFilterSyncInitialized(true);
  }, [
    environment,
    from,
    locale,
    querySnapshot,
    search,
    serviceName,
    setEnvironment,
    setLocale,
    setRange,
    setSearch,
    setServiceName,
    to,
    urlFilterSyncInitialized
  ]);

  useEffect(() => {
    if (!urlFilterSyncInitialized) return;

    const params = new URLSearchParams(querySnapshot);
    const normalizedSearch = search.trim();

    if (environment === "prod") params.delete("env");
    else params.set("env", environment);
    params.delete("lang");

    if (!serviceName || serviceName === "all") params.delete("service");
    else params.set("service", serviceName);

    if (normalizedSearch.length === 0) params.delete("q");
    else params.set("q", normalizedSearch);

    if (fromDateFromStore) params.set("from", fromDateFromStore);
    else params.delete("from");

    if (toDateFromStore) params.set("to", toDateFromStore);
    else params.delete("to");

    const nextSorted = Array.from(params.entries()).sort(([a], [b]) => a.localeCompare(b));
    const currentSorted = Array.from(new URLSearchParams(querySnapshot).entries()).sort(([a], [b]) => a.localeCompare(b));
    if (JSON.stringify(nextSorted) === JSON.stringify(currentSorted)) return;

    const nextQuery = new URLSearchParams(nextSorted).toString();
    router.replace(nextQuery.length > 0 ? `${pathname}?${nextQuery}` : pathname);
  }, [
    environment,
    fromDateFromStore,
    pathname,
    querySnapshot,
    router,
    search,
    serviceName,
    toDateFromStore,
    urlFilterSyncInitialized
  ]);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (!searchWrapRef.current) return;
      if (!searchWrapRef.current.contains(event.target as Node)) {
        setSearchPanelOpen(false);
      }
    };

    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  useEffect(() => {
    setFocusModeEnabled(window.localStorage.getItem("opslens.focus-mode") === "1");
  }, []);

  useEffect(() => {
    const listener = (event: Event) => {
      const custom = event as CustomEvent<CreateOpsAlertInput>;
      const detail = custom.detail;
      if (!detail?.title) return;

      const policy = readNotificationPolicy();
      if (!policy.inAppEnabled) return;
      if (policy.minLevel === "critical" && detail.level !== "critical") return;
      if (policy.minLevel === "high" && detail.level !== "critical" && detail.level !== "high") return;
      if (focusModeEnabled && detail.level !== "critical" && detail.level !== "high") return;

      if (policy.quietHoursEnabled) {
        const [fromHourRaw, fromMinRaw] = policy.quietFrom.split(":");
        const [toHourRaw, toMinRaw] = policy.quietTo.split(":");
        const fromHour = Number(fromHourRaw ?? "22");
        const fromMin = Number(fromMinRaw ?? "0");
        const toHour = Number(toHourRaw ?? "8");
        const toMin = Number(toMinRaw ?? "0");
        const now = new Date();
        const nowMinutes = now.getHours() * 60 + now.getMinutes();
        const fromMinutes = fromHour * 60 + fromMin;
        const toMinutes = toHour * 60 + toMin;
        const inQuietWindow = fromMinutes <= toMinutes
          ? nowMinutes >= fromMinutes && nowMinutes < toMinutes
          : nowMinutes >= fromMinutes || nowMinutes < toMinutes;
        if (inQuietWindow) return;
      }

      addAlert(detail);
      createAlertMutation.mutate(detail);
      const color = detail.level === "critical" ? "error" : detail.level === "high" ? "warning" : "info";
      toast[color](detail.title);
    };

    window.addEventListener(OPS_ALERT_EVENT_NAME, listener as EventListener);
    return () => window.removeEventListener(OPS_ALERT_EVENT_NAME, listener as EventListener);
  }, [addAlert, createAlertMutation, focusModeEnabled]);

  return (
    <>
      <Flex className="w-full items-center justify-between gap-[var(--space-3)]">
        <Flex className="min-w-0 flex-1 items-center gap-[var(--space-2)]">
          <Button
            variant="secondary"
            size="sm"
            iconOnly
            leftIcon={<Menu />}
            onClick={onOpenMobile}
            className="inline-flex md:hidden"
            aria-label={tCommon("openSidebar")}
          />

          <Box ref={searchWrapRef} className="relative w-full max-w-[420px]">
            <Input
              value={watchSearch}
              onFocus={() => setSearchPanelOpen(true)}
              onChange={(event) => {
                filterForm.setValue("search", event.target.value);
                setSearchPanelOpen(true);
              }}
              onEnter={() => commitSearch()}
              onEscape={() => setSearchPanelOpen(false)}
              prefix={<Search className="h-[var(--size-icon-md)] w-[var(--size-icon-md)]" />}
              clearable
              onClear={clearSearch}
              placeholder={tCommon("searchPlaceholder")}
              className="text-body-md h-[var(--toolbar-height)]"
            />

            {searchPanelOpen ? (
              <Box className="border-default bg-surface absolute left-0 top-[calc(100%+6px)] z-30 w-full rounded-[var(--radius-md)] border p-[var(--space-2)] shadow-md">
                <Flex className="items-center justify-between pb-[var(--space-1)]">
                  <Typography as="p" variant="caption" color="muted">
                    {tCommon("recentSearch")}
                  </Typography>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="text-muted h-[var(--size-control-sm)] rounded-sm px-[var(--space-2)] text-[11px]"
                    onClick={() => setRecentSearches([])}
                  >
                    {tCommon("clearAll")}
                  </Button>
                </Flex>

                {visibleRecent.length > 0 ? (
                  <Flex className="flex-wrap gap-[var(--space-1)]">
                    {visibleRecent.map((term) => (
                      <Badge
                        key={term}
                        variant="outline"
                        size="sm"
                        shape="rounded"
                        truncate
                        maxWidth={220}
                        interactive
                        removable
                        removeLabel={`${term} 삭제`}
                        onRemove={() => deleteRecentSearch(term)}
                        className="text-foreground text-caption hover:bg-surface-elevated [&_button_svg]:h-[var(--size-icon-sm)] [&_button_svg]:w-[var(--size-icon-sm)] cursor-pointer"
                        onClick={() => applySearchTerm(term)}
                      >
                        {term}
                      </Badge>
                    ))}
                  </Flex>
                ) : (
                  <Typography as="p" variant="caption" color="muted" className="py-[var(--space-1)]">
                    {tCommon("recentSearchEmpty")}
                  </Typography>
                )}
              </Box>
            ) : null}
          </Box>
        </Flex>

        <Flex className="items-center gap-[var(--space-1)] md:gap-[var(--space-2)]">
          <Button
            variant="ghost"
            size="sm"
            iconOnly
            leftIcon={<SlidersHorizontal />}
            className={`border-default bg-surface-elevated hover:bg-surface relative h-[var(--size-control-md)] w-[var(--size-control-md)] rounded-md border p-0 ${
              activeFilterCount > 0 ? "text-primary" : "text-foreground"
            }`}
            aria-label={tCommon("openFilters")}
            onClick={openFilterSheet}
          >
            {activeFilterCount > 0 ? (
              <Box as="span" className="absolute right-0 top-0 -translate-y-1/2 translate-x-1/2">
                <Badge
                  variant="dangerSolid"
                  size="sm"
                  className="h-[var(--size-chip-sm)] min-w-[var(--size-chip-sm)] justify-center px-[var(--space-1)] text-[10px] font-semibold leading-none"
                >
                  {activeFilterCount}
                </Badge>
              </Box>
            ) : null}
          </Button>

          <Box as="span" className="relative inline-flex">
            <Button
              variant="ghost"
              size="sm"
              iconOnly
              leftIcon={<Bell />}
              className={`border-default bg-surface-elevated hover:bg-surface h-[var(--size-control-md)] w-[var(--size-control-md)] rounded-md border p-0 ${
                unreadAlertCount > 0 ? "text-primary" : "text-foreground"
              }`}
              aria-label={tCommon("openAlerts")}
              onClick={openAlertModal}
            />
            {unreadAlertCount > 0 ? (
              <Box as="span" className="absolute right-0 top-0 -translate-y-1/2 translate-x-1/2">
                <Badge
                  variant="dangerSolid"
                  size="sm"
                  className="h-[var(--size-chip-sm)] min-w-[var(--size-chip-sm)] justify-center px-[var(--space-1)] text-[10px] font-semibold leading-none"
                >
                  {unreadAlertCount}
                </Badge>
              </Box>
            ) : null}
          </Box>

          <ProfileMenu
            userName={authProfile?.name ?? "User"}
            userEmail={authProfile?.email ?? "-"}
            userRole={authProfile?.role ?? "viewer"}
            avatarColor={avatarColor}
            focusModeEnabled={focusModeEnabled}
            onMoveToProfile={() => router.push("/settings?tab=profile")}
            onMoveToMyIssues={() => router.push("/issues?assignee=me")}
            onMoveToNotifications={() => router.push("/settings?tab=notifications")}
            onMoveToWorkspace={() => router.push("/settings?tab=workspace")}
            onMoveToAudit={() => router.push("/settings?tab=audit")}
            onToggleFocusMode={toggleFocusMode}
            onLogout={onLogout}
          />
        </Flex>
      </Flex>

      {alertModalOpen ? (
        <LazyAlertsModal
          open={alertModalOpen}
          onOpenChange={(nextOpen) => (nextOpen ? openAlertModal() : closeAlertModal())}
          alerts={sortedAlerts}
          onMarkAllRead={handleMarkAllRead}
          onMarkRead={handleMarkRead}
          onRemoveAlert={handleRemoveAlert}
          onMoveToAlert={(alert) => {
            closeAlertModal();
            router.push(alert.link ?? "/issues");
          }}
        />
      ) : null}

      {filterSheetOpen ? (
        <LazyOpsFilterSheet
          locale={draftSheetLocale}
          calendarLocale={draftCalendarLocale}
          open={filterSheetOpen}
          onOpenChange={(nextOpen) => (nextOpen ? openFilterSheet() : closeFilterSheet())}
          control={filterForm.control}
          fromDate={fromDate}
          toDate={toDate}
          onRangeChange={(nextRange) => {
            filterForm.setValue("fromDate", nextRange.from ?? "");
            filterForm.setValue("toDate", nextRange.to ?? "");
          }}
          onReset={resetDraftFilters}
          onApply={applyDraftFilters}
        />
      ) : null}
    </>
  );
}
