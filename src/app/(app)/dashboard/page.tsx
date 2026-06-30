"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { Link2 } from "lucide-react";
import { api } from "@convex/_generated/api";
import { ActivityOverviewChart } from "@/components/dashboard/ActivityOverviewChart";
import { DashboardKpiStrip } from "@/components/dashboard/DashboardKpiStrip";
import { DocumentTypesPanel } from "@/components/dashboard/DocumentTypesPanel";
import { RecentDocumentsTable } from "@/components/dashboard/RecentDocumentsTable";
import { SetupWorkspacePanel } from "@/components/dashboard/SetupWorkspacePanel";
import { DashboardSectionHeader, dashboardCardClass } from "@/components/dashboard/dashboard-ui";
import { NewDocumentMenu } from "@/components/documents/NewDocumentMenu";
import { Button } from "@/components/ui/button";
import type { DashboardStats } from "@/lib/convex-types";

export default function DashboardPage() {
  const stats = useQuery(api.documents.dashboardStats) as DashboardStats | undefined;

  return (
    <div className="space-y-6 pb-6 pt-1 sm:space-y-8 sm:pt-2">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#9CA3AF]">
            Finance CRM
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink sm:text-[28px]">
            Opérations documentaires
          </h1>
          <p className="mt-1.5 max-w-xl text-[13px] leading-relaxed text-[#6B7280] sm:text-sm">
            Pilotez devis, factures et référentiels — suivez l&apos;activité et exportez des PDF
            professionnels.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <NewDocumentMenu label="Nouveau document" />
          <Button variant="secondary" asChild>
            <Link href="/documents">
              <Link2 className="h-4 w-4" />
              All documents
            </Link>
          </Button>
        </div>
      </header>

      <SetupWorkspacePanel />

      <DashboardKpiStrip stats={stats} />

      <div className="grid gap-4 xl:grid-cols-12 xl:gap-6">
        <div className="xl:col-span-7">
          <ActivityOverviewChart stats={stats} />
        </div>
        <div className="xl:col-span-5">
          <DocumentTypesPanel stats={stats} />
        </div>
      </div>

      <div className={dashboardCardClass}>
        <div className="border-b border-[#F3F4F6] px-5 py-4 sm:px-6">
          <DashboardSectionHeader
            title="Documents récents"
            subtitle="Dernières modifications sur votre espace."
            actionHref="/documents"
            actionLabel="Voir tout"
          />
        </div>
        <div className="overflow-x-auto px-2 pb-2 pt-1 sm:px-4 sm:pb-4">
          <RecentDocumentsTable />
        </div>
      </div>
    </div>
  );
}
