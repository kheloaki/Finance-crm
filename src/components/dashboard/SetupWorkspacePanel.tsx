import { KeyRound, Package, UserPlus, Wrench } from "lucide-react";
import {
  DashboardLinkRow,
  DashboardSectionHeader,
  dashboardCardClass,
  dashboardSectionPaddingClass,
} from "@/components/dashboard/dashboard-ui";

const STEPS = [
  {
    href: "/settings",
    title: "Identité société",
    icon: KeyRound,
    iconClassName: "bg-blue-50 text-blue-600",
    featured: true,
  },
  {
    href: "/clients?new=1",
    title: "Clients & fournisseurs",
    icon: UserPlus,
    iconClassName: "bg-emerald-50 text-emerald-600",
  },
  {
    href: "/catalog/articles",
    title: "Catalogue articles",
    icon: Package,
    iconClassName: "bg-violet-50 text-violet-600",
  },
  {
    href: "/documents",
    title: "Premier document",
    icon: Wrench,
    iconClassName: "bg-rose-50 text-rose-600",
  },
] as const;

export function SetupWorkspacePanel() {
  return (
    <div className={dashboardCardClass}>
      <div className={dashboardSectionPaddingClass}>
        <DashboardSectionHeader title="Initialisez votre espace" />
        <div className="mt-3 space-y-0.5">
          {STEPS.map((step) => (
            <DashboardLinkRow key={step.href} {...step} />
          ))}
        </div>
      </div>
    </div>
  );
}
