"use client";

import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { DocumentPreview } from "@/components/documents/DocumentPreview";
import { DOCUMENT_SLUGS, isSupplierDocument, type DocumentType } from "@/lib/documents";
import type { CompanySettings, EnrichedDocument } from "@/lib/convex-types";
import { hasSellerFooter } from "@/lib/seller-footer";

type Props = {
  doc: EnrichedDocument;
  documentType: DocumentType;
  settings?: CompanySettings | null;
};

export function DocumentDetailPanel({ doc, documentType, settings }: Props) {
  const isSupplier = isSupplierDocument(documentType);
  const counterparty = doc.client ?? doc.supplier;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-black/[0.06] bg-white/80 px-3 py-2 backdrop-blur-sm">
        <p className="truncate text-xs font-semibold text-ink">N° {doc.number}</p>
        <Link
          href={`/documents/${DOCUMENT_SLUGS[documentType]}/${doc._id}`}
          className="shrink-0 text-[11px] font-medium text-[#6B7280] hover:text-ink hover:underline"
        >
          Ouvrir
        </Link>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        <DocumentPreview
          compact
          documentType={documentType}
          number={doc.number}
          date={doc.date}
          dueDate={doc.dueDate}
          reference={doc.reference}
          counterpartyName={counterparty?.name ?? doc.counterpartyName}
          counterpartyIce={counterparty?.ice}
          counterpartyRepresentative={counterparty?.representative}
          counterpartyAddress={counterparty?.address}
          counterpartyCity={counterparty?.city}
          isSupplier={isSupplier}
          lines={doc.lines.map((l) => ({
            catalogItemId: l.catalogItemId,
            reference: l.reference,
            designation: l.designation,
            unit: l.unit,
            qty: l.qty,
            unitPriceHt: l.unitPriceHt,
            sortOrder: l.sortOrder,
            isNote: l.isNote,
          }))}
          vatRate={doc.vatRate}
          discount={doc.discount}
          deposit={doc.deposit}
          notes={doc.notes}
          settings={settings}
          showCachet={doc.showCachet ?? false}
        />

        {!settings || !hasSellerFooter(settings) ? (
          <Link
            href="/settings"
            className="mt-3 flex items-center gap-1.5 rounded-lg border border-amber-200/80 bg-amber-50/80 px-2 py-1.5 text-[10px] leading-snug text-amber-900 hover:bg-amber-50"
          >
            <ExternalLink className="h-3 w-3 shrink-0" />
            Modèle société incomplet
          </Link>
        ) : null}
      </div>
    </div>
  );
}

export function DocumentDetailPanelWithSettings(props: Omit<Props, "settings">) {
  const settings = useQuery(api.companySettings.get) as CompanySettings | null | undefined;
  return <DocumentDetailPanel {...props} settings={settings} />;
}
