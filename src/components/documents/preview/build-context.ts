import {
  DOCUMENT_LABELS,
  isDeliveryNote,
  type DocumentType,
  type LineItem,
} from "@/lib/documents";
import type { CompanySettings } from "@/lib/convex-types";
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
};

export function buildPreviewContext(input: BuildInput): PreviewContext {
  const totals = computeDocumentTotals(input.lines, input.vatRate, input.discount, input.deposit);
  const deliveryNote = isDeliveryNote(input.documentType);

  return {
    templateId: input.templateId,
    documentType: input.documentType,
    label: DOCUMENT_LABELS[input.documentType],
    deliveryNote,
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
    sellerName: input.settings?.sellerName ?? "Aga Plus",
    sellerActivity: input.settings?.sellerActivity ?? "",
    sellerAddress: input.settings?.sellerAddress ?? "",
    sellerPhone: input.settings?.sellerPhone ?? "",
    sellerWebsite: input.settings?.sellerWebsite ?? "",
    sellerEmail: input.settings?.sellerEmail ?? "",
    sellerIce: input.settings?.sellerIce ?? "",
    sellerIf: input.settings?.sellerIf ?? "",
    sellerRc: input.settings?.sellerRc ?? "",
    sellerCnss: input.settings?.sellerCnss ?? "",
    sellerLegal: input.settings?.sellerLegal ?? "",
    sellerContact: input.settings?.sellerContact ?? "",
    logoUrl: input.settings?.logoUrl,
    cachetUrl: input.showCachet ? input.settings?.cachetUrl : undefined,
    theme: resolveDocumentTheme(normalizeDocumentColor(input.settings?.documentColor)),
    settings: input.settings,
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
