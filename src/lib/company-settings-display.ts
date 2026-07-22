import type { CompanySettings } from "@/lib/convex-types";
import { DEFAULT_CURRENCY } from "@/lib/currencies";
import { DEFAULT_DOCUMENT_COLOR } from "@/lib/document-colors";
import { DEFAULT_DOCUMENT_LANGUAGE } from "@/lib/document-i18n";
import { DEFAULT_DOCUMENT_TEMPLATE } from "@/lib/document-templates";

/** Fictional company — used only in template previews (settings, design picker). */
export const SAMPLE_COMPANY_SETTINGS: CompanySettings = {
  sellerName: "Atlas Construction SARL",
  sellerActivity: "Travaux publics & génie civil",
  sellerAddress: "12 Bd Zerktouni, Casablanca",
  sellerPhone: "05 22 45 67 89",
  sellerWebsite: "www.atlas-construction.ma",
  sellerEmail: "contact@atlas-construction.ma",
  sellerIce: "002543210000045",
  sellerIf: "45789123",
  sellerRc: "RC-45892-CAS",
  sellerCnss: "1234567",
  sellerLegal: "",
  sellerContact: "",
  documentTemplate: DEFAULT_DOCUMENT_TEMPLATE,
  documentColor: DEFAULT_DOCUMENT_COLOR,
  currency: DEFAULT_CURRENCY,
  documentLanguage: DEFAULT_DOCUMENT_LANGUAGE,
};

function filled(value?: string | null): value is string {
  return Boolean(value?.trim());
}

/** Real documents / PDF — only fields the user configured. */
export function resolveDocumentCompanySettings(
  settings?: CompanySettings | null,
): CompanySettings {
  return {
    sellerName: settings?.sellerName?.trim() ?? "",
    sellerActivity: settings?.sellerActivity?.trim() ?? "",
    sellerAddress: settings?.sellerAddress?.trim() ?? "",
    sellerPhone: settings?.sellerPhone?.trim(),
    sellerWebsite: settings?.sellerWebsite?.trim(),
    sellerEmail: settings?.sellerEmail?.trim(),
    sellerIce: settings?.sellerIce?.trim(),
    sellerIf: settings?.sellerIf?.trim(),
    sellerRc: settings?.sellerRc?.trim(),
    sellerCnss: settings?.sellerCnss?.trim(),
    sellerLegal: settings?.sellerLegal?.trim() ?? "",
    sellerContact: settings?.sellerContact?.trim() ?? "",
    logoUrl: settings?.logoUrl,
    cachetUrl: settings?.cachetUrl,
    documentTemplate: settings?.documentTemplate,
    documentColor: settings?.documentColor,
    currency: settings?.currency,
    documentLanguage: settings?.documentLanguage,
  };
}

/** Settings / design preview — sample placeholders for empty fields. */
export function resolvePreviewCompanySettings(
  settings?: Partial<CompanySettings> | null,
): CompanySettings {
  const sample = SAMPLE_COMPANY_SETTINGS;
  const s = settings ?? {};
  return {
    sellerName: filled(s.sellerName) ? s.sellerName.trim() : sample.sellerName,
    sellerActivity: filled(s.sellerActivity) ? s.sellerActivity.trim() : sample.sellerActivity,
    sellerAddress: filled(s.sellerAddress) ? s.sellerAddress.trim() : sample.sellerAddress,
    sellerPhone: filled(s.sellerPhone) ? s.sellerPhone.trim() : sample.sellerPhone,
    sellerWebsite: filled(s.sellerWebsite) ? s.sellerWebsite.trim() : sample.sellerWebsite,
    sellerEmail: filled(s.sellerEmail) ? s.sellerEmail.trim() : sample.sellerEmail,
    sellerIce: filled(s.sellerIce) ? s.sellerIce.trim() : sample.sellerIce,
    sellerIf: filled(s.sellerIf) ? s.sellerIf.trim() : sample.sellerIf,
    sellerRc: filled(s.sellerRc) ? s.sellerRc.trim() : sample.sellerRc,
    sellerCnss: filled(s.sellerCnss) ? s.sellerCnss.trim() : sample.sellerCnss,
    sellerLegal: s.sellerLegal?.trim() ?? "",
    sellerContact: s.sellerContact?.trim() ?? "",
    logoUrl: s.logoUrl,
    cachetUrl: s.cachetUrl,
    documentTemplate: s.documentTemplate ?? sample.documentTemplate,
    documentColor: s.documentColor ?? sample.documentColor,
    currency: s.currency ?? sample.currency,
    documentLanguage: s.documentLanguage ?? sample.documentLanguage,
  };
}

export function hasCompanyIdentity(
  settings?: Pick<CompanySettings, "sellerName" | "logoUrl"> | null,
): boolean {
  return Boolean(settings?.sellerName?.trim() || settings?.logoUrl);
}
