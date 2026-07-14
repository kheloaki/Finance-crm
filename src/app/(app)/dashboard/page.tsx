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
import { DashboardSectionHeader, dashboardCardClass, dashboardSectionHeaderClass } from "@/components/dashboard/dashboard-ui";
import { NewDocumentMenu } from "@/components/documents/NewDocumentMenu";
import { Button } from "@/components/ui/button";
import type { DashboardStats } from "@/lib/convex-types";

export default function DashboardPage() {
  const stats = useQuery(api.documents.dashboardStats) as DashboardStats | undefined;

  return (
    <div className="space-y-4 pb-4 pt-0.5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-[26px]">
          Opérations documentaires
        </h1>
        <div className="flex shrink-0 flex-wrap gap-2">
          <NewDocumentMenu label="Nouveau document" />
          <Button variant="secondary" asChild>
            <Link href="/documents">
              <Link2 className="h-4 w-4" />
              Tous les documents
            </Link>
          </Button>
        </div>
      </header>

      <SetupWorkspacePanel />

      <DashboardKpiStrip stats={stats} />

      <div className="grid gap-3 xl:grid-cols-12 xl:gap-4">
        <div className="xl:col-span-7">
          <ActivityOverviewChart stats={stats} />
        </div>
        <div className="xl:col-span-5">
          <DocumentTypesPanel stats={stats} />
        </div>
      </div>

      <div className={dashboardCardClass}>
        <div className={dashboardSectionHeaderClass}>
          <DashboardSectionHeader title="Documents récents" actionHref="/documents" actionLabel="Voir tout" />
        </div>
        <div className="overflow-x-auto px-2 pb-2 pt-1 sm:px-3 sm:pb-3">
          <RecentDocumentsTable />
        </div>
      </div>
    </div>
  );
}
