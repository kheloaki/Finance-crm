import {
  isDeliveryNote,
  type AmountDisplay,
  type DocumentType,
  type LineItem,
} from "@/lib/documents";
import type { CompanySettings } from "@/lib/convex-types";
import { resolveDocumentCompanySettings, resolvePreviewCompanySettings } from "@/lib/company-settings-display";
import { normalizeCurrency } from "@/lib/currencies";
import { normalizeDocumentColor } from "@/lib/document-colors";
import {
  documentTypeLabel,
  isRtlLanguage,
  localeForLanguage,
  normalizeDocumentLanguage,
  t,
  type DocMsgKey,
  type DocumentLanguageId,
} from "@/lib/document-i18n";
import { normalizeDocumentTemplate, type DocumentTemplateId } from "@/lib/document-templates";
import { resolveDocumentTheme } from "@/lib/document-theme";
import { computeDocumentTotals, lineTotalTtc, roundMoney } from "@/lib/money";
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
  amountDisplay?: AmountDisplay;
  /** Use sample company data for empty fields (settings / design previews only). */
  previewMode?: boolean;
};

export function buildPreviewContext(input: BuildInput): PreviewContext {
  const totals = computeDocumentTotals(input.lines, input.vatRate, input.discount, input.deposit);
  const deliveryNote = isDeliveryNote(input.documentType);
  const company = input.previewMode
    ? resolvePreviewCompanySettings(input.settings)
    : resolveDocumentCompanySettings(input.settings);
  const showTtc = input.vatRate > 0;
  const lang = normalizeDocumentLanguage(company.documentLanguage);
  const locale = localeForLanguage(lang);
  const currency = normalizeCurrency(company.currency);
  const lineAmount = (line: LineItem) =>
    showTtc
      ? lineTotalTtc(line.qty, line.unitPriceHt, input.vatRate)
      : roundMoney(line.qty * line.unitPriceHt);
  const translate = (key: DocMsgKey) => t(lang, key);

  return {
    templateId: input.templateId,
    documentType: input.documentType,
    label: documentTypeLabel(lang, input.documentType),
    deliveryNote,
    previewMode: input.previewMode ?? false,
    number: input.number,
    date: input.date,
    dateFormatted: input.date ? formatDate(input.date, locale) : "—",
    dueDate: input.dueDate,
    dueDateFormatted: input.dueDate ? formatDate(input.dueDate, locale) : undefined,
    reference: input.reference,
    counterpartyLabel: translate(input.isSupplier ? "supplier" : "client"),
    counterpartyName: input.counterpartyName,
    counterpartyIce: input.counterpartyIce,
    counterpartyRepresentative: input.counterpartyRepresentative,
    addrLine: [input.counterpartyAddress, input.counterpartyCity].filter(Boolean).join(", "),
    lines: input.lines,
    vatRate: input.vatRate,
    discount: input.discount,
    deposit: input.deposit,
    depositLabel: translate(input.documentType === "facture" ? "depositPaid" : "deposit"),
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
    currency,
    lang,
    rtl: isRtlLanguage(lang),
    t: translate,
    ...totals,
    showTtc,
    // Always subtract acompte — when TVA is off, netToPay === netHt - deposit.
    dueAmount: totals.netToPay,
    dueLabel:
      showTtc || input.deposit > 0 ? translate("netPayable") : translate("netHt"),
    money: (n: number) => formatMoney(n, locale),
    lineAmount,
    lineTtc: lineAmount,
  };
}

export function resolveTemplateId(
  templateIdProp?: DocumentTemplateId,
  settings?: CompanySettings | null,
): DocumentTemplateId {
  return normalizeDocumentTemplate(templateIdProp ?? settings?.documentTemplate);
}

export type { DocumentLanguageId };
