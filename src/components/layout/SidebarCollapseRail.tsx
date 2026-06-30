"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useShell } from "@/components/layout/ShellContext";
import { cn } from "@/lib/utils";

/** Clickable rail between sidebar and main — toggles icon-only sidebar. */
export function SidebarCollapseRail() {
  const { sidebarCollapsed, toggleSidebarCollapsed, shellReady } = useShell();

  if (!shellReady) return null;

  return (
    <button
      type="button"
      onClick={toggleSidebarCollapsed}
      title={sidebarCollapsed ? "Développer le menu" : "Réduire le menu (icônes)"}
      aria-label={sidebarCollapsed ? "Développer le menu" : "Réduire le menu"}
      className={cn(
        "group/rail relative hidden shrink-0 lg:flex lg:w-3",
        "cursor-col-resize items-center justify-center border-0 bg-transparent p-0 outline-none",
        "hover:bg-black/[0.02] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand/20",
      )}
    >
      <span
        aria-hidden
        className="absolute inset-y-3 left-1/2 w-px -translate-x-1/2 bg-black/[0.08] transition-colors group-hover/rail:bg-black/[0.18] group-hover/rail:w-0.5"
      />
      <span
        aria-hidden
        className={cn(
          "relative z-[1] flex h-7 w-4 items-center justify-center rounded-md border border-black/[0.08] bg-white/90 text-[#9CA3AF] shadow-sm",
          "opacity-50 transition-opacity group-hover/rail:opacity-100 group-focus-visible/rail:opacity-100",
        )}
      >
        {sidebarCollapsed ? (
          <ChevronRight className="h-3 w-3" />
        ) : (
          <ChevronLeft className="h-3 w-3" />
        )}
      </span>
    </button>
  );
}
