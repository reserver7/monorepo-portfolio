"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Button,
  DatePicker,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Typography,
  buttonVariants,
  cn
} from "@repo/ui";
import {
  AlertTriangle,
  type LucideIcon,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Settings,
  SquaresExclude,
  TableProperties,
  Upload,
  UploadCloud,
  Workflow,
  X
} from "@repo/icons";
import { useOpsFilterStore } from "@/lib/store";

const navItems: Array<{ href: string; label: string; icon: LucideIcon }> = [
  { href: "/", label: "Dashboard", icon: SquaresExclude },
  { href: "/logs", label: "Logs", icon: Upload },
  { href: "/issues", label: "Issues", icon: AlertTriangle },
  { href: "/qa-assistant", label: "QA Assistant", icon: Workflow },
  { href: "/deployments", label: "Deployments", icon: TableProperties },
  { href: "/reports", label: "Reports", icon: UploadCloud },
  { href: "/settings", label: "Settings", icon: Settings }
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

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

  const fromDate = useMemo(() => from?.slice(0, 10) ?? "", [from]);
  const toDate = useMemo(() => to?.slice(0, 10) ?? "", [to]);

  return (
    <div className="min-h-screen bg-surface-elevated text-foreground">
      {mobileOpen ? (
        <Button
          variant="ghost"
          className="fixed inset-0 z-30 h-auto w-auto rounded-none bg-foreground/45 md:hidden"
          onClick={() => setMobileOpen(false)}
          aria-label="사이드바 닫기"
        />
      ) : null}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex flex-col border-r border-default bg-surface transition-all duration-200 md:translate-x-0 ${
          sidebarCollapsed ? "md:w-[84px]" : "md:w-[252px]"
        } ${mobileOpen ? "translate-x-0" : "-translate-x-full"} w-[252px]`}
      >
        <div className="flex h-16 items-center justify-between border-b border-default px-3">
          <div className={`${sidebarCollapsed ? "md:hidden" : "block"}`}>
            <Typography as="p" variant="caption" className="font-semibold uppercase tracking-[0.14em] text-primary">
              Operations AI
            </Typography>
            <Typography as="h1" variant="h3" className="text-heading-lg">
              OpsLens AI
            </Typography>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              onClick={toggleSidebar}
              className="hidden h-9 w-9 md:inline-flex"
              aria-label="사이드바 접기/펼치기"
            >
              {sidebarCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setMobileOpen(false)}
              className="inline-flex h-9 w-9 md:hidden"
              aria-label="사이드바 닫기"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <nav className="space-y-1 p-2">
          {navItems.map((item) => {
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                  active ? "bg-primary/10 text-primary" : "text-muted hover:bg-surface-elevated"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className={`${sidebarCollapsed ? "md:hidden" : "inline"}`}>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className={`min-h-screen transition-all ${sidebarCollapsed ? "md:ml-[84px]" : "md:ml-[252px]"}`}>
        <header className="sticky top-0 z-20 border-b border-default bg-surface/95 px-4 py-3 backdrop-blur md:px-6">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setMobileOpen(true)}
                className="inline-flex h-9 w-9 md:hidden"
                aria-label="사이드바 열기"
              >
                <Menu className="h-4 w-4" />
              </Button>
              <Typography as="p" variant="bodySm" className="font-semibold">
                운영 현황 필터
              </Typography>
            </div>

            <Link
              href="/logs"
              className={cn(buttonVariants({ size: "sm" }), "h-9 gap-2 bg-primary hover:opacity-90")}
            >
              <UploadCloud className="h-4 w-4" />
              신규 업로드
            </Link>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <div className="grid gap-1">
              <Label className="text-xs">환경</Label>
              <Select
                value={environment}
                onValueChange={(value) => setEnvironment(value as "dev" | "stage" | "prod")}
              >
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="prod">prod</SelectItem>
                  <SelectItem value="stage">stage</SelectItem>
                  <SelectItem value="dev">dev</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-1">
              <Label className="text-xs">서비스</Label>
              <Select
                value={serviceName}
                onValueChange={setServiceName}
              >
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">all</SelectItem>
                  <SelectItem value="docs">docs</SelectItem>
                  <SelectItem value="whiteboard">whiteboard</SelectItem>
                  <SelectItem value="billing">billing</SelectItem>
                  <SelectItem value="checkout">checkout</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-1">
              <Label className="text-xs" htmlFor="filter-from-date">
                시작일
              </Label>
              <DatePicker
                id="filter-from-date"
                value={fromDate}
                onChange={(event) => {
                  const value = event.target.value;
                  setRange(value ? `${value}T00:00:00.000Z` : undefined, to);
                }}
                className="h-9"
              />
            </div>

            <div className="grid gap-1">
              <Label className="text-xs" htmlFor="filter-to-date">
                종료일
              </Label>
              <DatePicker
                id="filter-to-date"
                value={toDate}
                onChange={(event) => {
                  const value = event.target.value;
                  setRange(from, value ? `${value}T23:59:59.999Z` : undefined);
                }}
                className="h-9"
              />
            </div>

            <div className="grid gap-1">
              <Label className="text-xs" htmlFor="filter-query">
                검색
              </Label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="filter-query"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="이슈명/요약/서비스 검색"
                  className="h-9 pl-8"
                />
              </div>
            </div>
          </div>
        </header>

        <main className="p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
