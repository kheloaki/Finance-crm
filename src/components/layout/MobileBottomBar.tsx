"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText, LayoutDashboard, Menu, Package, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { useShell } from "@/components/layout/ShellContext";

const TABS = [
  { id: "home", href: "/dashboard", label: "Accueil", icon: LayoutDashboard, match: (p: string) => p === "/dashboard" },
  {
    id: "docs",
    href: "/documents",
    label: "Documents",
    icon: FileText,
    match: (p: string) => p === "/documents" || p.startsWith("/documents/"),
  },
  {
    id: "clients",
    href: "/clients",
    label: "Clients",
    icon: Users,
    match: (p: string) => p.startsWith("/clients") || p.startsWith("/fournisseurs"),
  },
  {
    id: "catalog",
    href: "/catalog/articles",
    label: "Catalogue",
    icon: Package,
    match: (p: string) => p.startsWith("/catalog"),
  },
] as const;

function TabButton({
  active,
  label,
  icon: Icon,
  onClick,
  href,
}: {
  active: boolean;
  label: string;
  icon: typeof LayoutDashboard;
  onClick?: () => void;
  href?: string;
}) {
  const className = cn(
    "flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-2 transition-colors",
    active ? "text-brand" : "text-ink-muted hover:text-ink-secondary",
  );

  const content = (
    <>
      <span
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-xl transition-colors",
          active && "bg-brand-soft text-brand",
        )}
      >
        <Icon className="h-[19px] w-[19px]" strokeWidth={active ? 2.25 : 1.75} />
      </span>
      <span className={cn("max-w-full truncate text-[10px] font-medium", active && "font-semibold")}>
        {label}
      </span>
    </>
  );

  if (href) {
    return (
      <Link href={href} className={className} aria-current={active ? "page" : undefined}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={className} aria-expanded={active} aria-label={label}>
      {content}
    </button>
  );
}

export function MobileBottomBar() {
  const pathname = usePathname();
  const { sidebarOpen, toggleSidebar } = useShell();

  return (
    <nav
      className="shrink-0 lg:hidden"
      aria-label="Navigation principale"
      style={{ paddingBottom: "max(4px, env(safe-area-inset-bottom))" }}
    >
      <div className="glass-panel-subtle flex items-stretch justify-around gap-0.5 rounded-2xl border border-black/[0.06] px-1 py-1 shadow-[0_-4px_24px_rgba(0,0,0,0.06)]">
        {TABS.map((tab) => (
          <TabButton
            key={tab.id}
            href={tab.href}
            label={tab.label}
            icon={tab.icon}
            active={tab.match(pathname)}
          />
        ))}
        <TabButton
          label="Menu"
          icon={Menu}
          active={sidebarOpen}
          onClick={toggleSidebar}
        />
      </div>
    </nav>
  );
}
