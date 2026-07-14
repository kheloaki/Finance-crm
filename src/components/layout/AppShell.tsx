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

function isDocumentEditorPath(pathname: string) {
  return /^\/documents\/[^/]+\/[^/]+$/.test(pathname);
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const documentWorkspace = isDocumentWorkspacePath(pathname);
  const documentEditor = isDocumentEditorPath(pathname);

  return (
    <ShellProvider>
      <div className="app-backdrop app-shell-root flex min-h-[100svh] flex-col gap-0.5 p-0.5">
        <TopBar />
        <div className="flex min-h-0 min-w-0 flex-1">
          <Sidebar />
          <SidebarCollapseRail />
          <main className="glass-main min-h-0 min-w-0 flex-1 overflow-hidden rounded-xl">
            <div className={cn("h-full", documentWorkspace ? "overflow-hidden" : "overflow-y-auto")}>
              <div
                className={cn(
                  documentEditor
                    ? "flex h-full min-h-0 flex-col p-0"
                    : documentWorkspace
                      ? "flex h-full min-h-0 flex-col p-0.5 sm:p-1"
                      : "px-3 py-3 sm:px-4 sm:py-3 lg:px-5",
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
        compact ? "mb-0 gap-1.5" : "mb-3 gap-2 sm:mb-4 sm:gap-3",
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
