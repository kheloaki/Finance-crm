"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, X } from "lucide-react";
import { DocumentPreview } from "@/components/documents/DocumentPreview";
import { DocumentColorPicker } from "@/components/settings/DocumentColorPicker";
import { TemplateThumbnail } from "@/components/settings/DocumentTemplatePicker";
import { Button } from "@/components/ui/button";
import {
  DOCUMENT_TEMPLATES,
  getTemplateMeta,
  type DocumentTemplateId,
} from "@/lib/document-templates";
import type { DocumentColorId } from "@/lib/document-colors";
import { DOCUMENT_LABELS, DOCUMENT_TYPES, type DocumentType } from "@/lib/documents";
import type { CompanySettings } from "@/lib/convex-types";
import {
  resolveDocumentCompanySettings,
  resolvePreviewCompanySettings,
} from "@/lib/company-settings-display";
import {
  getDocumentPreviewSample,
  type DocumentPreviewSample,
} from "@/lib/document-preview-sample";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onClose: () => void;
  settings?: CompanySettings | null;
  initialTemplateId: DocumentTemplateId;
  initialColorId: DocumentColorId;
  /** When editing a document, preview with live data for the current type */
  previewOverride?: Partial<DocumentPreviewSample> & { documentType?: DocumentType };
  onApply: (templateId: DocumentTemplateId, colorId: DocumentColorId) => void | Promise<void>;
  applying?: boolean;
};

export function DocumentDesignDialog({
  open,
  onClose,
  settings,
  initialTemplateId,
  initialColorId,
  previewOverride,
  onApply,
  applying,
}: Props) {
  const [templateId, setTemplateId] = useState(initialTemplateId);
  const [colorId, setColorId] = useState(initialColorId);
  const [previewType, setPreviewType] = useState<DocumentType>(
    previewOverride?.documentType ?? "devis",
  );

  useEffect(() => {
    if (!open) return;
    setTemplateId(initialTemplateId);
    setColorId(initialColorId);
    setPreviewType(previewOverride?.documentType ?? "devis");
  }, [open, initialTemplateId, initialColorId, previewOverride?.documentType]);

  const previewSettings = useMemo(() => {
    const resolved = previewOverride
      ? resolveDocumentCompanySettings(settings)
      : resolvePreviewCompanySettings(settings);
    return {
      ...resolved,
      documentTemplate: templateId,
      documentColor: colorId,
    };
  }, [settings, templateId, colorId, previewOverride]);

  const sample = useMemo(() => {
    const base = getDocumentPreviewSample(previewType, previewSettings);
    if (!previewOverride) return base;
    return {
      ...base,
      documentType: previewType,
      isSupplier: previewType === "bon_commande",
      number: previewOverride.number ?? base.number,
      date: previewOverride.date ?? base.date,
      dueDate: previewOverride.dueDate ?? base.dueDate,
      reference: previewOverride.reference ?? base.reference,
      counterpartyName: previewOverride.counterpartyName || base.counterpartyName,
      counterpartyIce: previewOverride.counterpartyIce ?? base.counterpartyIce,
      counterpartyRepresentative:
        previewOverride.counterpartyRepresentative ?? base.counterpartyRepresentative,
      counterpartyAddress: previewOverride.counterpartyAddress ?? base.counterpartyAddress,
      counterpartyCity: previewOverride.counterpartyCity ?? base.counterpartyCity,
      lines: previewOverride.lines?.some((l) => l.designation.trim())
        ? previewOverride.lines
        : base.lines,
      vatRate: previewOverride.vatRate ?? base.vatRate,
      discount: previewOverride.discount ?? base.discount,
      deposit: previewOverride.deposit ?? base.deposit,
      notes: previewOverride.notes ?? base.notes,
    };
  }, [previewType, previewSettings, previewOverride]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-2 sm:p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} role="presentation" />
      <div
        className="relative flex max-h-[96vh] w-full max-w-[min(1400px,96vw)] flex-col overflow-hidden rounded-2xl border border-black/[0.08] bg-white shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="document-design-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-start justify-between gap-2 border-b border-black/[0.06] px-3 py-3 sm:px-4">
          <div>
            <h2 id="document-design-title" className="text-lg font-semibold text-ink">
              Choisir le design du document
            </h2>
            <p className="mt-1 text-sm text-[#6B7280]">
              {DOCUMENT_TEMPLATES.length} modèles — prévisualisez par type de document avant d&apos;appliquer.
            </p>
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={onClose} aria-label="Fermer">
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
          <div className="min-h-0 flex-1 overflow-y-auto border-b border-black/[0.06] p-4 sm:p-5 lg:border-b-0 lg:border-r">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#9CA3AF]">
              Type de document (aperçu)
            </p>
            <div className="mb-4 flex flex-wrap gap-1.5">
              {DOCUMENT_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setPreviewType(type)}
                  className={cn(
                    "rounded-lg px-2.5 py-1.5 text-xs font-medium transition",
                    previewType === type
                      ? "bg-brand text-white shadow-sm"
                      : "bg-[#F3F4F6] text-[#374151] hover:bg-[#E5E7EB]",
                  )}
                >
                  {DOCUMENT_LABELS[type]}
                </button>
              ))}
            </div>

            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#9CA3AF]">
              Modèles ({DOCUMENT_TEMPLATES.length})
            </p>
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {DOCUMENT_TEMPLATES.map((tpl) => {
                const selected = templateId === tpl.id;
                return (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => {
                      setTemplateId(tpl.id);
                      setColorId(getTemplateMeta(tpl.id).defaultColor);
                    }}
                    className={cn(
                      "rounded-xl border-2 p-2.5 text-left transition",
                      selected
                        ? "border-brand bg-[#FAFBFC] ring-2 ring-brand/10"
                        : "border-black/[0.08] bg-white hover:border-black/15 hover:shadow-sm",
                    )}
                  >
                    <TemplateThumbnail meta={tpl} />
                    <p className="mt-2 text-xs font-semibold text-ink">{tpl.label}</p>
                    {selected ? (
                      <span className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-semibold text-ink">
                        <Check className="h-3 w-3" /> Sélectionné
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>

            <div className="mt-5">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#9CA3AF]">
                Couleur du modèle
              </p>
              <DocumentColorPicker value={colorId} onChange={setColorId} />
            </div>
          </div>

          <div className="flex w-full shrink-0 flex-col bg-[#F8F9FA] lg:w-[min(420px,38%)]">
            <div className="shrink-0 border-b border-black/[0.06] px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#9CA3AF]">
                Aperçu — {DOCUMENT_LABELS[previewType]}
              </p>
              <p className="text-sm font-medium text-ink">
                {getTemplateMeta(templateId).label}
              </p>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-4">
              <DocumentPreview
                documentType={sample.documentType}
                number={sample.number}
                date={sample.date}
                dueDate={sample.dueDate}
                reference={sample.reference}
                counterpartyName={sample.counterpartyName}
                counterpartyIce={sample.counterpartyIce}
                counterpartyRepresentative={sample.counterpartyRepresentative}
                counterpartyAddress={sample.counterpartyAddress}
                counterpartyCity={sample.counterpartyCity}
                isSupplier={sample.isSupplier}
                lines={sample.lines}
                vatRate={sample.vatRate}
                discount={sample.discount}
                deposit={sample.deposit}
                notes={sample.notes}
                settings={previewSettings}
                templateId={templateId}
                previewMode={!previewOverride}
                showCachet={!previewOverride ? !!settings?.cachetUrl : false}
              />
            </div>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-black/[0.06] px-4 py-3 sm:px-6">
          <Button type="button" variant="secondary" onClick={onClose}>
            Annuler
          </Button>
          <Button
            type="button"
            onClick={() => void onApply(templateId, colorId)}
            disabled={applying}
          >
            {applying ? "Application…" : "Appliquer ce design"}
          </Button>
        </div>
      </div>
    </div>
  );
}
