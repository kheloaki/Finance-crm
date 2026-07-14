"use client";

import { useQuery } from "convex/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  CheckCircle2,
  ChevronDown,
  ExternalLink,
  FileText,
  FolderKanban,
  LayoutDashboard,
  Link2,
  Loader2,
  LogIn,
  MoreHorizontal,
  Package,
  Search,
  Settings,
  ShoppingCart,
  Truck,
  Undo2,
  Users,
  Wrench,
  X,
  type LucideIcon,
} from "lucide-react";
import { api } from "@convex/_generated/api";
import type { Doc } from "@convex/_generated/dataModel";
import {
  DOCUMENT_LABELS,
  DOCUMENT_TYPES,
  documentNewPath,
  documentPath,
} from "@/lib/documents";
import { cn } from "@/lib/utils";

type SearchCategory = "all" | "document" | "project" | "client" | "supplier" | "catalog" | "page";
type DocType = Doc<"documents">["documentType"];

type QuickPage = {
  id: string;
  title: string;
  subtitle: string;
  href: string;
  icon: LucideIcon;
  keywords: string[];
};

const QUICK_PAGES: QuickPage[] = [
  {
    id: "dashboard",
    title: "Vue d'ensemble",
    subtitle: "Tableau de bord",
    href: "/dashboard",
    icon: LayoutDashboard,
    keywords: ["dashboard", "accueil", "home", "kpi"],
  },
  {
    id: "documents",
    title: "Documents",
    subtitle: "Tous les documents et projets",
    href: "/documents",
    icon: FileText,
    keywords: ["documents", "liste", "all"],
  },
  {
    id: "clients",
    title: "Clients",
    subtitle: "Référentiel clients",
    href: "/clients",
    icon: Users,
    keywords: ["clients", "client"],
  },
  {
    id: "suppliers",
    title: "Fournisseurs",
    subtitle: "Référentiel fournisseurs",
    href: "/fournisseurs",
    icon: Users,
    keywords: ["fournisseurs", "supplier", "fournisseur"],
  },
  {
    id: "articles",
    title: "Articles",
    subtitle: "Catalogue articles",
    href: "/catalog/articles",
    icon: Package,
    keywords: ["articles", "catalogue", "catalog"],
  },
  {
    id: "services",
    title: "Services",
    subtitle: "Catalogue services",
    href: "/catalog/services",
    icon: Wrench,
    keywords: ["services", "catalogue"],
  },
  {
    id: "settings",
    title: "Modèle société",
    subtitle: "Paramètres et design PDF",
    href: "/settings",
    icon: Settings,
    keywords: ["settings", "paramètres", "logo", "société", "company"],
  },
  ...DOCUMENT_TYPES.map((type) => ({
    id: `doc-type-${type}`,
    title: DOCUMENT_LABELS[type],
    subtitle: `Liste des ${DOCUMENT_LABELS[type].toLowerCase()}s`,
    href: documentPath(type),
    icon:
      type === "bon_commande"
        ? ShoppingCart
        : type === "bon_livraison"
          ? Truck
          : type === "bon_retour"
            ? Undo2
            : FileText,
    keywords: [type, DOCUMENT_LABELS[type].toLowerCase(), "document"],
  })),
  ...DOCUMENT_TYPES.map((type) => ({
    id: `new-${type}`,
    title: `Nouveau ${DOCUMENT_LABELS[type].toLowerCase()}`,
    subtitle: "Créer un document",
    href: documentNewPath(type),
    icon: FileText,
    keywords: ["nouveau", "new", "créer", "create", DOCUMENT_LABELS[type].toLowerCase()],
  })),
];

const PRIMARY_TABS: { id: SearchCategory; label: string }[] = [
  { id: "all", label: "Tout" },
  { id: "document", label: "Documents" },
  { id: "project", label: "Projets" },
  { id: "client", label: "Clients" },
  { id: "supplier", label: "Fournisseurs" },
  { id: "catalog", label: "Catalogue" },
];

const TYPE_PILLS: {
  id: string;
  label: string;
  icon: LucideIcon;
  category?: SearchCategory;
  docType?: DocType;
}[] = [
  { id: "pill-devis", label: "Devis", icon: FileText, category: "document", docType: "devis" },
  {
    id: "pill-facture",
    label: "Factures",
    icon: FileText,
    category: "document",
    docType: "facture",
  },
  {
    id: "pill-bc",
    label: "Bons de commande",
    icon: ShoppingCart,
    category: "document",
    docType: "bon_commande",
  },
  {
    id: "pill-bl",
    label: "Livraisons",
    icon: Truck,
    category: "document",
    docType: "bon_livraison",
  },
  { id: "pill-projet", label: "Projets", icon: FolderKanban, category: "project" },
  { id: "pill-clients", label: "Clients", icon: Users, category: "client" },
  { id: "pill-catalog", label: "Catalogue", icon: Package, category: "catalog" },
  { id: "pill-pages", label: "Pages", icon: LayoutDashboard, category: "page" },
];

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  document: FileText,
  project: FolderKanban,
  client: Users,
  supplier: Users,
  catalog: Package,
  page: LayoutDashboard,
};

type FlatResult = {
  id: string;
  group: string;
  title: string;
  subtitle: string;
  href: string;
  badge?: string;
  icon?: LucideIcon;
};

function useDebounced(value: string, ms = 220) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return debounced;
}

function filterPages(q: string) {
  const needle = q.trim().toLowerCase();
  if (!needle) return QUICK_PAGES.slice(0, 8);
  return QUICK_PAGES.filter(
    (p) =>
      p.title.toLowerCase().includes(needle) ||
      p.subtitle.toLowerCase().includes(needle) ||
      p.keywords.some((k) => k.includes(needle)),
  ).slice(0, 8);
}

function HighlightMatch({ text, query }: { text: string; query: string }) {
  const needle = query.trim();
  if (!needle) return <>{text}</>;

  const lower = text.toLowerCase();
  const idx = lower.indexOf(needle.toLowerCase());
  if (idx === -1) return <>{text}</>;

  return (
    <>
      {text.slice(0, idx)}
      <mark className="rounded-sm bg-yellow-100 px-0.5 font-medium text-ink not-italic">
        {text.slice(idx, idx + needle.length)}
      </mark>
      {text.slice(idx + needle.length)}
    </>
  );
}

function SearchSkeleton() {
  return (
    <div className="space-y-1 px-3 py-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 rounded-lg px-3 py-2.5">
          <div className="skeleton-shimmer h-4 w-4 shrink-0 rounded bg-slate-200" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="skeleton-shimmer h-3.5 w-1/2 rounded bg-slate-100" />
          </div>
        </div>
      ))}
    </div>
  );
}

function ActionIcon({
  title,
  onClick,
  children,
}: {
  title: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <span
      role="button"
      tabIndex={0}
      title={title}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          e.stopPropagation();
          onClick();
        }
      }}
      className="rounded-md p-1.5 text-ink-muted transition hover:bg-white hover:text-ink-secondary"
    >
      {children}
    </span>
  );
}

function ResultActions({
  href,
  onNavigate,
}: {
  href: string;
  onNavigate: () => void;
}) {
  const fullUrl = typeof window !== "undefined" ? `${window.location.origin}${href}` : href;

  return (
    <div className="flex shrink-0 items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
      <ActionIcon title="Ouvrir" onClick={onNavigate}>
        <LogIn className="h-3.5 w-3.5" />
      </ActionIcon>
      <ActionIcon title="Copier le lien" onClick={() => void navigator.clipboard.writeText(fullUrl)}>
        <Link2 className="h-3.5 w-3.5" />
      </ActionIcon>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        title="Ouvrir dans un nouvel onglet"
        onClick={(e) => e.stopPropagation()}
        className="rounded-md p-1.5 text-ink-muted transition hover:bg-white hover:text-ink-secondary"
      >
        <ExternalLink className="h-3.5 w-3.5" />
      </a>
      <span className="ml-0.5 rounded-md border border-slate-200 bg-white p-1 text-ink-muted">
        <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="currentColor" aria-hidden>
          <path d="M4 10.5V12h8v-1.5H4zm0-3V9h8V7.5H4zm0-3V6h5.5V4.5H4z" />
        </svg>
      </span>
    </div>
  );
}

export function openGlobalSearch() {
  window.dispatchEvent(new CustomEvent("finance-crm:open-search"));
}

export function SearchTrigger({
  variant = "topbar",
  className,
}: {
  variant?: "topbar" | "sidebar";
  className?: string;
}) {
  const isSidebar = variant === "sidebar";

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={openGlobalSearch}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openGlobalSearch();
        }
      }}
      aria-label="Rechercher dans l'espace de travail"
      className={cn(
        isSidebar
          ? "relative flex h-9 w-full cursor-pointer items-center rounded-xl border border-slate-200/90 bg-white/80 pl-9 pr-9 text-left text-sm text-ink-muted transition hover:border-brand/30 hover:bg-white"
          : "group flex h-9 w-full max-w-xl cursor-pointer items-center gap-2.5 rounded-xl border border-slate-200/90 bg-white/90 px-3 text-left shadow-sm transition hover:border-slate-300 hover:bg-white sm:h-10 sm:px-4",
        className,
      )}
    >
      <Search
        className={cn(
          "shrink-0 text-ink-muted",
          isSidebar
            ? "pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
            : "h-4 w-4 transition group-hover:text-brand",
        )}
        strokeWidth={2}
      />
      <span className={cn("min-w-0 flex-1 truncate text-sm text-ink-muted", isSidebar && "text-left")}>
        {isSidebar ? (
          "Rechercher…"
        ) : (
          <>
            <span className="xl:hidden">Rechercher…</span>
            <span className="hidden xl:inline">Rechercher, ouvrir une page ou un document…</span>
          </>
        )}
      </span>
      <kbd
        className={cn(
          "shrink-0 rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-medium text-ink-muted",
          isSidebar
            ? "pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2"
            : "hidden md:inline",
        )}
      >
        ⌘K
      </kbd>
    </div>
  );
}

export function GlobalSearchHost() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<SearchCategory>("all");
  const [docTypeFilter, setDocTypeFilter] = useState<DocType | null>(null);
  const [activePill, setActivePill] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [mounted, setMounted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const debouncedQuery = useDebounced(query);

  const convexCategory =
    category === "all" || category === "page"
      ? undefined
      : (category as "document" | "project" | "client" | "supplier" | "catalog");

  const remote = useQuery(
    api.search.global,
    debouncedQuery.trim() && category !== "page"
      ? { q: debouncedQuery, category: convexCategory, limit: 24 }
      : "skip",
  );

  const flatResults = useMemo(() => {
    const items: FlatResult[] = [];

    if (category === "all" || category === "page") {
      const pages = debouncedQuery.trim() ? filterPages(debouncedQuery) : QUICK_PAGES.slice(0, 8);
      for (const p of pages) {
        items.push({
          id: p.id,
          group: "page",
          title: p.title,
          subtitle: p.subtitle,
          href: p.href,
          badge: "Page",
          icon: p.icon,
        });
      }
    }

    if (category !== "page" && remote?.results) {
      for (const r of remote.results) {
        items.push({
          id: r.id,
          group: r.category,
          title: r.title,
          subtitle: r.subtitle,
          href: r.href,
          badge: r.badge,
        });
      }
    }

    if (docTypeFilter) {
      const label = DOCUMENT_LABELS[docTypeFilter];
      return items.filter(
        (item) => item.group !== "document" || item.badge === label,
      );
    }

    return items;
  }, [debouncedQuery, category, remote, docTypeFilter]);

  const closePalette = useCallback(() => {
    setOpen(false);
    setQuery("");
    setCategory("all");
    setDocTypeFilter(null);
    setActivePill(null);
    setActiveIndex(0);
  }, []);

  const navigate = useCallback(
    (href: string) => {
      closePalette();
      router.push(href);
    },
    [closePalette, router],
  );

  const applyPill = (pill: (typeof TYPE_PILLS)[number]) => {
    const isActive = activePill === pill.id;
    if (isActive) {
      setActivePill(null);
      setDocTypeFilter(null);
      setCategory("all");
      return;
    }
    setActivePill(pill.id);
    if (pill.category) setCategory(pill.category);
    setDocTypeFilter(pill.docType ?? null);
  };

  useEffect(() => {
    function onOpenSearch() {
      setOpen(true);
    }
    window.addEventListener("finance-crm:open-search", onOpenSearch);
    return () => window.removeEventListener("finance-crm:open-search", onOpenSearch);
  }, []);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      const t = setTimeout(() => inputRef.current?.focus(), 0);
      return () => {
        document.body.style.overflow = "";
        clearTimeout(t);
      };
    }
  }, [open]);

  useEffect(() => {
    setActiveIndex(0);
  }, [debouncedQuery, category, docTypeFilter]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape" && open) {
        e.preventDefault();
        closePalette();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, closePalette]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, Math.max(flatResults.length - 1, 0)));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter" && flatResults[activeIndex]) {
        e.preventDefault();
        navigate(flatResults[activeIndex].href);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, flatResults, activeIndex, navigate]);

  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-index="${activeIndex}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  const isLoading =
    !debouncedQuery.trim() ? false : remote === undefined && category !== "page";
  const showEmpty =
    debouncedQuery.trim().length > 0 && flatResults.length === 0 && remote !== undefined;
  const showQuickOnly = debouncedQuery.trim().length === 0 && flatResults.length > 0;

  const modal = open ? (
    <div className="fixed inset-0 z-[100] flex items-start justify-center p-3 pt-[min(8vh,64px)] sm:p-6 sm:pt-[min(10vh,80px)]">
      <div
        role="button"
        tabIndex={-1}
        aria-label="Fermer"
        className="search-overlay-in absolute inset-0 bg-slate-900/20 backdrop-blur-[2px]"
        onClick={closePalette}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") closePalette();
        }}
      />

      <div
        className="search-panel-in relative flex max-h-[min(720px,calc(100dvh-1.5rem))] w-full max-w-[720px] flex-col overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-[0_16px_70px_-20px_rgba(15,23,42,0.35)]"
        role="dialog"
        aria-modal="true"
        aria-label="Recherche globale"
      >
            {/* Search input — borderless, ClickUp-style */}
            <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3.5 sm:px-5">
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Rechercher, ouvrir une page ou un document…"
                className="min-w-0 flex-1 bg-transparent text-[15px] text-ink outline-none placeholder:text-ink-muted/70 sm:text-base"
              />
              {query ? (
                <span
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    setQuery("");
                    inputRef.current?.focus();
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setQuery("");
                      inputRef.current?.focus();
                    }
                  }}
                  className="cursor-pointer rounded-md p-1 text-ink-muted hover:bg-slate-100 hover:text-ink-secondary"
                  aria-label="Effacer"
                >
                  <X className="h-4 w-4" />
                </span>
              ) : null}
            </div>

            {/* Primary tabs — underline */}
            <div className="scrollbar-none flex gap-5 overflow-x-auto border-b border-slate-100 px-4 sm:px-5">
              {PRIMARY_TABS.map((tab) => {
                const active = category === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      setCategory(tab.id);
                      setDocTypeFilter(null);
                      setActivePill(null);
                    }}
                    className={cn(
                      "-mb-px shrink-0 border-b-2 py-2.5 text-sm transition",
                      active
                        ? "border-ink font-semibold text-ink"
                        : "border-transparent font-medium text-ink-muted hover:text-ink-secondary",
                    )}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Secondary type pills */}
            <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-2 sm:px-5">
              <div className="scrollbar-none flex min-w-0 flex-1 gap-1.5 overflow-x-auto">
                {TYPE_PILLS.map((pill) => {
                  const PillIcon = pill.icon;
                  const active = activePill === pill.id;
                  return (
                    <button
                      key={pill.id}
                      type="button"
                      onClick={() => applyPill(pill)}
                      className={cn(
                        "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition",
                        active
                          ? "border-slate-300 bg-slate-100 text-ink"
                          : "border-slate-200/90 bg-white text-ink-secondary hover:border-slate-300 hover:bg-slate-50",
                      )}
                    >
                      <PillIcon className="h-3 w-3" strokeWidth={2} />
                      {pill.label}
                    </button>
                  );
                })}
              </div>
              <button
                type="button"
                className="shrink-0 rounded-md p-1.5 text-ink-muted hover:bg-slate-100"
                aria-label="Plus de filtres"
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </div>

            {/* Results header */}
            <div className="flex items-center justify-between px-4 py-2 sm:px-5">
              <span className="text-xs font-medium text-ink-secondary">
                {showQuickOnly ? "Accès rapide" : "Résultats"}
              </span>
              <span className="inline-flex items-center gap-1 text-xs text-ink-muted">
                Trier par : Pertinence
                <ChevronDown className="h-3 w-3" />
              </span>
            </div>

            {/* Results list — flat, ClickUp-style rows */}
            <div ref={listRef} className="min-h-[200px] flex-1 overflow-y-auto px-2 pb-2 sm:px-3">
              {isLoading ? <SearchSkeleton /> : null}

              {showEmpty ? (
                <div className="px-6 py-12 text-center">
                  <p className="text-sm font-medium text-ink">Aucun résultat</p>
                </div>
              ) : null}

              {!isLoading && !showEmpty && flatResults.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <p className="text-sm text-ink-muted">Rechercher…</p>
                </div>
              ) : null}

              {!isLoading && flatResults.length > 0 ? (
                <div className="space-y-0.5" role="listbox" aria-label="Résultats de recherche">
                  {flatResults.map((item, index) => {
                    const Icon = item.icon ?? CATEGORY_ICONS[item.group] ?? FileText;
                    const isActive = activeIndex === index;
                    const meta = item.subtitle ? ` · ${item.subtitle}` : "";

                    return (
                      <div
                        key={`${item.group}-${item.id}`}
                        role="option"
                        aria-selected={isActive}
                        data-index={index}
                        className={cn(
                          "group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 transition",
                          isActive ? "bg-slate-100" : "hover:bg-slate-50",
                        )}
                      >
                        <div
                          className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 text-left"
                          onClick={() => navigate(item.href)}
                        >
                          <Icon
                            className="h-4 w-4 shrink-0 text-ink-secondary"
                            strokeWidth={1.75}
                          />

                          <span className="min-w-0 flex-1 truncate text-sm">
                            <span className="font-medium text-ink">
                              <HighlightMatch text={item.title} query={debouncedQuery} />
                            </span>
                            <span className="font-normal text-ink-muted">
                              <HighlightMatch text={meta} query={debouncedQuery} />
                            </span>
                          </span>
                        </div>

                        {isActive ? (
                          <ResultActions
                            href={item.href}
                            onNavigate={() => navigate(item.href)}
                          />
                        ) : (
                          <CheckCircle2 className="h-4 w-4 shrink-0 text-transparent" aria-hidden />
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </div>

            {/* Footer */}
            <div className="flex flex-wrap items-center justify-end gap-3 border-t border-slate-100 px-4 py-2.5 sm:px-5">
              <div className="flex items-center gap-3">
                {isLoading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-ink-muted" />
                ) : null}
                <Link
                  href="/settings"
                  onClick={closePalette}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-secondary transition hover:text-ink"
                >
                  <Settings className="h-3.5 w-3.5" />
                  Paramètres
                </Link>
              </div>
            </div>
          </div>
        </div>
  ) : null;

  if (!mounted || !modal) return null;
  return createPortal(modal, document.body);
}
