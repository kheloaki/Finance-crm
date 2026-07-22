import type { CompanySettings } from "@/lib/convex-types";
import type { AmountDisplay, DocumentType, LineItem } from "@/lib/documents";
import { isDeliveryNote } from "@/lib/documents";
import { normalizeCurrency } from "@/lib/currencies";
import { normalizeDocumentColor } from "@/lib/document-colors";
import {
  documentTypeLabel,
  localeForLanguage,
  normalizeDocumentLanguage,
  t,
} from "@/lib/document-i18n";
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
    | "currency"
    | "documentLanguage"
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
  currency: string;
  dueLabel: string;
};

export function buildDocumentExportModel(input: DocumentExportInput): DocumentExportModel {
  const totals = computeDocumentTotals(
    input.lines,
    input.vatRate,
    input.discount,
    input.deposit,
  );
  const lang = normalizeDocumentLanguage(input.settings.documentLanguage);
  const locale = localeForLanguage(lang);
  const showTtc = input.vatRate > 0;

  return {
    ...input,
    ...totals,
    amountDisplay: (showTtc ? "ht_ttc" : "ht") as AmountDisplay,
    showTtc,
    templateId: normalizeDocumentTemplate(input.settings.documentTemplate),
    theme: resolveDocumentTheme(normalizeDocumentColor(input.settings.documentColor)),
    delivery: isDeliveryNote(input.documentType),
    label: documentTypeLabel(lang, input.documentType),
    counterpartyLabel: t(lang, input.isSupplier ? "supplier" : "client"),
    dateFormatted: input.date ? formatDate(input.date, locale) : "—",
    dueDateFormatted: input.dueDate ? formatDate(input.dueDate, locale) : undefined,
    notes: input.notes ?? "",
    currency: normalizeCurrency(input.settings.currency),
    dueLabel:
      showTtc || input.deposit > 0 ? t(lang, "netPayable") : t(lang, "netHt"),
  };
}
