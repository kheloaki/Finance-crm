import type { CompanySettings } from "@/lib/convex-types";
import type { AmountDisplay, DocumentType, LineItem } from "@/lib/documents";
import { DOCUMENT_LABELS, isDeliveryNote, normalizeAmountDisplay } from "@/lib/documents";
import { normalizeDocumentColor } from "@/lib/document-colors";
import { normalizeDocumentTemplate, type DocumentTemplateId } from "@/lib/document-templates";
import { resolveDocumentTheme, type DocumentTheme } from "@/lib/document-theme";
import { computeDocumentTotals } from "@/lib/money";
import { formatDate } from "@/lib/utils";

export type DocumentExportInput = {
  documentType: DocumentType;
  number: string;
  date: string;
  dueDate?: string;
  reference?: string;
  vatRate: number;
  discount: number;
  deposit: number;
  notes?: string;
  lines: LineItem[];
  isSupplier: boolean;
  showCachet?: boolean;
  amountDisplay?: AmountDisplay;
  counterparty: {
    name: string;
    ice?: string;
    address?: string;
    city?: string;
    representative?: string;
  };
  settings: Pick<
    CompanySettings,
    | "sellerName"
    | "sellerActivity"
    | "sellerAddress"
    | "sellerPhone"
    | "sellerWebsite"
    | "sellerEmail"
    | "sellerIce"
    | "sellerIf"
    | "sellerRc"
    | "sellerCnss"
    | "sellerLegal"
    | "sellerContact"
    | "logoUrl"
    | "cachetUrl"
    | "documentTemplate"
    | "documentColor"
  >;
};

export type DocumentExportModel = DocumentExportInput & {
  templateId: DocumentTemplateId;
  theme: DocumentTheme;
  delivery: boolean;
  label: string;
  counterpartyLabel: string;
  dateFormatted: string;
  dueDateFormatted?: string;
  totalHt: number;
  netHt: number;
  vatAmount: number;
  totalTtc: number;
  netToPay: number;
  showTtc: boolean;
};

export function buildDocumentExportModel(input: DocumentExportInput): DocumentExportModel {
  const totals = computeDocumentTotals(
    input.lines,
    input.vatRate,
    input.discount,
    input.deposit,
  );

  return {
    ...input,
    ...totals,
    amountDisplay: normalizeAmountDisplay(input.amountDisplay),
    showTtc: normalizeAmountDisplay(input.amountDisplay) === "ht_ttc",
    templateId: normalizeDocumentTemplate(input.settings.documentTemplate),
    theme: resolveDocumentTheme(normalizeDocumentColor(input.settings.documentColor)),
    delivery: isDeliveryNote(input.documentType),
    label: DOCUMENT_LABELS[input.documentType],
    counterpartyLabel: input.isSupplier ? "Fournisseur" : "Client",
    dateFormatted: input.date ? formatDate(input.date) : "—",
    dueDateFormatted: input.dueDate ? formatDate(input.dueDate) : undefined,
    notes: input.notes ?? "",
  };
}
