"use client";

import { useMutation, useQuery } from "convex/react";
import { useEffect, useMemo, useState } from "react";
import { Palette } from "lucide-react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { PageHeader } from "@/components/layout/AppShell";
import { DocumentPreview } from "@/components/documents/DocumentPreview";
import { DocumentDesignDialog } from "@/components/documents/DocumentDesignDialog";
import { TemplateThumbnail } from "@/components/settings/DocumentTemplatePicker";
import { LogoUpload } from "@/components/settings/LogoUpload";
import { CachetUpload } from "@/components/settings/CachetUpload";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input, Label, Textarea } from "@/components/ui/input";
import { SettingsFormSkeleton } from "@/components/ui/loading-skeletons";
import { panelClass, sectionTitleClass } from "@/lib/design";
import {
  DEFAULT_DOCUMENT_COLOR,
  getColorMeta,
  normalizeDocumentColor,
  type DocumentColorId,
} from "@/lib/document-colors";
import {
  DEFAULT_DOCUMENT_TEMPLATE,
  DOCUMENT_TEMPLATES,
  getTemplateMeta,
  normalizeDocumentTemplate,
  type DocumentTemplateId,
} from "@/lib/document-templates";
import { resolvePreviewCompanySettings } from "@/lib/company-settings-display";
import { hasSellerFooter } from "@/lib/seller-footer";

const SAMPLE_LINES = [
  {
    reference: "ART-001",
    designation: "Prestation de conseil",
    unit: "h",
    qty: 8,
    unitPriceHt: 450,
    sortOrder: 0,
  },
  {
    reference: "SRV-02",
    designation: "Frais de déplacement",
    unit: "forfait",
    qty: 1,
    unitPriceHt: 200,
    sortOrder: 1,
  },
];

export default function SettingsPage() {
  const org = useQuery(api.organizations.current);
  const settings = useQuery(api.companySettings.get);
  const upsert = useMutation(api.companySettings.upsert);
  const [pending, setPending] = useState(false);
  const [saved, setSaved] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | undefined>();
  const [cachetPreview, setCachetPreview] = useState<string | undefined>();
  const [designOpen, setDesignOpen] = useState(false);
  const [designApplying, setDesignApplying] = useState(false);

  const [form, setForm] = useState({
    sellerName: "",
    sellerActivity: "",
    sellerAddress: "",
    sellerPhone: "",
    sellerWebsite: "",
    sellerEmail: "",
    sellerIce: "",
    sellerIf: "",
    sellerRc: "",
    sellerCnss: "",
    logoStorageId: undefined as Id<"_storage"> | undefined,
    removeLogo: false,
    cachetStorageId: undefined as Id<"_storage"> | undefined,
    removeCachet: false,
    documentTemplate: DEFAULT_DOCUMENT_TEMPLATE as DocumentTemplateId,
    documentColor: DEFAULT_DOCUMENT_COLOR as DocumentColorId,
  });
  const orgId = org?._id;
  const orgName = org?.name;

  const emptySellerForm = (name: string) => ({
    sellerName: name,
    sellerActivity: "",
    sellerAddress: "",
    sellerPhone: "",
    sellerWebsite: "",
    sellerEmail: "",
    sellerIce: "",
    sellerIf: "",
    sellerRc: "",
    sellerCnss: "",
    logoStorageId: undefined as Id<"_storage"> | undefined,
    removeLogo: false,
    cachetStorageId: undefined as Id<"_storage"> | undefined,
    removeCachet: false,
    documentTemplate: DEFAULT_DOCUMENT_TEMPLATE as DocumentTemplateId,
    documentColor: DEFAULT_DOCUMENT_COLOR as DocumentColorId,
  });

  useEffect(() => {
    if (!orgId || !orgName) return;

    // Don't keep another org's identity on screen while settings load.
    if (settings === undefined) {
      setForm(emptySellerForm(orgName));
      setLogoPreview(undefined);
      setCachetPreview(undefined);
      setSaved(false);
      return;
    }

    setForm({
      sellerName: settings?.sellerName?.trim() || orgName,
      sellerActivity: settings?.sellerActivity ?? "",
      sellerAddress: settings?.sellerAddress ?? "",
      sellerPhone: settings?.sellerPhone ?? "",
      sellerWebsite: settings?.sellerWebsite ?? "",
      sellerEmail: settings?.sellerEmail ?? "",
      sellerIce: settings?.sellerIce ?? "",
      sellerIf: settings?.sellerIf ?? "",
      sellerRc: settings?.sellerRc ?? "",
      sellerCnss: settings?.sellerCnss ?? "",
      logoStorageId: settings?.logoStorageId,
      removeLogo: false,
      cachetStorageId: settings?.cachetStorageId,
      removeCachet: false,
      documentTemplate: normalizeDocumentTemplate(settings?.documentTemplate),
      documentColor: normalizeDocumentColor(settings?.documentColor),
    });
    setLogoPreview(settings?.logoUrl);
    setCachetPreview(settings?.cachetUrl);
    setSaved(false);
  }, [settings, orgId, orgName]);

  const previewSettings = useMemo(
    () =>
      resolvePreviewCompanySettings({
        sellerName: form.sellerName,
        sellerActivity: form.sellerActivity,
        sellerAddress: form.sellerAddress,
        sellerPhone: form.sellerPhone,
        sellerWebsite: form.sellerWebsite,
        sellerEmail: form.sellerEmail,
        sellerIce: form.sellerIce,
        sellerIf: form.sellerIf,
        sellerRc: form.sellerRc,
        sellerCnss: form.sellerCnss,
        logoUrl: logoPreview,
        cachetUrl: cachetPreview,
        documentTemplate: form.documentTemplate,
        documentColor: form.documentColor,
      }),
    [form, logoPreview, cachetPreview],
  );

  const selectedTemplate = getTemplateMeta(form.documentTemplate);
  const selectedColor = getColorMeta(form.documentColor);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setSaved(false);
    try {
      await upsert({
        sellerName: form.sellerName,
        sellerActivity: form.sellerActivity,
        sellerAddress: form.sellerAddress,
        sellerPhone: form.sellerPhone,
        sellerWebsite: form.sellerWebsite,
        sellerEmail: form.sellerEmail,
        sellerIce: form.sellerIce,
        sellerIf: form.sellerIf,
        sellerRc: form.sellerRc,
        sellerCnss: form.sellerCnss,
        logoStorageId: form.removeLogo ? undefined : form.logoStorageId,
        removeLogo: form.removeLogo,
        cachetStorageId: form.removeCachet ? undefined : form.cachetStorageId,
        removeCachet: form.removeCachet,
        documentTemplate: form.documentTemplate,
        documentColor: form.documentColor,
      });
      setSaved(true);
      if (form.removeLogo) {
        setLogoPreview(undefined);
        setForm((f) => ({ ...f, logoStorageId: undefined, removeLogo: false }));
      }
      if (form.removeCachet) {
        setCachetPreview(undefined);
        setForm((f) => ({ ...f, cachetStorageId: undefined, removeCachet: false }));
      }
    } finally {
      setPending(false);
    }
  }

  async function handleApplyDesign(templateId: DocumentTemplateId, colorId: DocumentColorId) {
    setDesignApplying(true);
    setSaved(false);
    try {
      const nextForm = { ...form, documentTemplate: templateId, documentColor: colorId };
      setForm(nextForm);
      await upsert({
        sellerName: nextForm.sellerName || orgName || "My company",
        sellerActivity: nextForm.sellerActivity,
        sellerAddress: nextForm.sellerAddress,
        sellerPhone: nextForm.sellerPhone,
        sellerWebsite: nextForm.sellerWebsite,
        sellerEmail: nextForm.sellerEmail,
        sellerIce: nextForm.sellerIce,
        sellerIf: nextForm.sellerIf,
        sellerRc: nextForm.sellerRc,
        sellerCnss: nextForm.sellerCnss,
        logoStorageId: nextForm.removeLogo ? undefined : nextForm.logoStorageId,
        removeLogo: nextForm.removeLogo,
        cachetStorageId: nextForm.removeCachet ? undefined : nextForm.cachetStorageId,
        removeCachet: nextForm.removeCachet,
        documentTemplate: templateId,
        documentColor: colorId,
      });
      setSaved(true);
      setDesignOpen(false);
    } finally {
      setDesignApplying(false);
    }
  }

  return (
    <div>
      <PageHeader title="Modèle société" />

      <div className="grid gap-4 xl:grid-cols-12">
        <div className="space-y-4 xl:col-span-7">
          <Card>
            <CardContent className="p-6">
              {settings === undefined ? (
                <SettingsFormSkeleton />
              ) : (
                <form onSubmit={handleSubmit} className="space-y-8">
                  <section>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h2 className={sectionTitleClass}>Design des documents</h2>
                      </div>
                      <Button type="button" variant="secondary" onClick={() => setDesignOpen(true)}>
                        <Palette className="h-4 w-4" />
                        Parcourir les {DOCUMENT_TEMPLATES.length} modèles
                      </Button>
                    </div>

                    <div className="mt-3 flex items-start gap-3 rounded-lg border border-black/[0.08] bg-[#FAFBFC] p-3">
                      <div className="w-[140px] shrink-0">
                        <TemplateThumbnail meta={selectedTemplate} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-ink">{selectedTemplate.label}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          {selectedTemplate.tags.map((tag) => (
                            <span
                              key={tag}
                              className="rounded-full bg-black/[0.04] px-2 py-0.5 text-[10px] font-medium text-[#6B7280]"
                            >
                              {tag}
                            </span>
                          ))}
                          <span className="inline-flex items-center gap-1.5 text-xs text-[#374151]">
                            <span
                              className="h-4 w-4 rounded-full border border-white shadow-sm"
                              style={{ backgroundColor: selectedColor.hex }}
                            />
                            {selectedColor.label}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setDesignOpen(true)}
                          className="mt-3 text-xs font-medium text-[#2563eb] hover:underline"
                        >
                          Changer de design…
                        </button>
                      </div>
                    </div>
                  </section>

                  <section className="border-t border-black/[0.06] pt-6">
                    <h2 className={sectionTitleClass}>Identité entreprise</h2>
                    <div className="mt-3 grid gap-3 lg:grid-cols-2">
                      <LogoUpload
                        logoUrl={logoPreview}
                        logoStorageId={form.logoStorageId}
                        disabled={pending}
                        onUploaded={(storageId, previewUrl) => {
                          setForm((f) => ({
                            ...f,
                            logoStorageId: storageId,
                            removeLogo: false,
                          }));
                          setLogoPreview(previewUrl);
                        }}
                        onRemoved={() => {
                          setForm((f) => ({
                            ...f,
                            logoStorageId: undefined,
                            removeLogo: true,
                          }));
                          setLogoPreview(undefined);
                        }}
                      />

                      <CachetUpload
                        cachetUrl={cachetPreview}
                        disabled={pending}
                        onUploaded={(storageId, previewUrl) => {
                          setForm((f) => ({
                            ...f,
                            cachetStorageId: storageId,
                            removeCachet: false,
                          }));
                          setCachetPreview(previewUrl);
                        }}
                        onRemoved={() => {
                          setForm((f) => ({
                            ...f,
                            cachetStorageId: undefined,
                            removeCachet: true,
                          }));
                          setCachetPreview(undefined);
                        }}
                      />

                      <div className="space-y-2">
                        <Label htmlFor="sellerName">Raison sociale</Label>
                        <Input
                          id="sellerName"
                          value={form.sellerName}
                          onChange={(e) => setForm((f) => ({ ...f, sellerName: e.target.value }))}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="sellerActivity">Activité</Label>
                        <Input
                          id="sellerActivity"
                          value={form.sellerActivity}
                          onChange={(e) =>
                            setForm((f) => ({ ...f, sellerActivity: e.target.value }))
                          }
                          placeholder="Ex. : Import-export, services IT…"
                        />
                      </div>
                      <div className="space-y-2 lg:col-span-2">
                        <Label htmlFor="sellerAddress">Adresse</Label>
                        <Textarea
                          id="sellerAddress"
                          value={form.sellerAddress}
                          onChange={(e) =>
                            setForm((f) => ({ ...f, sellerAddress: e.target.value }))
                          }
                          placeholder="Ex. : 12 Avenue Hassan II, Casablanca"
                        />
                      </div>
                    </div>
                  </section>

                  <section className="border-t border-black/[0.06] pt-6">
                    <h2 className={sectionTitleClass}>Coordonnées</h2>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="sellerPhone">Téléphone</Label>
                        <Input
                          id="sellerPhone"
                          value={form.sellerPhone}
                          onChange={(e) =>
                            setForm((f) => ({ ...f, sellerPhone: e.target.value }))
                          }
                          placeholder="Ex. : 05 22 00 00 00"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="sellerEmail">Email</Label>
                        <Input
                          id="sellerEmail"
                          type="email"
                          value={form.sellerEmail}
                          onChange={(e) =>
                            setForm((f) => ({ ...f, sellerEmail: e.target.value }))
                          }
                          placeholder="Ex. : contact@societe.com"
                        />
                      </div>
                      <div className="space-y-2 sm:col-span-2">
                        <Label htmlFor="sellerWebsite">Site web</Label>
                        <Input
                          id="sellerWebsite"
                          value={form.sellerWebsite}
                          onChange={(e) =>
                            setForm((f) => ({ ...f, sellerWebsite: e.target.value }))
                          }
                          placeholder="Ex. : www.societe.ma"
                        />
                      </div>
                    </div>
                  </section>

                  <section className="border-t border-black/[0.06] pt-6">
                    <h2 className={sectionTitleClass}>Identifiants légaux</h2>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="sellerIce">ICE</Label>
                        <Input
                          id="sellerIce"
                          value={form.sellerIce}
                          onChange={(e) => setForm((f) => ({ ...f, sellerIce: e.target.value }))}
                          placeholder="Ex. : 000000000000000"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="sellerIf">IF</Label>
                        <Input
                          id="sellerIf"
                          value={form.sellerIf}
                          onChange={(e) => setForm((f) => ({ ...f, sellerIf: e.target.value }))}
                          placeholder="Ex. : 00000000"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="sellerRc">RC</Label>
                        <Input
                          id="sellerRc"
                          value={form.sellerRc}
                          onChange={(e) => setForm((f) => ({ ...f, sellerRc: e.target.value }))}
                          placeholder="Ex. : 00000"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="sellerCnss">CNSS</Label>
                        <Input
                          id="sellerCnss"
                          value={form.sellerCnss}
                          onChange={(e) => setForm((f) => ({ ...f, sellerCnss: e.target.value }))}
                          placeholder="Ex. : 0000000"
                        />
                      </div>
                    </div>
                    {!hasSellerFooter(form) ? (
                      <p className="mt-3 text-xs text-amber-700">
                        Renseignez au moins un champ pour afficher le pied de page sur vos documents.
                      </p>
                    ) : null}
                  </section>

                  <div className="flex items-center gap-3 border-t border-black/[0.06] pt-4">
                    <Button type="submit" disabled={pending}>
                      {pending ? "Enregistrement…" : "Enregistrer"}
                    </Button>
                    {saved ? <span className="text-sm text-emerald-600">Enregistré.</span> : null}
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </div>

        <aside className="xl:col-span-5 xl:sticky xl:top-4 xl:self-start">
          <p className="mb-3 px-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#9CA3AF]">
            Aperçu du modèle
          </p>
          <div className={panelClass}>
            <DocumentPreview
              documentType="devis"
              number="001/2026"
              date={new Date().toISOString().slice(0, 10)}
              counterpartyName="Client exemple SARL"
              counterpartyIce="000000000000000"
              counterpartyCity="Casablanca"
              isSupplier={false}
              lines={SAMPLE_LINES}
              vatRate={20}
              discount={0}
              deposit={0}
              notes="Validité 30 jours. Paiement à réception."
              settings={previewSettings}
              templateId={form.documentTemplate}
              showCachet={false}
              previewMode
              scale="fit"
            />
          </div>
        </aside>
      </div>

      <DocumentDesignDialog
        open={designOpen}
        onClose={() => setDesignOpen(false)}
        settings={previewSettings}
        initialTemplateId={form.documentTemplate}
        initialColorId={form.documentColor}
        applying={designApplying}
        onApply={handleApplyDesign}
      />
    </div>
  );
}
