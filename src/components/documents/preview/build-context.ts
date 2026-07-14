import {
  DOCUMENT_LABELS,
  isDeliveryNote,
  type DocumentType,
  type LineItem,
} from "@/lib/documents";
import type { CompanySettings } from "@/lib/convex-types";
import { resolveDocumentCompanySettings, resolvePreviewCompanySettings } from "@/lib/company-settings-display";
import { normalizeDocumentColor } from "@/lib/document-colors";
import { normalizeDocumentTemplate, type DocumentTemplateId } from "@/lib/document-templates";
import { resolveDocumentTheme } from "@/lib/document-theme";
import { computeDocumentTotals, lineTotalTtc } from "@/lib/money";
import { formatDate, formatMoney } from "@/lib/utils";
import type { PreviewContext } from "./types";

type BuildInput = {
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
  templateId: DocumentTemplateId;
  showCachet?: boolean;
  /** Use sample company data for empty fields (settings / design previews only). */
  previewMode?: boolean;
};

export function buildPreviewContext(input: BuildInput): PreviewContext {
  const totals = computeDocumentTotals(input.lines, input.vatRate, input.discount, input.deposit);
  const deliveryNote = isDeliveryNote(input.documentType);
  const company = input.previewMode
    ? resolvePreviewCompanySettings(input.settings)
    : resolveDocumentCompanySettings(input.settings);

  return {
    templateId: input.templateId,
    documentType: input.documentType,
    label: DOCUMENT_LABELS[input.documentType],
    deliveryNote,
    previewMode: input.previewMode ?? false,
    number: input.number,
    date: input.date,
    dateFormatted: input.date ? formatDate(input.date) : "—",
    dueDate: input.dueDate,
    dueDateFormatted: input.dueDate ? formatDate(input.dueDate) : undefined,
    reference: input.reference,
    counterpartyLabel: input.isSupplier ? "Fournisseur" : "Client",
    counterpartyName: input.counterpartyName,
    counterpartyIce: input.counterpartyIce,
    counterpartyRepresentative: input.counterpartyRepresentative,
    addrLine: [input.counterpartyAddress, input.counterpartyCity].filter(Boolean).join(", "),
    lines: input.lines,
    vatRate: input.vatRate,
    discount: input.discount,
    deposit: input.deposit,
    depositLabel: input.documentType === "facture" ? "Acompte versé" : "Acompte",
    notes: input.notes,
    sellerName: company.sellerName,
    sellerActivity: company.sellerActivity,
    sellerAddress: company.sellerAddress,
    sellerPhone: company.sellerPhone ?? "",
    sellerWebsite: company.sellerWebsite ?? "",
    sellerEmail: company.sellerEmail ?? "",
    sellerIce: company.sellerIce ?? "",
    sellerIf: company.sellerIf ?? "",
    sellerRc: company.sellerRc ?? "",
    sellerCnss: company.sellerCnss ?? "",
    sellerLegal: company.sellerLegal,
    sellerContact: company.sellerContact,
    logoUrl: company.logoUrl,
    cachetUrl: input.showCachet && company.cachetUrl ? company.cachetUrl : undefined,
    theme: resolveDocumentTheme(normalizeDocumentColor(company.documentColor ?? input.settings?.documentColor)),
    settings: company,
    ...totals,
    money: formatMoney,
    lineTtc: (line) => lineTotalTtc(line.qty, line.unitPriceHt, input.vatRate),
  };
}

export function resolveTemplateId(
  templateIdProp?: DocumentTemplateId,
  settings?: CompanySettings | null,
): DocumentTemplateId {
  return normalizeDocumentTemplate(templateIdProp ?? settings?.documentTemplate);
}
