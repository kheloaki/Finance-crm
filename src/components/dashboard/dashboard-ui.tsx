import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export const dashboardCardClass =
  "rounded-xl border border-black/[0.05] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.03),0_8px_24px_rgba(15,23,42,0.05)]";

export const dashboardSectionPaddingClass = "p-4";
export const dashboardSectionHeaderClass = "border-b border-[#F3F4F6] px-4 py-3";

export function DashboardSectionHeader({
  title,
  subtitle,
  actionHref,
  actionLabel,
  className,
}: {
  title: string;
  subtitle?: string;
  actionHref?: string;
  actionLabel?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex items-start justify-between gap-3", className)}>
      <div className="min-w-0">
        <h2 className="text-[17px] font-semibold tracking-tight text-ink">{title}</h2>
        {subtitle ? <p className="mt-0.5 text-[13px] leading-relaxed text-[#6B7280]">{subtitle}</p> : null}
      </div>
      {actionHref && actionLabel ? (
        <Link
          href={actionHref}
          className="shrink-0 text-[13px] font-medium text-blue-600 transition hover:text-blue-700 hover:underline"
        >
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}

export function DashboardFilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange?: (value: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#9CA3AF]">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        className="h-8 min-w-[112px] rounded-lg border border-black/[0.08] bg-[#FAFBFC] px-2.5 text-xs font-medium text-[#374151] outline-none transition focus:border-black/15 focus:bg-white focus:ring-2 focus:ring-black/[0.04]"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function OperationalBadge() {
  return (
    <span className="inline-flex h-8 items-center gap-1.5 self-end rounded-full border border-emerald-200/90 bg-emerald-50/90 px-3 text-xs font-medium text-emerald-800">
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-40" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
      </span>
      Opérationnel
    </span>
  );
}

export function DashboardLinkRow({
  href,
  icon: Icon,
  iconClassName,
  title,
  description,
  featured,
}: {
  href: string;
  icon: typeof ChevronRight;
  iconClassName: string;
  title: string;
  description?: string;
  featured?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group flex items-center gap-3 rounded-xl border transition-all",
        featured
          ? "border-black/[0.08] bg-[#FAFBFC] px-3 py-2.5 hover:border-black/[0.12] hover:bg-white hover:shadow-sm"
          : "border-transparent px-1.5 py-1.5 hover:bg-[#FAFBFC]",
      )}
    >
      <div
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
          iconClassName,
        )}
      >
        <Icon className="h-4 w-4" strokeWidth={1.75} />
      </div>
      <div className="min-w-0 flex-1">
        <p className={cn("text-[13px] font-semibold text-ink", featured && "text-sm")}>
          {title}
        </p>
        {description ? (
          <p className="mt-0.5 text-[11px] leading-relaxed text-[#6B7280] sm:text-xs">{description}</p>
        ) : null}
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-[#D1D5DB] transition group-hover:translate-x-0.5 group-hover:text-[#6B7280]" />
    </Link>
  );
}
