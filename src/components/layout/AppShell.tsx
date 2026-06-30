"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { MobileBottomBar } from "@/components/layout/MobileBottomBar";
import { GlobalSearchHost } from "@/components/layout/GlobalSearch";
import { OrgScopedContent } from "@/components/layout/OrgScopedContent";
import { Sidebar } from "@/components/layout/Sidebar";
import { SidebarCollapseRail } from "@/components/layout/SidebarCollapseRail";
import { ShellProvider } from "@/components/layout/ShellContext";
import { TopBar } from "@/components/layout/TopBar";
import { cn } from "@/lib/utils";

function isDocumentWorkspacePath(pathname: string) {
  return /^\/documents\/[^/]+(\/[^/]+)?$/.test(pathname);
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const documentWorkspace = isDocumentWorkspacePath(pathname);

  return (
    <ShellProvider>
      <div className="app-backdrop app-shell-root flex min-h-[100svh] flex-col gap-1 p-1">
        <TopBar />
        <div className="flex min-h-0 min-w-0 flex-1">
          <Sidebar />
          <SidebarCollapseRail />
          <main className="glass-main min-h-0 min-w-0 flex-1 overflow-hidden rounded-xl">
            <div className={cn("h-full", documentWorkspace ? "overflow-hidden" : "overflow-y-auto")}>
              <div
                className={cn(
                  documentWorkspace
                    ? "flex h-full min-h-0 flex-col p-1 sm:p-1.5"
                    : "px-4 py-4 sm:px-6 sm:py-5 lg:px-8",
                )}
              >
                <OrgScopedContent>{children}</OrgScopedContent>
              </div>
            </div>
          </main>
        </div>
        <MobileBottomBar />
        <GlobalSearchHost />
      </div>
    </ShellProvider>
  );
}

export function PageHeader({
  title,
  description,
  actions,
  compact,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row sm:items-start sm:justify-between",
        compact ? "mb-0 gap-2" : "mb-4 gap-3 sm:mb-5 sm:gap-4",
      )}
    >
      <div className="min-w-0">
        <h1
          className={cn(
            "font-semibold tracking-tight text-ink",
            compact ? "text-lg sm:text-xl" : "text-xl sm:text-[26px] lg:text-[28px]",
          )}
        >
          {title}
        </h1>
        {description ? (
          <p
            className={cn(
              "text-[#6B7280] leading-relaxed",
              compact ? "mt-1 text-xs sm:text-[13px]" : "mt-1.5 text-[13px] sm:mt-2 sm:text-sm",
            )}
          >
            {description}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
      ) : null}
    </div>
  );
}
