"use client";

import type { CompanySettings } from "@/lib/convex-types";
import type { DocumentType, LineItem } from "@/lib/documents";
import { buildPreviewContext, resolveTemplateId } from "@/components/documents/preview/build-context";
import { LAYOUT_REGISTRY } from "@/components/documents/preview/layouts";
import { getTemplateMeta, type DocumentTemplateId } from "@/lib/document-templates";
import { cn } from "@/lib/utils";

type Props = {
  documentType: DocumentType;
  number: string;
  date: string;
  dueDate?: string;
  reference?: string;
  counterpartyName: string;
  counterpartyIce?: string;
  counterpartyRepresentative?: string;
  counterpartyAddress?: string;
  counterpartyCity?: string;
  isSupplier: boolean;
  lines: LineItem[];
  vatRate: number;
  discount: number;
  deposit: number;
  notes?: string;
  settings?: CompanySettings | null;
  templateId?: DocumentTemplateId;
  showCachet?: boolean;
  amountDisplay?: import("@/lib/documents").AmountDisplay;
  /** Sample company data for empty fields — settings / design previews only. */
  previewMode?: boolean;
  scale?: "fit" | "full";
  compact?: boolean;
  hideFooterLabel?: boolean;
};

export function DocumentPreview({ compact, scale = "fit", hideFooterLabel, ...props }: Props) {
  const templateId = resolveTemplateId(props.templateId, props.settings);
  const meta = getTemplateMeta(templateId);
  const ctx = buildPreviewContext({
    ...props,
    templateId,
    isSupplier: props.isSupplier,
    showCachet: props.showCachet,
    previewMode: props.previewMode,
  });

  const Layout = LAYOUT_REGISTRY[templateId];

  return (
    <div
      className={cn(
        "w-full",
        compact && "document-preview-compact",
        scale === "fit" && "mx-auto max-w-full",
        scale === "full" && "mx-auto w-full max-w-[794px]",
      )}
    >
      <Layout ctx={ctx} />
      {!compact && !hideFooterLabel ? (
        <p className="mt-2 text-center text-[10px] text-[#9CA3AF]">
          {meta.label} — aperçu du modèle sélectionné
        </p>
      ) : null}
    </div>
  );
}
