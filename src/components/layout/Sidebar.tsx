"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  FileText,
  LayoutDashboard,
  Package,
  Settings,
  ShoppingCart,
  Truck,
  Undo2,
  Users,
  Wrench,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { documentPath, DOCUMENT_LABELS, type DocumentType } from "@/lib/documents";
import { navGroupClass } from "@/lib/design";
import { SearchTrigger } from "@/components/layout/GlobalSearch";
import { useShell } from "@/components/layout/ShellContext";

const DOC_NAV: { type: DocumentType; icon: typeof FileText }[] = [
  { type: "devis", icon: FileText },
  { type: "bon_commande", icon: ShoppingCart },
  { type: "bon_livraison", icon: Truck },
  { type: "facture", icon: FileText },
  { type: "bon_retour", icon: Undo2 },
];

const REF_NAV = [
  { href: "/clients", label: "Clients", icon: Users },
  { href: "/fournisseurs", label: "Fournisseurs", icon: Users },
  { href: "/catalog/articles", label: "Articles", icon: Package },
  { href: "/catalog/services", label: "Services", icon: Wrench },
];

function NavLink({
  href,
  label,
  icon: Icon,
  active,
  collapsed,
  onNavigate,
}: {
  href: string;
  label: string;
  icon: typeof FileText;
  active: boolean;
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      title={collapsed ? label : undefined}
      aria-label={collapsed ? label : undefined}
      className={cn(
        "flex items-center rounded-xl py-2 text-[13px] transition-all",
        collapsed ? "justify-center px-2" : "gap-2.5 px-2.5",
        active
          ? "bg-brand-soft font-semibold text-brand shadow-sm"
          : "text-ink-secondary hover:bg-slate-100/90 hover:text-brand",
      )}
    >
      <Icon
        className={cn("h-[18px] w-[18px] shrink-0", active ? "text-brand" : "text-ink-muted")}
        strokeWidth={1.75}
      />
      {!collapsed ? <span className="truncate">{label}</span> : null}
    </Link>
  );
}

function SidebarPanel({
  className,
  collapsed,
  onNavigate,
}: {
  className?: string;
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <aside className={cn("flex h-full flex-col", className)}>
      {!collapsed ? (
        <div className="p-3">
          <SearchTrigger variant="sidebar" />
        </div>
      ) : (
        <div className="h-3 shrink-0" />
      )}

      <nav className={cn("flex-1 overflow-y-auto pb-3", collapsed ? "px-1.5" : "px-2")}>
        {!collapsed ? <p className={navGroupClass}>Mes sociétés</p> : null}
        <NavLink
          href="/dashboard"
          label="Vue d'ensemble"
          icon={LayoutDashboard}
          active={isActive("/dashboard")}
          collapsed={collapsed}
          onNavigate={onNavigate}
        />

        {!collapsed ? <p className={navGroupClass}>Documents</p> : collapsed ? <div className="my-2 border-t border-black/[0.06]" /> : null}
        <NavLink
          href="/documents"
          label="Documents"
          icon={FileText}
          active={pathname === "/documents"}
          collapsed={collapsed}
          onNavigate={onNavigate}
        />
        {DOC_NAV.map(({ type, icon: Icon }) => {
          const href = documentPath(type);
          return (
            <NavLink
              key={type}
              href={href}
              label={DOCUMENT_LABELS[type]}
              icon={Icon}
              active={isActive(href)}
              collapsed={collapsed}
              onNavigate={onNavigate}
            />
          );
        })}

        {!collapsed ? <p className={navGroupClass}>Référentiel</p> : collapsed ? <div className="my-2 border-t border-black/[0.06]" /> : null}
        {REF_NAV.map(({ href, label, icon: Icon }) => (
          <NavLink
            key={href}
            href={href}
            label={label}
            icon={Icon}
            active={isActive(href)}
            collapsed={collapsed}
            onNavigate={onNavigate}
          />
        ))}

        {!collapsed ? <p className={navGroupClass}>Configuration</p> : collapsed ? <div className="my-2 border-t border-black/[0.06]" /> : null}
        <NavLink
          href="/settings"
          label="Modèle société"
          icon={Settings}
          active={isActive("/settings")}
          collapsed={collapsed}
          onNavigate={onNavigate}
        />
      </nav>
    </aside>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarOpen, setSidebarOpen, sidebarCollapsed } = useShell();
  const [mounted, setMounted] = useState(false);
  const close = () => setSidebarOpen(false);
  const width = sidebarCollapsed ? "var(--sidebar-width-collapsed)" : "var(--sidebar-width)";

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!sidebarOpen) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [sidebarOpen]);

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname, setSidebarOpen]);

  const mobileDrawer =
    sidebarOpen ? (
      <div className="fixed inset-0 z-50 lg:hidden">
        <div
          role="button"
          tabIndex={-1}
          aria-label="Fermer le menu"
          className="absolute inset-0 bg-slate-900/50 backdrop-blur-[2px]"
          onClick={close}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") close();
          }}
        />
        <div className="absolute inset-y-0 left-0 flex w-[min(300px,calc(100vw-12px))] flex-col p-2">
          <div className="glass-panel relative flex h-full min-h-0 flex-col overflow-hidden rounded-2xl shadow-2xl">
            <span
              role="button"
              tabIndex={0}
              onClick={close}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") close();
              }}
              className="absolute right-2 top-2 z-10 cursor-pointer rounded-lg p-1.5 text-[#6B7280] hover:bg-black/[0.05]"
              aria-label="Fermer"
            >
              <X className="h-4 w-4" />
            </span>
            <SidebarPanel onNavigate={close} />
          </div>
        </div>
      </div>
    ) : null;

  return (
    <>
      <div
        className="hidden shrink-0 transition-[width] duration-200 ease-out lg:block"
        style={{ width }}
      >
        <div className="glass-panel-subtle h-full overflow-hidden rounded-2xl">
          <SidebarPanel collapsed={sidebarCollapsed} />
        </div>
      </div>

      {mounted && mobileDrawer ? createPortal(mobileDrawer, document.body) : null}
    </>
  );
}
