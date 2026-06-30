"use client";

import { useMemo, useState } from "react";
import type { DashboardStats } from "@/lib/convex-types";
import {
  DashboardFilterSelect,
  DashboardSectionHeader,
  OperationalBadge,
  dashboardCardClass,
} from "@/components/dashboard/dashboard-ui";
import { ChartSkeleton } from "@/components/ui/loading-skeletons";
import { cn } from "@/lib/utils";

type Props = {
  stats: DashboardStats | undefined;
};

export function ActivityOverviewChart({ stats }: Props) {
  const [environment, setEnvironment] = useState("production");
  const [period, setPeriod] = useState("6m");

  const months = stats?.last6Months ?? [];
  const maxCount = Math.max(...months.map((m) => m.count), 1);

  const yTicks = useMemo(() => {
    const top = Math.max(maxCount, 4);
    const step = Math.ceil(top / 4);
    return [0, step, step * 2, step * 3, step * 4];
  }, [maxCount]);

  const displayMonths =
    period === "3m" ? months.slice(-3) : period === "6m" ? months : months.slice(-4);

  return (
    <div className={dashboardCardClass}>
      <div className="p-5 sm:p-6">
        <DashboardSectionHeader
          title="Aperçu activité"
          subtitle="Volume documentaire et tendance sur la période."
          actionHref="/documents/facture"
          actionLabel="Voir toutes les métriques"
        />

        <div className="mt-4 flex flex-wrap items-end justify-between gap-3 border-b border-[#F3F4F6] pb-4">
          <div className="flex flex-wrap gap-3">
            <DashboardFilterSelect
              label="Environnement"
              value={environment}
              options={[
                { value: "production", label: "Production" },
                { value: "drafts", label: "Brouillons" },
              ]}
              onChange={setEnvironment}
            />
            <DashboardFilterSelect
              label="Période"
              value={period}
              options={[
                { value: "3m", label: "3 mois" },
                { value: "6m", label: "6 mois" },
                { value: "ytd", label: "Année" },
              ]}
              onChange={setPeriod}
            />
          </div>
          <OperationalBadge />
        </div>

        {stats === undefined ? (
          <ChartSkeleton />
        ) : (
          <div className="relative mt-4">
            <div className="flex gap-3">
              <div className="flex w-8 shrink-0 flex-col justify-between py-1 text-[10px] font-medium tabular-nums text-[#9CA3AF]">
                {[...yTicks].reverse().map((tick) => (
                  <span key={tick}>{tick}</span>
                ))}
              </div>

              <div className="relative min-h-[220px] flex-1">
                <div
                  className="absolute inset-0 rounded-lg"
                  style={{
                    backgroundImage: `
                      linear-gradient(to right, rgba(15,23,42,0.04) 1px, transparent 1px),
                      linear-gradient(to bottom, rgba(15,23,42,0.05) 1px, transparent 1px)
                    `,
                    backgroundSize: "calc(100% / 6) 25%",
                  }}
                />

                <div className="relative flex h-[220px] items-end gap-1 sm:gap-2">
                  {displayMonths.map((m) => {
                    const heightPct = maxCount > 0 ? (m.count / maxCount) * 100 : 0;
                    const barH = Math.max(heightPct, m.count > 0 ? 6 : 2);
                    return (
                      <div key={m.month} className="flex min-w-0 flex-1 flex-col items-center">
                        <div className="relative flex h-[180px] w-full items-end justify-center px-0.5">
                          <div
                            className={cn(
                              "relative w-full max-w-[52px] overflow-hidden rounded-t-md",
                              "bg-gradient-to-t from-blue-600/90 via-blue-400/70 to-blue-300/40",
                              "shadow-[0_-2px_12px_rgba(59,130,246,0.15)]",
                            )}
                            style={{ height: `${barH}%` }}
                          >
                            <div className="absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-white/25 to-transparent" />
                          </div>
                        </div>
                        <span className="mt-2 text-[10px] font-medium text-[#9CA3AF]">{m.month}</span>
                        <span className="text-xs font-semibold tabular-nums text-[#374151]">{m.count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-[#F3F4F6] pt-3 text-[11px] text-[#6B7280]">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-gradient-to-t from-blue-600 to-blue-300" />
                Documents créés
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
