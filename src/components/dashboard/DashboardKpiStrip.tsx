import { Database, Layers, Package, Signal } from "lucide-react";
import { formatMoney } from "@/lib/money";
import type { DashboardStats } from "@/lib/convex-types";
import { dashboardCardClass } from "@/components/dashboard/dashboard-ui";
import { DashboardStatsSkeleton } from "@/components/ui/loading-skeletons";
import { cn } from "@/lib/utils";

const KPI_CONFIG = [
  {
    key: "documentsThisMonth" as const,
    label: "Documents ce mois",
    icon: Layers,
    iconWrap: "bg-emerald-50 text-emerald-600",
    format: false,
    suffix: "",
  },
  {
    key: "draftCount" as const,
    label: "Brouillons",
    icon: Database,
    iconWrap: "bg-blue-50 text-blue-600",
    format: false,
    suffix: "",
  },
  {
    key: "totalFactureTtc" as const,
    label: "Facturé TTC",
    icon: Signal,
    iconWrap: "bg-violet-50 text-violet-600",
    format: true,
    suffix: " MAD",
  },
  {
    key: "activeClients" as const,
    label: "Clients actifs",
    icon: Package,
    iconWrap: "bg-orange-50 text-orange-600",
    format: false,
    suffix: "",
  },
];

export function DashboardKpiStrip({ stats }: { stats: DashboardStats | undefined }) {
  if (stats === undefined) {
    return <DashboardStatsSkeleton />;
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {KPI_CONFIG.map(({ key, label, icon: Icon, iconWrap, format, suffix }) => {
        const raw = stats[key];
        const display = format ? formatMoney(raw) : String(raw);
        return (
          <div key={key} className={cn(dashboardCardClass, "p-3 sm:p-4")}>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#9CA3AF]">
                  {label}
                </p>
                <p className="mt-1.5 text-2xl font-semibold tabular-nums tracking-tight text-ink">
                  {display}
                  {suffix ? (
                    <span className="text-sm font-medium text-[#9CA3AF]">{suffix}</span>
                  ) : null}
                </p>
              </div>
              <div
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                  iconWrap,
                )}
              >
                <Icon className="h-4 w-4" strokeWidth={1.75} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
