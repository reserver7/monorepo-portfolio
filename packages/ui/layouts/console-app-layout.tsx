"use client";

import type { ComponentType, ReactNode } from "react";
import Link from "next/link";
import { Menu, PanelLeftClose, PanelLeftOpen, X } from "lucide-react";
import { Button, Typography } from "../components";
import { cn } from "../components/cn";

export type ConsoleNavItem = {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
};

export type ConsoleAppLayoutProps = {
  pathname: string;
  children: ReactNode;
  navItems: ConsoleNavItem[];
  sidebarCollapsed: boolean;
  mobileOpen: boolean;
  onToggleSidebar: () => void;
  onOpenMobile: () => void;
  onCloseMobile: () => void;
  headerTitle: string;
  headerContent?: ReactNode;
  headerAction?: ReactNode;
  filterContent?: ReactNode;
  brandTitle: string;
  brandEyebrow?: string;
  className?: string;
};

export function ConsoleAppLayout({
  pathname,
  children,
  navItems,
  sidebarCollapsed,
  mobileOpen,
  onToggleSidebar,
  onOpenMobile,
  onCloseMobile,
  headerTitle,
  headerContent,
  headerAction,
  filterContent,
  brandTitle,
  brandEyebrow,
  className
}: ConsoleAppLayoutProps) {
  const sidebarExpandedWidthClass = "md:w-64";
  const sidebarCollapsedWidthClass = "md:w-16";
  const sidebarExpandedOffsetClass = "md:pl-64";
  const sidebarCollapsedOffsetClass = "md:pl-16";

  return (
    <div className={cn("bg-surface-elevated text-foreground min-h-screen", className)}>
      {mobileOpen ? (
        <Button
          variant="secondary"
          className="bg-foreground/30 fixed inset-0 z-30 h-auto w-auto rounded-none md:hidden"
          onClick={onCloseMobile}
          aria-label="사이드바 닫기"
        />
      ) : null}

      <aside
        className={cn(
          "border-default bg-surface fixed inset-y-0 left-0 z-40 flex flex-col border-r transition-all duration-200 md:translate-x-0",
          sidebarCollapsed ? sidebarCollapsedWidthClass : sidebarExpandedWidthClass,
          mobileOpen ? "translate-x-0" : "-translate-x-full",
          "w-64"
        )}
      >
        <div
          className={cn(
            "border-default flex h-16 items-center overflow-hidden border-b",
            sidebarCollapsed ? "justify-center px-0" : "justify-between px-3"
          )}
        >
          <div className={cn("min-w-0 overflow-hidden", sidebarCollapsed ? "md:hidden" : "block")}>
            <Typography
              as="p"
              variant="bodySm"
              className="truncate text-lg font-semibold leading-none tracking-tight"
            >
              {brandTitle}
            </Typography>
            {brandEyebrow ? (
              <Typography
                as="p"
                variant="caption"
                color="muted"
                className="mt-1 truncate text-[11px] font-semibold uppercase leading-none tracking-[0.08em]"
              >
                {brandEyebrow}
              </Typography>
            ) : null}
          </div>

          <div className={cn("flex items-center gap-1", sidebarCollapsed && "w-full justify-center")}>
            <Button
              variant="secondary"
              size="sm"
              iconOnly
              leftIcon={sidebarCollapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
              onClick={onToggleSidebar}
              className={cn("hidden md:inline-flex")}
              aria-label="사이드바 접기/펼치기"
            />
            <Button
              variant="secondary"
              size="sm"
              iconOnly
              leftIcon={<X />}
              onClick={onCloseMobile}
              className="inline-flex md:hidden"
              aria-label="사이드바 닫기"
            />
          </div>
        </div>

        <nav className={cn("flex-1 space-y-1 overflow-y-auto", sidebarCollapsed ? "p-1.5" : "p-2")}>
          {navItems.map((item) => {
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onCloseMobile}
                className={cn(
                  "focus-visible:ring-primary focus-visible:ring-offset-surface flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
                  sidebarCollapsed && "mx-auto h-9 w-9 justify-center gap-0 px-0 py-0",
                  active
                    ? "bg-surface-elevated text-foreground border-border-default border"
                    : "text-muted hover:bg-surface-elevated hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className={cn(sidebarCollapsed ? "md:hidden" : "inline")}>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      <div
        className={cn(
          "min-h-screen transition-all",
          sidebarCollapsed ? sidebarCollapsedOffsetClass : sidebarExpandedOffsetClass
        )}
      >
        <header className="bg-surface sticky top-0 z-20">
          {headerContent ? (
            <div className="border-default flex h-16 w-full items-center border-b px-4 md:px-6">
              {headerContent}
            </div>
          ) : (
            <div className="border-default flex h-16 w-full items-center justify-between gap-3 border-b px-4 md:px-6">
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  iconOnly
                  leftIcon={<Menu />}
                  onClick={onOpenMobile}
                  className="inline-flex md:hidden"
                  aria-label="사이드바 열기"
                />
                <Typography as="p" variant="bodySm" className="font-semibold tracking-[0.01em]">
                  {headerTitle}
                </Typography>
              </div>
              {headerAction}
            </div>
          )}
        </header>
        {filterContent ? (
          <section className="bg-surface">
            <div className="border-default flex h-16 w-full items-center border-b px-4 md:px-6">
              {filterContent}
            </div>
          </section>
        ) : null}

        <main className="w-full p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
