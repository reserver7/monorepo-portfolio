"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAppForm } from "@repo/forms";
import {
  Badge,
  Box,
  Button,
  ConsoleAppLayout,
  Flex,
  Input,
  Typography,
  toast,
  useDisclosure
} from "@repo/ui";
import { Bell, Menu, Search, SlidersHorizontal } from "lucide-react";
import { OPS_ALERT_EVENT_NAME, useOpsAlertStore, type CreateOpsAlertInput } from "@/features/alerts";
import { AlertsModal, OpsFilterSheet, type OpsFilterFormValues, ProfileMenu } from "@/features/modals";
import { useOpsFilterStore } from "@/features/stores";
import { opsNavItems } from "@/lib/navigation";
import { toCalendarLocale } from "@/lib/i18n/messages";

const NAV_LABEL_KEYS: Record<string, string> = {
  "/": "dashboard",
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
  const pathname = usePathname();
  const router = useRouter();
  const { isOpen: mobileOpen, onOpen: openMobile, onClose: closeMobile } = useDisclosure();
  const { isOpen: alertModalOpen, onOpen: openAlertModal, onClose: closeAlertModal } = useDisclosure();
  const { isOpen: filterSheetOpen, onOpen: openFilterSheet, onClose: closeFilterSheet } = useDisclosure();

  const environment = useOpsFilterStore((state) => state.environment);
  const locale = useOpsFilterStore((state) => state.locale);
  const serviceName = useOpsFilterStore((state) => state.serviceName);
  const search = useOpsFilterStore((state) => state.search);
  const from = useOpsFilterStore((state) => state.from);
  const to = useOpsFilterStore((state) => state.to);
  const sidebarCollapsed = useOpsFilterStore((state) => state.sidebarCollapsed);
  const setEnvironment = useOpsFilterStore((state) => state.setEnvironment);
  const setLocale = useOpsFilterStore((state) => state.setLocale);
  const setServiceName = useOpsFilterStore((state) => state.setServiceName);
  const setSearch = useOpsFilterStore((state) => state.setSearch);
  const setRange = useOpsFilterStore((state) => state.setRange);
  const toggleSidebar = useOpsFilterStore((state) => state.toggleSidebar);

  const alerts = useOpsAlertStore((state) => state.alerts);
  const addAlert = useOpsAlertStore((state) => state.addAlert);
  const markRead = useOpsAlertStore((state) => state.markRead);
  const markAllRead = useOpsAlertStore((state) => state.markAllRead);
  const removeAlert = useOpsAlertStore((state) => state.removeAlert);

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

  const unreadAlertCount = alerts.filter((item) => !item.readAt).length;
  const draftSheetLocale = watchLocaleDraft ?? locale;
  const draftCalendarLocale = toCalendarLocale(draftSheetLocale);
  const sortedAlerts = useMemo(
    () => [...alerts].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [alerts]
  );
  const localizedNavItems = useMemo(
    () =>
      opsNavItems.map((item) => {
        const key = NAV_LABEL_KEYS[item.href];
        return { ...item, label: key ? tNav(key) : item.label };
      }),
    [tNav]
  );
  const activeFilterCount = [locale !== "ko", serviceName !== "all", Boolean(fromDateFromStore), Boolean(toDateFromStore)].filter(
    Boolean
  ).length;
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
    const listener = (event: Event) => {
      const custom = event as CustomEvent<CreateOpsAlertInput>;
      const detail = custom.detail;
      if (!detail?.title) return;

      addAlert(detail);
      const color = detail.level === "critical" ? "error" : detail.level === "high" ? "warning" : "info";
      toast[color](detail.title);
    };

    window.addEventListener(OPS_ALERT_EVENT_NAME, listener as EventListener);
    return () => window.removeEventListener(OPS_ALERT_EVENT_NAME, listener as EventListener);
  }, [addAlert]);

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
        <Flex className="w-full items-center justify-between gap-[var(--space-3)]">
          <Flex className="min-w-0 flex-1 items-center gap-[var(--space-2)]">
            <Button
              variant="secondary"
              size="sm"
              iconOnly
              leftIcon={<Menu />}
              onClick={openMobile}
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
                          size="md"
                          shape="pill"
                          truncate
                          maxWidth={220}
                          interactive
                          removable
                          removeLabel={`${term} 삭제`}
                          onRemove={() => deleteRecentSearch(term)}
                          className="text-foreground h-[var(--chip-height)] hover:bg-surface-elevated cursor-pointer"
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

            <ProfileMenu onMoveToSettings={() => router.push("/settings")} />
          </Flex>
        </Flex>
      }
      brandEyebrow={tCommon("brandEyebrow")}
      brandTitle={tCommon("brandTitle")}
    >
      <>
        {children}
        <AlertsModal
          open={alertModalOpen}
          onOpenChange={(nextOpen) => (nextOpen ? openAlertModal() : closeAlertModal())}
          alerts={sortedAlerts}
          onMarkAllRead={markAllRead}
          onMarkRead={markRead}
          onRemoveAlert={removeAlert}
          onMoveToIssues={(id) => {
            markRead(id);
            closeAlertModal();
            router.push("/issues");
          }}
        />
        <OpsFilterSheet
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
      </>
    </ConsoleAppLayout>
  );
}
