import Link from "next/link";
import {
  ExternalLink,
  FileText,
  ShoppingCart,
  Truck,
  Undo2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DOCUMENT_LABELS,
  documentPath,
  type DocumentType,
} from "@/lib/documents";
import type { DashboardStats } from "@/lib/convex-types";
import { DashboardSectionHeader, dashboardCardClass } from "@/components/dashboard/dashboard-ui";
import { cn } from "@/lib/utils";

const DOC_TYPES: {
  type: DocumentType;
  icon: typeof FileText;
  iconBg: string;
}[] = [
  { type: "devis", icon: FileText, iconBg: "bg-sky-50 text-sky-600" },
  { type: "bon_commande", icon: ShoppingCart, iconBg: "bg-violet-50 text-violet-600" },
  { type: "bon_livraison", icon: Truck, iconBg: "bg-amber-50 text-amber-600" },
  { type: "facture", icon: FileText, iconBg: "bg-emerald-50 text-emerald-600" },
  { type: "bon_retour", icon: Undo2, iconBg: "bg-rose-50 text-rose-600" },
];

type Props = {
  stats: DashboardStats | undefined;
};

export function DocumentTypesPanel({ stats }: Props) {
  return (
    <div className={cn(dashboardCardClass, "flex h-full flex-col overflow-hidden")}>
      <div className="border-b border-[#F3F4F6] px-5 py-4 sm:px-6">
        <DashboardSectionHeader
          title="Par type de document"
          subtitle="Volume du mois en cours."
          actionHref="/documents/devis"
          actionLabel="Tout voir"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#F3F4F6] bg-[#FAFBFC]/80 text-left text-[10px] font-semibold uppercase tracking-[0.08em] text-[#9CA3AF]">
              <th className="px-5 py-2.5 sm:px-6">Type</th>
              <th className="px-5 py-2.5 sm:px-6">Volume</th>
              <th className="px-5 py-2.5 sm:px-6">Statut</th>
              <th className="w-10 px-3 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {DOC_TYPES.map(({ type, icon: Icon, iconBg }) => {
              const count = stats?.byType?.[type] ?? 0;
              const active = count > 0;
              return (
                <tr
                  key={type}
                  className="group border-b border-[#F3F4F6] last:border-0 transition-colors hover:bg-[#FAFBFC]/80"
                >
                  <td className="px-5 py-3.5 sm:px-6">
                    <Link
                      href={documentPath(type)}
                      className="flex items-center gap-3 font-medium text-ink hover:text-blue-600"
                    >
                      <span
                        className={cn(
                          "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                          iconBg,
                        )}
                      >
                        <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
                      </span>
                      <span className="text-[13px]">{DOCUMENT_LABELS[type]}</span>
                    </Link>
                  </td>
                  <td className="px-5 py-3.5 tabular-nums text-[13px] text-[#374151] sm:px-6">
                    {count}
                  </td>
                  <td className="px-5 py-3.5 sm:px-6">
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#6B7280]">
                      <span
                        className={cn(
                          "h-1.5 w-1.5 rounded-full",
                          active ? "bg-emerald-500" : "bg-[#D1D5DB]",
                        )}
                      />
                      {active ? "Actif" : "Inactif"}
                    </span>
                  </td>
                  <td className="px-3 py-3.5">
                    <Link
                      href={documentPath(type)}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-[#9CA3AF] opacity-0 transition group-hover:opacity-100 hover:bg-black/[0.04] hover:text-[#374151]"
                      aria-label={`Ouvrir ${DOCUMENT_LABELS[type]}`}
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-auto border-t border-[#F3F4F6] bg-[#FAFBFC]/50 px-5 py-4 sm:px-6">
        <p className="text-[12px] leading-relaxed text-[#6B7280]">
          Chaque type dispose de son propre flux numéroté, aperçu PDF et export.
        </p>
        <Button variant="secondary" size="sm" asChild className="mt-3 w-full sm:w-auto">
          <Link href="/settings">Configurer le modèle PDF</Link>
        </Button>
      </div>
    </div>
  );
}
