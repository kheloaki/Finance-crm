import type { Id } from "@convex/_generated/dataModel";
import type { CompanySettings } from "@/lib/convex-types";
import type { DocumentColorId } from "@/lib/document-colors";
import type { DocumentLanguageId } from "@/lib/document-i18n";
import type { DocumentTemplateId } from "@/lib/document-templates";

export type CompanyBrandingPatch = {
  logoStorageId?: Id<"_storage">;
  removeLogo?: boolean;
  cachetStorageId?: Id<"_storage">;
  removeCachet?: boolean;
  documentTemplate?: DocumentTemplateId;
  documentColor?: DocumentColorId;
  currency?: string;
  documentLanguage?: DocumentLanguageId | string;
  sellerName?: string;
  sellerActivity?: string;
  sellerAddress?: string;
  sellerPhone?: string;
  sellerWebsite?: string;
  sellerEmail?: string;
  sellerIce?: string;
  sellerIf?: string;
  sellerRc?: string;
  sellerCnss?: string;
};

function pick(
  patchValue: string | undefined,
  settingsValue: string | undefined,
): string | undefined {
  return patchValue !== undefined ? patchValue : settingsValue;
}

/** Full `companySettings.upsert` args from current settings + a branding patch. */
export function buildCompanySettingsUpsertArgs(
  settings: CompanySettings | null | undefined,
  patch: CompanyBrandingPatch = {},
  fallbackSellerName = "My company",
) {
  return {
    sellerName:
      patch.sellerName !== undefined
        ? patch.sellerName.trim() || fallbackSellerName
        : settings?.sellerName?.trim() || fallbackSellerName,
    sellerActivity: pick(patch.sellerActivity, settings?.sellerActivity),
    sellerAddress: pick(patch.sellerAddress, settings?.sellerAddress),
    sellerPhone: pick(patch.sellerPhone, settings?.sellerPhone),
    sellerWebsite: pick(patch.sellerWebsite, settings?.sellerWebsite),
    sellerEmail: pick(patch.sellerEmail, settings?.sellerEmail),
    sellerIce: pick(patch.sellerIce, settings?.sellerIce),
    sellerIf: pick(patch.sellerIf, settings?.sellerIf),
    sellerRc: pick(patch.sellerRc, settings?.sellerRc),
    sellerCnss: pick(patch.sellerCnss, settings?.sellerCnss),
    sellerLegal: settings?.sellerLegal,
    sellerContact: settings?.sellerContact,
    logoStorageId: patch.removeLogo
      ? undefined
      : (patch.logoStorageId ?? (settings?.logoStorageId as Id<"_storage"> | undefined)),
    removeLogo: patch.removeLogo,
    cachetStorageId: patch.removeCachet
      ? undefined
      : (patch.cachetStorageId ?? (settings?.cachetStorageId as Id<"_storage"> | undefined)),
    removeCachet: patch.removeCachet,
    documentTemplate: patch.documentTemplate ?? settings?.documentTemplate,
    documentColor: patch.documentColor ?? settings?.documentColor,
    currency: patch.currency ?? settings?.currency,
    documentLanguage: patch.documentLanguage ?? settings?.documentLanguage,
  };
}
