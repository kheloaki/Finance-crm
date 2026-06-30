"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useQuery } from "convex/react";
import Link from "next/link";
import { ChevronDown, HelpCircle, LogOut, Settings, User } from "lucide-react";
import { useState } from "react";
import { api } from "@convex/_generated/api";
import { SearchTrigger } from "@/components/layout/GlobalSearch";
import { ProjectSwitcher } from "@/components/layout/ProjectSwitcher";
import { AppLogo } from "@/components/layout/AppLogo";
import { cn } from "@/lib/utils";

export function TopBar() {
  const me = useQuery(api.users.me);
  const { signOut } = useAuthActions();
  const [menuOpen, setMenuOpen] = useState(false);

  const email = me?.email || "compte@aga.plus";

  return (
    <header className="glass-panel grid w-full min-w-0 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 rounded-2xl px-2.5 sm:h-12 sm:gap-3 sm:px-3 h-11">
      <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
        <AppLogo size="sm" />
        <div className="hidden min-w-0 sm:block">
          <ProjectSwitcher />
        </div>
      </div>

      <div className="flex min-w-0 items-center justify-center px-0.5 sm:px-2">
        <SearchTrigger className="min-w-0 w-full max-w-xl" />
      </div>

      <div className="flex min-w-0 items-center justify-end gap-1 sm:gap-2">
        <div className="sm:hidden">
          <ProjectSwitcher />
        </div>
        <button
          type="button"
          className="hidden rounded-xl p-1.5 text-ink-secondary hover:bg-slate-100/90 sm:inline-flex"
          aria-label="Aide"
        >
          <HelpCircle className="h-4 w-4" />
        </button>

        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="pill-btn max-w-[min(100%,180px)] min-w-0 sm:max-w-[220px]"
            aria-expanded={menuOpen}
            aria-haspopup="menu"
          >
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100">
              <User className="h-3 w-3 text-ink-secondary" />
            </span>
            <span className="hidden truncate sm:inline">{email}</span>
            <ChevronDown
              className={cn(
                "h-3.5 w-3.5 shrink-0 text-ink-muted transition",
                menuOpen && "rotate-180",
              )}
            />
          </button>

          {menuOpen ? (
            <>
              <button
                type="button"
                className="fixed inset-0 z-40 cursor-default"
                aria-label="Fermer le menu"
                onClick={() => setMenuOpen(false)}
              />
              <div
                className="absolute right-0 top-[calc(100%+6px)] z-50 w-[min(240px,calc(100vw-2rem))] overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-xl"
                role="menu"
              >
                <div className="border-b border-slate-100 px-3 py-2.5">
                  <p className="truncate text-sm font-medium text-ink">{email}</p>
                  <p className="text-[11px] text-ink-muted">Compte Finance CRM</p>
                </div>
                <div className="p-1">
                  <Link
                    href="/settings"
                    role="menuitem"
                    onClick={() => setMenuOpen(false)}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-ink-secondary hover:bg-slate-50"
                  >
                    <Settings className="h-4 w-4 text-ink-muted" />
                    Modèle société
                  </Link>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setMenuOpen(false);
                      void signOut();
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <LogOut className="h-4 w-4" />
                    Déconnexion
                  </button>
                </div>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </header>
  );
}
