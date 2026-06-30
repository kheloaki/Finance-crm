"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

const SIDEBAR_COLLAPSED_KEY = "aga-sidebar-collapsed";
const SIDEBAR_COLLAPSE_MIN_WIDTH = 1280;

type ShellContextValue = {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebarCollapsed: () => void;
  shellReady: boolean;
};

const ShellContext = createContext<ShellContextValue | null>(null);

function canCollapseSidebar() {
  return typeof window !== "undefined" && window.innerWidth >= SIDEBAR_COLLAPSE_MIN_WIDTH;
}

export function ShellProvider({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsedState] = useState(false);
  const [shellReady, setShellReady] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
    const prefersCollapsed = stored === "1";
    setSidebarCollapsedState(prefersCollapsed && canCollapseSidebar());
    setShellReady(true);

    function onResize() {
      if (!canCollapseSidebar()) {
        setSidebarCollapsedState(false);
      }
    }

    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  function setSidebarCollapsed(collapsed: boolean) {
    const next = collapsed && canCollapseSidebar();
    setSidebarCollapsedState(next);
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, next ? "1" : "0");
  }

  function toggleSidebarCollapsed() {
    setSidebarCollapsedState((prev) => {
      if (!canCollapseSidebar()) return false;
      const next = !prev;
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, next ? "1" : "0");
      return next;
    });
  }

  return (
    <ShellContext.Provider
      value={{
        sidebarOpen,
        setSidebarOpen,
        toggleSidebar: () => setSidebarOpen((v) => !v),
        sidebarCollapsed: shellReady ? sidebarCollapsed : false,
        setSidebarCollapsed,
        toggleSidebarCollapsed,
        shellReady,
      }}
    >
      {children}
    </ShellContext.Provider>
  );
}

export function useShell() {
  const ctx = useContext(ShellContext);
  if (!ctx) throw new Error("useShell must be used within ShellProvider");
  return ctx;
}
