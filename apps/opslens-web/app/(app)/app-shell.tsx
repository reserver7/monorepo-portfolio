"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { useAppForm } from "@repo/forms";
import {
  Box,
  Avatar,
  Badge,
  Button,
  ConsoleAppLayout,
  DatePicker,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalDescription,
  ModalHeader,
  ModalTitle,
  Select,
  Flex,
  Typography,
  useDebouncedValue,
  useDisclosure
} from "@repo/ui";
import { AlertTriangle, Bell, LogOut, Menu, Search, Settings, UserCircle2 } from "lucide-react";
import { useOpsFilterStore } from "@/features/stores";
import { opsNavItems } from "@/lib/navigation";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isOpen: mobileOpen, onOpen: openMobile, onClose: closeMobile } = useDisclosure();
  const { isOpen: alertModalOpen, onOpen: openAlertModal, onClose: closeAlertModal } = useDisclosure();

  const environment = useOpsFilterStore((state) => state.environment);
  const serviceName = useOpsFilterStore((state) => state.serviceName);
  const search = useOpsFilterStore((state) => state.search);
  const from = useOpsFilterStore((state) => state.from);
  const to = useOpsFilterStore((state) => state.to);
  const sidebarCollapsed = useOpsFilterStore((state) => state.sidebarCollapsed);
  const setEnvironment = useOpsFilterStore((state) => state.setEnvironment);
  const setServiceName = useOpsFilterStore((state) => state.setServiceName);
  const setSearch = useOpsFilterStore((state) => state.setSearch);
  const setRange = useOpsFilterStore((state) => state.setRange);
  const toggleSidebar = useOpsFilterStore((state) => state.toggleSidebar);

  const filterForm = useAppForm<{
    environment: "dev" | "stage" | "prod";
    serviceName: string;
    fromDate: string;
    toDate: string;
    search: string;
  }>({
    defaultValues: {
      environment,
      serviceName,
      fromDate: from?.slice(0, 10) ?? "",
      toDate: to?.slice(0, 10) ?? "",
      search
    }
  });

  const watchEnvironment = filterForm.watch("environment");
  const watchServiceName = filterForm.watch("serviceName");
  const watchFromDate = filterForm.watch("fromDate");
  const watchToDate = filterForm.watch("toDate");
  const watchSearch = filterForm.watch("search");

  const debouncedSearch = useDebouncedValue(watchSearch, 250);
  const fromDateFromStore = from?.slice(0, 10) ?? "";
  const toDateFromStore = to?.slice(0, 10) ?? "";

  useEffect(() => {
    if (filterForm.getValues("search") !== search) {
      filterForm.setValue("search", search);
    }

    if (filterForm.getValues("environment") !== environment) {
      filterForm.setValue("environment", environment);
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
  }, [environment, filterForm, fromDateFromStore, search, serviceName, toDateFromStore]);

  useEffect(() => {
    if (debouncedSearch !== search) {
      setSearch(debouncedSearch);
    }
  }, [debouncedSearch, search, setSearch]);

  useEffect(() => {
    if (watchEnvironment !== environment) {
      setEnvironment(watchEnvironment);
    }
  }, [watchEnvironment, environment, setEnvironment]);

  useEffect(() => {
    if (watchServiceName !== serviceName) {
      setServiceName(watchServiceName);
    }
  }, [watchServiceName, serviceName, setServiceName]);

  useEffect(() => {
    const nextFrom = watchFromDate ? `${watchFromDate}T00:00:00.000Z` : undefined;
    const nextTo = watchToDate ? `${watchToDate}T23:59:59.999Z` : undefined;
    if (nextFrom !== from || nextTo !== to) {
      setRange(nextFrom, nextTo);
    }
  }, [watchFromDate, watchToDate, from, to, setRange]);

  const fromDate = watchFromDate ?? "";
  const toDate = watchToDate ?? "";
  const unreadAlertCount = 2;
  const [language, setLanguage] = useState<"en" | "ko">("en");

  return (
    <ConsoleAppLayout
      pathname={pathname}
      navItems={opsNavItems}
      sidebarCollapsed={sidebarCollapsed}
      mobileOpen={mobileOpen}
      onToggleSidebar={toggleSidebar}
      onOpenMobile={openMobile}
      onCloseMobile={closeMobile}
      headerTitle="운영 현황"
      headerContent={
        <Flex className="w-full items-center justify-between gap-4">
          <Flex className="min-w-0 flex-1 items-center gap-3">
            <Button
              variant="secondary"
              size="sm"
              iconOnly
              leftIcon={<Menu />}
              onClick={openMobile}
              className="inline-flex md:hidden"
              aria-label="사이드바 열기"
            />

            <Typography as="p" variant="bodySm" className="hidden font-semibold tracking-tight lg:block">
              운영 현황
            </Typography>

            <Box className="relative w-full max-w-[360px] lg:max-w-[420px]">
              <Search className="text-muted-foreground pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2" />
              <Input
                placeholder="서비스, 이슈, 로그 검색"
                className="placeholder:text-muted text-body-md border-default bg-surface hover:border-primary/35 focus:border-primary focus:ring-primary/30 h-10 w-full rounded-[var(--radius-md)] border px-3 py-2 pl-8 shadow-none outline-none ring-0 transition-colors focus:ring-1 focus:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </Box>
          </Flex>

          <Flex className="items-center gap-1 md:gap-2">
            <Box as="span" className="relative inline-flex">
              <Button
                variant="secondary"
                size="sm"
                iconOnly
                leftIcon={<Bell />}
                className="rounded-md"
                aria-label="알림 보기"
                onClick={openAlertModal}
              />
              {unreadAlertCount > 0 ? (
                <Box as="span" className="absolute right-0 top-0 -translate-y-1/2 translate-x-1/2">
                  <Badge
                    variant="danger"
                    size="sm"
                    className="border-danger/40 bg-danger text-danger-foreground h-4 min-w-4 border px-1 text-[10px] leading-none"
                  >
                    {unreadAlertCount}
                  </Badge>
                </Box>
              ) : null}
            </Box>

            <Box className="hidden min-w-[104px] md:block">
              <Select
                options={[
                  { label: "EN", value: "en" },
                  { label: "KO", value: "ko" }
                ]}
                value={language}
                onChange={(value) => setLanguage((value as "en" | "ko") ?? "en")}
                size="sm"
                className="h-8"
              />
            </Box>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="hover:bg-surface-elevated active:bg-surface-elevated h-9 w-9 rounded-full p-0"
                  aria-label="프로필 메뉴"
                >
                  <Avatar size="sm" name="Moni Roy" status="online" color="primary" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[220px]">
                <DropdownMenuLabel>Moni Roy</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  leftSlot={<UserCircle2 className="h-4 w-4" />}
                  onSelect={() => router.push("/settings")}
                >
                  내 프로필
                </DropdownMenuItem>
                <DropdownMenuItem
                  leftSlot={<Settings className="h-4 w-4" />}
                  onSelect={() => router.push("/settings")}
                >
                  워크스페이스 설정
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem leftSlot={<LogOut className="h-4 w-4" />} color="danger">
                  로그아웃
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </Flex>
        </Flex>
      }
      brandEyebrow="Operations AI"
      brandTitle="OpsLens"
      filterContent={
        <Flex className="w-full items-center gap-2 overflow-x-auto">
          <Box className="min-w-[180px] max-w-[220px] flex-1">
            <Select
              options={[
                { label: "prod", value: "prod" },
                { label: "stage", value: "stage" },
                { label: "dev", value: "dev" }
              ]}
              control={filterForm.control}
              name="environment"
              size="md"
              className="h-10"
            />
          </Box>

          <Box className="min-w-[200px] max-w-[260px] flex-1">
            <Select
              options={[
                { label: "all", value: "all" },
                { label: "docs", value: "docs" },
                { label: "whiteboard", value: "whiteboard" },
                { label: "billing", value: "billing" },
                { label: "checkout", value: "checkout" }
              ]}
              control={filterForm.control}
              name="serviceName"
              searchable
              size="md"
              className="h-10"
            />
          </Box>

          <Box className="min-w-[260px] flex-[1.2]">
            <DatePicker
              id="filter-period"
              mode="range"
              range={{ from: fromDate, to: toDate }}
              onRangeChange={(nextRange) => {
                filterForm.setValue("fromDate", nextRange.from ?? "");
                filterForm.setValue("toDate", nextRange.to ?? "");
              }}
              size="md"
              placeholder="기간 선택"
              className="bg-surface h-10 shadow-none focus-visible:ring-0"
            />
          </Box>

          <Box className="min-w-[220px] flex-[1.3]">
            <Box className="relative">
              <Search className="text-muted-foreground pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2" />
              <Input
                id="filter-query"
                value={watchSearch}
                onChange={(event) => filterForm.setValue("search", event.target.value)}
                placeholder="검색"
                size="md"
                className="h-10 pl-8"
              />
            </Box>
          </Box>
        </Flex>
      }
    >
      <>
        {children}
        <Modal
          open={alertModalOpen}
          onOpenChange={(nextOpen) => (nextOpen ? openAlertModal() : closeAlertModal())}
        >
          <ModalContent size="sm">
            <ModalHeader>
              <ModalTitle>운영 알림</ModalTitle>
              <ModalDescription>중요 알림을 확인하고 즉시 대응할 수 있습니다.</ModalDescription>
            </ModalHeader>
            <ModalBody className="space-y-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  closeAlertModal();
                  router.push("/issues");
                }}
                className="border-default bg-surface-elevated hover:bg-surface h-auto w-full justify-between rounded-lg border p-3 text-left"
              >
                <Flex className="min-w-0 items-start gap-2">
                  <AlertTriangle className="text-danger mt-0.5 h-5 w-5 shrink-0" />
                  <Box className="min-w-0">
                    <Typography as="p" variant="bodySm" className="truncate font-semibold">
                      결제 승인 단계 TypeError 급증
                    </Typography>
                    <Typography as="p" variant="caption" color="muted">
                      방금 전
                    </Typography>
                  </Box>
                </Flex>
                <Badge variant="danger" size="sm">
                  critical
                </Badge>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  closeAlertModal();
                  router.push("/issues");
                }}
                className="border-default bg-surface-elevated hover:bg-surface h-auto w-full justify-between rounded-lg border p-3 text-left"
              >
                <Flex className="min-w-0 items-start gap-2">
                  <AlertTriangle className="text-warning mt-0.5 h-5 w-5 shrink-0" />
                  <Box className="min-w-0">
                    <Typography as="p" variant="bodySm" className="truncate font-semibold">
                      주문 상세 API 500 에러 재발
                    </Typography>
                    <Typography as="p" variant="caption" color="muted">
                      5분 전
                    </Typography>
                  </Box>
                </Flex>
                <Badge variant="warning" size="sm">
                  high
                </Badge>
              </Button>
            </ModalBody>
          </ModalContent>
        </Modal>
      </>
    </ConsoleAppLayout>
  );
}
