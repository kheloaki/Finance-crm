"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Palette, X } from "lucide-react";
import type { Id } from "@convex/_generated/dataModel";
import { CachetUpload } from "@/components/settings/CachetUpload";
import { LogoUpload } from "@/components/settings/LogoUpload";
import { TemplateThumbnail } from "@/components/settings/DocumentTemplatePicker";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { AutoGrowTextarea } from "@/components/ui/auto-grow-textarea";
import { SearchableSelect } from "@/components/ui/searchable-select";
import type { CompanySettings } from "@/lib/convex-types";
import {
  DEFAULT_CURRENCY,
  listCurrencies,
  normalizeCurrency,
} from "@/lib/currencies";
import {
  DEFAULT_DOCUMENT_COLOR,
  getColorMeta,
  normalizeDocumentColor,
} from "@/lib/document-colors";
import {
  DEFAULT_DOCUMENT_LANGUAGE,
  DOCUMENT_LANGUAGES,
  normalizeDocumentLanguage,
} from "@/lib/document-i18n";
import {
  DEFAULT_DOCUMENT_TEMPLATE,
  getTemplateMeta,
  normalizeDocumentTemplate,
} from "@/lib/document-templates";
import type { CompanyBrandingPatch } from "@/lib/company-settings-upsert";

export type BrandingFocus = "logo" | "cachet" | "design" | "seller" | "footer" | "locale";

type Props = {
  open: boolean;
  onClose: () => void;
  settings?: CompanySettings | null;
  pending?: boolean;
  error?: string;
  initialFocus?: BrandingFocus;
  onSaveBranding: (patch: CompanyBrandingPatch) => void | Promise<void>;
  onOpenDesign: () => void;
};

type SellerForm = {
  sellerName: string;
  sellerActivity: string;
  sellerAddress: string;
  sellerPhone: string;
  sellerWebsite: string;
  sellerEmail: string;
  sellerIce: string;
  sellerIf: string;
  sellerRc: string;
  sellerCnss: string;
};

function sellerFormFromSettings(settings?: CompanySettings | null): SellerForm {
  return {
    sellerName: settings?.sellerName ?? "",
    sellerActivity: settings?.sellerActivity ?? "",
    sellerAddress: settings?.sellerAddress ?? "",
    sellerPhone: settings?.sellerPhone ?? "",
    sellerWebsite: settings?.sellerWebsite ?? "",
    sellerEmail: settings?.sellerEmail ?? "",
    sellerIce: settings?.sellerIce ?? "",
    sellerIf: settings?.sellerIf ?? "",
    sellerRc: settings?.sellerRc ?? "",
    sellerCnss: settings?.sellerCnss ?? "",
  };
}

export function DocumentBrandingSheet({
  open,
  onClose,
  settings,
  pending,
  error,
  initialFocus,
  onSaveBranding,
  onOpenDesign,
}: Props) {
  const [logoPreview, setLogoPreview] = useState<string | undefined>();
  const [cachetPreview, setCachetPreview] = useState<string | undefined>();
  const [form, setForm] = useState<SellerForm>(() => sellerFormFromSettings(settings));
  const [currency, setCurrency] = useState(DEFAULT_CURRENCY);
  const [documentLanguage, setDocumentLanguage] = useState(DEFAULT_DOCUMENT_LANGUAGE);
  const logoSectionRef = useRef<HTMLElement>(null);
  const cachetSectionRef = useRef<HTMLElement>(null);
  const designSectionRef = useRef<HTMLElement>(null);
  const sellerSectionRef = useRef<HTMLElement>(null);
  const footerSectionRef = useRef<HTMLElement>(null);
  const localeSectionRef = useRef<HTMLElement>(null);

  const currencyOptions = useMemo(
    () =>
      listCurrencies().map((c) => ({
        value: c.code,
        label: `${c.code} — ${c.name}`,
      })),
    [],
  );
  const languageOptions = useMemo(
    () => DOCUMENT_LANGUAGES.map((l) => ({ value: l.id, label: l.label })),
    [],
  );

  useEffect(() => {
    if (!open) return;
    setLogoPreview(settings?.logoUrl);
    setCachetPreview(settings?.cachetUrl);
    setForm(sellerFormFromSettings(settings));
    setCurrency(normalizeCurrency(settings?.currency));
    setDocumentLanguage(normalizeDocumentLanguage(settings?.documentLanguage));
  }, [open, settings]);

  useEffect(() => {
    if (!open || !initialFocus) return;
    const target =
      initialFocus === "logo"
        ? logoSectionRef.current
        : initialFocus === "cachet"
          ? cachetSectionRef.current
          : initialFocus === "seller"
            ? sellerSectionRef.current
            : initialFocus === "footer"
              ? footerSectionRef.current
              : initialFocus === "locale"
                ? localeSectionRef.current
                : designSectionRef.current;
    target?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [open, initialFocus]);

  if (!open) return null;

  const templateId = normalizeDocumentTemplate(
    settings?.documentTemplate ?? DEFAULT_DOCUMENT_TEMPLATE,
  );
  const colorId = normalizeDocumentColor(settings?.documentColor ?? DEFAULT_DOCUMENT_COLOR);
  const templateMeta = getTemplateMeta(templateId);
  const colorMeta = getColorMeta(colorId);
  const baseline = sellerFormFromSettings(settings);
  const sellerDirty = JSON.stringify(form) !== JSON.stringify(baseline);

  function patchField<K extends keyof SellerForm>(key: K, value: SellerForm[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  return (
    <div className="fixed inset-0 z-[250] flex items-end justify-center sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} role="presentation" />
      <div
        className="relative flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl border border-black/[0.08] bg-white shadow-2xl sm:rounded-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="document-branding-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-start justify-between gap-2 border-b border-black/[0.06] px-4 py-3">
          <div>
            <h2 id="document-branding-title" className="text-lg font-semibold text-ink">
              Modèle société
            </h2>
            <p className="mt-0.5 text-sm text-[#6B7280]">
              Société, pied de page, logo, cachet et design.
            </p>
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={onClose} aria-label="Fermer">
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-4 py-4">
          <section ref={sellerSectionRef} className="space-y-3">
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#9CA3AF]">
              Société
            </h3>
            <div className="space-y-2">
              <Label htmlFor="branding-seller-name">Raison sociale</Label>
              <AutoGrowTextarea
                id="branding-seller-name"
                value={form.sellerName}
                disabled={pending}
                onChange={(e) => patchField("sellerName", e.target.value)}
                placeholder="Nom de l'entreprise"
                minRows={1}
                className="min-h-[34px] rounded-lg border border-[#E5E7EB] bg-white px-2.5 py-1.5 text-sm text-ink outline-none placeholder:text-[#9CA3AF] focus:border-brand focus:ring-2 focus:ring-brand/10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="branding-seller-activity">Activité</Label>
              <AutoGrowTextarea
                id="branding-seller-activity"
                value={form.sellerActivity}
                disabled={pending}
                onChange={(e) => patchField("sellerActivity", e.target.value)}
                placeholder="Ex. : Import-export, services IT…"
                minRows={1}
                className="min-h-[34px] rounded-lg border border-[#E5E7EB] bg-white px-2.5 py-1.5 text-sm text-ink outline-none placeholder:text-[#9CA3AF] focus:border-brand focus:ring-2 focus:ring-brand/10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="branding-seller-address">Adresse</Label>
              <AutoGrowTextarea
                id="branding-seller-address"
                value={form.sellerAddress}
                disabled={pending}
                onChange={(e) => patchField("sellerAddress", e.target.value)}
                placeholder="Adresse affichée sur le document"
                minRows={2}
                className="min-h-[56px] rounded-lg border border-[#E5E7EB] bg-white px-2.5 py-1.5 text-sm text-ink outline-none placeholder:text-[#9CA3AF] focus:border-brand focus:ring-2 focus:ring-brand/10"
              />
            </div>
          </section>

          <section ref={footerSectionRef} className="space-y-3">
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#9CA3AF]">
              Pied de page
            </h3>
            <p className="text-xs text-[#6B7280]">
              Affiché en bas des documents (téléphone, email, ICE…).
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="branding-seller-phone">Téléphone</Label>
                <Input
                  id="branding-seller-phone"
                  value={form.sellerPhone}
                  disabled={pending}
                  onChange={(e) => patchField("sellerPhone", e.target.value)}
                  placeholder="05 22 00 00 00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="branding-seller-email">Email</Label>
                <Input
                  id="branding-seller-email"
                  type="email"
                  value={form.sellerEmail}
                  disabled={pending}
                  onChange={(e) => patchField("sellerEmail", e.target.value)}
                  placeholder="contact@societe.com"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="branding-seller-website">Site web</Label>
                <Input
                  id="branding-seller-website"
                  value={form.sellerWebsite}
                  disabled={pending}
                  onChange={(e) => patchField("sellerWebsite", e.target.value)}
                  placeholder="www.societe.ma"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="branding-seller-ice">ICE</Label>
                <Input
                  id="branding-seller-ice"
                  value={form.sellerIce}
                  disabled={pending}
                  onChange={(e) => patchField("sellerIce", e.target.value)}
                  placeholder="000000000000000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="branding-seller-if">IF</Label>
                <Input
                  id="branding-seller-if"
                  value={form.sellerIf}
                  disabled={pending}
                  onChange={(e) => patchField("sellerIf", e.target.value)}
                  placeholder="00000000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="branding-seller-rc">RC</Label>
                <Input
                  id="branding-seller-rc"
                  value={form.sellerRc}
                  disabled={pending}
                  onChange={(e) => patchField("sellerRc", e.target.value)}
                  placeholder="00000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="branding-seller-cnss">CNSS</Label>
                <Input
                  id="branding-seller-cnss"
                  value={form.sellerCnss}
                  disabled={pending}
                  onChange={(e) => patchField("sellerCnss", e.target.value)}
                  placeholder="0000000"
                />
              </div>
            </div>
            <Button
              type="button"
              size="sm"
              disabled={pending || !sellerDirty}
              onClick={() => void onSaveBranding({ ...form })}
            >
              Enregistrer société & pied de page
            </Button>
          </section>

          <section ref={logoSectionRef} className="space-y-2">
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#9CA3AF]">
              Logo
            </h3>
            <LogoUpload
              logoUrl={logoPreview}
              logoStorageId={settings?.logoStorageId as Id<"_storage"> | undefined}
              disabled={pending}
              onUploaded={async (storageId, previewUrl) => {
                setLogoPreview(previewUrl);
                await onSaveBranding({ logoStorageId: storageId, removeLogo: false });
              }}
              onRemoved={async () => {
                setLogoPreview(undefined);
                await onSaveBranding({ removeLogo: true });
              }}
            />
          </section>

          <section ref={cachetSectionRef} className="space-y-2">
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#9CA3AF]">
              Cachet
            </h3>
            <CachetUpload
              cachetUrl={cachetPreview}
              disabled={pending}
              onUploaded={async (storageId, previewUrl) => {
                setCachetPreview(previewUrl);
                await onSaveBranding({ cachetStorageId: storageId, removeCachet: false });
              }}
              onRemoved={async () => {
                setCachetPreview(undefined);
                await onSaveBranding({ removeCachet: true });
              }}
            />
          </section>

          <section ref={localeSectionRef} className="space-y-3">
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#9CA3AF]">
              Devise & langue
            </h3>
            <div className="space-y-2">
              <Label>Devise</Label>
              <SearchableSelect
                options={currencyOptions}
                value={currency}
                disabled={pending}
                placeholder="Choisir une devise…"
                onChange={(value) => {
                  setCurrency(value);
                  void onSaveBranding({ currency: value });
                }}
              />
            </div>
            <div className="space-y-2">
              <Label>Langue du document</Label>
              <SearchableSelect
                options={languageOptions}
                value={documentLanguage}
                disabled={pending}
                placeholder="Choisir une langue…"
                onChange={(value) => {
                  setDocumentLanguage(normalizeDocumentLanguage(value));
                  void onSaveBranding({ documentLanguage: value });
                }}
              />
              <p className="text-xs text-[#6B7280]">
                Traduit les libellés du document (pas toute l&apos;application).
              </p>
            </div>
          </section>

          <section ref={designSectionRef} className="space-y-2">
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#9CA3AF]">
              Design
            </h3>
            <div className="flex items-center gap-3 rounded-xl border border-black/[0.08] bg-[#FAFBFC] p-3">
              <div className="w-28 shrink-0">
                <TemplateThumbnail meta={templateMeta} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-ink">{templateMeta.label}</p>
                <p className="mt-0.5 text-xs text-[#6B7280]">{colorMeta.label}</p>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="mt-2"
                  disabled={pending}
                  onClick={onOpenDesign}
                >
                  <Palette className="h-3.5 w-3.5" />
                  Changer de design…
                </Button>
              </div>
            </div>
          </section>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          {pending ? <p className="text-xs text-[#6B7280]">Enregistrement…</p> : null}
        </div>
      </div>
    </div>
  );
}
