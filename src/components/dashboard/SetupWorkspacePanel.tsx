import { KeyRound, Package, UserPlus, Wrench } from "lucide-react";
import {
  DashboardLinkRow,
  DashboardSectionHeader,
  dashboardCardClass,
} from "@/components/dashboard/dashboard-ui";

const STEPS = [
  {
    href: "/settings",
    title: "Identité société",
    description: "Logo, cachet et mentions légales PDF.",
    icon: KeyRound,
    iconClassName: "bg-blue-50 text-blue-600",
    featured: true,
  },
  {
    href: "/clients?new=1",
    title: "Clients & fournisseurs",
    description: "Référentiel de facturation.",
    icon: UserPlus,
    iconClassName: "bg-emerald-50 text-emerald-600",
  },
  {
    href: "/catalog/articles",
    title: "Catalogue articles",
    description: "Références, unités et prix.",
    icon: Package,
    iconClassName: "bg-violet-50 text-violet-600",
  },
  {
    href: "/documents",
    title: "Premier document",
    description: "Devis, factures et bons.",
    icon: Wrench,
    iconClassName: "bg-rose-50 text-rose-600",
  },
] as const;

export function SetupWorkspacePanel() {
  return (
    <div className={dashboardCardClass}>
      <div className="p-5 sm:p-6">
        <DashboardSectionHeader
          title="Initialisez votre espace"
          subtitle="Configurez les éléments essentiels avant vos premiers documents commerciaux."
        />
        <div className="mt-5 space-y-1">
          {STEPS.map((step) => (
            <DashboardLinkRow key={step.href} {...step} />
          ))}
        </div>
      </div>
    </div>
  );
}
