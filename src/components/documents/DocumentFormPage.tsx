"use client";

import { useMutation, useQuery } from "convex/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ExternalLink, Eye, Stamp } from "lucide-react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import type {
  CatalogItem,
  Client,
  CompanySettings,
  EnrichedDocument,
  Supplier,
} from "@/lib/convex-types";
import { PageHeader } from "@/components/layout/AppShell";
import { DocumentPreview } from "@/components/documents/DocumentPreview";
import { LineItemsEditor } from "@/components/documents/LineItemsEditor";
import { exportDocumentPdf } from "@/lib/pdf/document-pdf";
import { Button } from "@/components/ui/button";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";
import { Label, Textarea } from "@/components/ui/input";
import { CounterpartySelectWithSheet } from "@/components/documents/CounterpartySelectWithSheet";
import { ProjectSelect, projectIdForSave } from "@/components/projects/ProjectSelect";
import { HtTtcField } from "@/components/ui/ht-ttc-field";
import { inputClass, labelClass, panelClass, sectionTitleClass } from "@/lib/design";
import {
  DOCUMENT_LABELS,
  documentPath,
  isDeliveryNote,
  isSupplierDocument,
  type DocumentType,
  type LineItem,
} from "@/lib/documents";
import { computeDocumentTotals, DEFAULT_VAT_RATE, formatMoney } from "@/lib/money";
import { hasSellerFooter } from "@/lib/seller-footer";
import { cn, todayIso } from "@/lib/utils";

const PREVIEW_PREF_KEY = "aga-doc-preview-open";

const VAT_PRESETS = [0, 7, 10, 14, 20];

type Props = {
  documentType: DocumentType;
  documentId?: string;
};

export function DocumentFormPage({ documentType, documentId }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isNew = !documentId || documentId === "new";
  const urlProjectId = searchParams.get("project");
  const existing = useQuery(
    api.documents.get,
    isNew ? "skip" : { id: documentId as Id<"documents"> },
  ) as EnrichedDocument | null | undefined;
  const clients = useQuery(api.clients.list, {}) as Client[] | undefined;
  const suppliers = useQuery(api.suppliers.list, {}) as Supplier[] | undefined;
  const catalog = useQuery(api.catalog.list, {}) as CatalogItem[] | undefined;
  const settings = useQuery(api.companySettings.get) as CompanySettings | null | undefined;

  const [date, setDate] = useState(todayIso());
  const [dueDate, setDueDate] = useState("");
  const [reference, setReference] = useState("");
  const [clientId, setClientId] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [vatRate, setVatRate] = useState(DEFAULT_VAT_RATE);
  const [discount, setDiscount] = useState(0);
  const [deposit, setDeposit] = useState(0);
  const [notes, setNotes] = useState("");
  const [showCachet, setShowCachet] = useState(false);
  const [projectId, setProjectId] = useState("");
  const [lines, setLines] = useState<LineItem[]>([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [previewScale, setPreviewScale] = useState<"fit" | "full">("fit");
  const [previewOpen, setPreviewOpen] = useState(true);
  const [deleteDraftOpen, setDeleteDraftOpen] = useState(false);
  const [cancelDocOpen, setCancelDocOpen] = useState(false);
  const [destructivePending, setDestructivePending] = useState(false);
  const hydratedDocIdRef = useRef<string | null>(null);
  const skipHydrateForIdRef = useRef<string | null>(null);

  const nextNumber = useQuery(api.documents.getNextNumber, {
    documentType,
    date: todayIso(),
  }) as string | undefined;

  const createDoc = useMutation(api.documents.create);
  const updateDoc = useMutation(api.documents.update);
  const issueDoc = useMutation(api.documents.issue);
  const cancelDoc = useMutation(api.documents.cancel);
  const duplicateDoc = useMutation(api.documents.duplicate);
  const removeDoc = useMutation(api.documents.remove);

  useEffect(() => {
    const stored = localStorage.getItem(PREVIEW_PREF_KEY);
    if (stored === "0") setPreviewOpen(false);
  }, []);

  function togglePreview() {
    setPreviewOpen((open) => {
      const next = !open;
      localStorage.setItem(PREVIEW_PREF_KEY, next ? "1" : "0");
      return next;
    });
  }

  useEffect(() => {
    if (!isNew || projectId) return;
    if (urlProjectId) setProjectId(urlProjectId);
  }, [isNew, projectId, urlProjectId]);

  useEffect(() => {
    if (isNew) {
      hydratedDocIdRef.current = null;
      skipHydrateForIdRef.current = null;
    }
  }, [documentId, isNew]);

  useEffect(() => {
    if (!existing) return;
    if (skipHydrateForIdRef.current === existing._id) {
      skipHydrateForIdRef.current = null;
      hydratedDocIdRef.current = existing._id;
      return;
    }
    if (hydratedDocIdRef.current === existing._id) return;
    hydratedDocIdRef.current = existing._id;
    setDate(existing.date);
    setDueDate(existing.dueDate ?? "");
    setReference(existing.reference);
    setClientId(existing.clientId ?? "");
    setSupplierId(existing.supplierId ?? "");
    setVatRate(existing.vatRate);
    setDiscount(existing.discount);
    setDeposit(existing.deposit);
    setNotes(existing.notes);
    setShowCachet(existing.showCachet ?? false);
    setProjectId(existing.projectId ?? "");
    setLines(
      existing.lines.map((l) => ({
        catalogItemId: l.catalogItemId,
        reference: l.reference,
        designation: l.designation,
        unit: l.unit,
        qty: l.qty,
        unitPriceHt: l.unitPriceHt,
        sortOrder: l.sortOrder,
        isNote: l.isNote,
      })),
    );
  }, [existing]);

  const isSupplier = isSupplierDocument(documentType);
  const selectedClient = clients?.find((c) => c._id === clientId);
  const selectedSupplier = suppliers?.find((s) => s._id === supplierId);

  const counterpartyName = isSupplier
    ? (selectedSupplier?.name ?? existing?.supplier?.name ?? "")
    : (selectedClient?.name ?? existing?.client?.name ?? "");
  const counterpartyIce = isSupplier
    ? (selectedSupplier?.ice ?? existing?.supplier?.ice ?? "")
    : (selectedClient?.ice ?? existing?.client?.ice ?? "");
  const counterpartyRepresentative = isSupplier
    ? (selectedSupplier?.representative ?? existing?.supplier?.representative ?? "")
    : (selectedClient?.representative ?? existing?.client?.representative ?? "");
  const counterpartyAddress = isSupplier
    ? (selectedSupplier?.address ?? existing?.supplier?.address ?? "")
    : (selectedClient?.address ?? existing?.client?.address ?? "");
  const counterpartyCity = isSupplier
    ? (selectedSupplier?.city ?? existing?.supplier?.city ?? "")
    : (selectedClient?.city ?? existing?.client?.city ?? "");

  const hasProductLines = lines.some((l) => !l.isNote && l.designation.trim());
  const hasCounterparty = isSupplier ? !!supplierId : !!clientId;

  const totals = useMemo(
    () => computeDocumentTotals(lines, vatRate, discount, deposit),
    [lines, vatRate, discount, deposit],
  );

  const readOnly = existing?.status === "issued" || existing?.status === "cancelled";
  const slug = documentType.replace(/_/g, "-");
  const number = existing?.number ?? nextNumber ?? "…";
  const docLabel = DOCUMENT_LABELS[documentType];

  const totalsPanel = !isDeliveryNote(documentType) ? (
    <div className={panelClass}>
      <h3 className={sectionTitleClass}>Totaux</h3>
      <div className="mt-4 space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-[#6B7280]">Total HT</span>
          <span className="tabular-nums font-medium">{formatMoney(totals.totalHt)} MAD</span>
        </div>
        <div>
          <Label className="mb-2 block">Remise</Label>
          <HtTtcField
            valueHt={discount}
            vatRate={vatRate}
            onChangeHt={setDiscount}
            disabled={readOnly}
            hint="Remise HT — saisissez HT ou TTC"
          />
        </div>
        <div>
          <Label className="mb-2 block">Acompte</Label>
          <HtTtcField
            valueHt={deposit}
            vatRate={vatRate}
            onChangeHt={setDeposit}
            disabled={readOnly}
            hint="Acompte HT — saisissez HT ou TTC"
          />
        </div>
        <div>
          <Label>TVA</Label>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {VAT_PRESETS.map((rate) => (
              <button
                key={rate}
                type="button"
                disabled={readOnly}
                onClick={() => setVatRate(rate)}
                className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                  vatRate === rate
                    ? "border-brand bg-brand text-white shadow-sm shadow-brand/20"
                    : "border-slate-200/90 bg-white text-ink-secondary hover:bg-brand-soft"
                }`}
              >
                {rate}%
              </button>
            ))}
          </div>
        </div>
        <div className="rounded-xl bg-[#FAFBFC] px-3 py-3">
          <div className="flex justify-between text-base font-bold text-ink">
            <span>Total TTC</span>
            <span className="tabular-nums">{formatMoney(totals.totalTtc)} MAD</span>
          </div>
          <div className="mt-1 flex justify-between text-sm text-[#6B7280]">
            <span>Net à payer</span>
            <span className="tabular-nums font-semibold text-ink">
              {formatMoney(totals.netToPay)} MAD
            </span>
          </div>
        </div>
      </div>
    </div>
  ) : (
    <div className={`${panelClass} text-sm text-[#6B7280]`}>
      Bon de livraison — quantités uniquement, sans montants.
    </div>
  );

  const saveDraft = useCallback(async () => {
    if (!hasCounterparty) {
      setError(isSupplier ? "Sélectionnez un fournisseur." : "Sélectionnez un client.");
      return;
    }
    if (!hasProductLines) {
      setError("Ajoutez au moins une ligne avec une désignation.");
      return;
    }

    setError("");
    setSaveStatus("saving");
    setPending(true);
    try {
      const payload = {
        documentType,
        date,
        dueDate: dueDate || undefined,
        reference,
        clientId: clientId ? (clientId as Id<"clients">) : undefined,
        supplierId: supplierId ? (supplierId as Id<"suppliers">) : undefined,
        vatRate,
        discount,
        deposit,
        notes,
        showCachet,
        lines: lines.map((l, i) => ({
          ...l,
          sortOrder: i,
          catalogItemId: l.catalogItemId
            ? (l.catalogItemId as Id<"catalogItems">)
            : undefined,
        })),
      };

      if (isNew) {
        const savedProjectId = projectIdForSave(projectId);
        const id = await createDoc({
          ...payload,
          ...(savedProjectId ? { folderId: savedProjectId } : {}),
        });
        hydratedDocIdRef.current = id;
        skipHydrateForIdRef.current = id;
        setSaveStatus("saved");
        router.replace(`/documents/${slug}/${id}`);
      } else {
        const savedProjectId = projectIdForSave(projectId);
        await updateDoc({
          id: documentId as Id<"documents">,
          ...payload,
          folderId: savedProjectId ?? null,
        });
        setSaveStatus("saved");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
      setSaveStatus("error");
    } finally {
      setPending(false);
    }
  }, [
    hasCounterparty,
    hasProductLines,
    isSupplier,
    documentType,
    date,
    dueDate,
    reference,
    clientId,
    supplierId,
    vatRate,
    discount,
    deposit,
    notes,
    showCachet,
    lines,
    isNew,
    createDoc,
    updateDoc,
    documentId,
    router,
    projectId,
    slug,
  ]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        if (!readOnly && !pending) void saveDraft();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [readOnly, pending, saveDraft]);

  async function handleIssue() {
    await saveDraft();
    if (!documentId || documentId === "new") return;
    setPending(true);
    try {
      await issueDoc({ id: documentId as Id<"documents"> });
    } finally {
      setPending(false);
    }
  }

  async function handlePdf() {
    if (!settings) return;
    if (!hasCounterparty) {
      setError(isSupplier ? "Sélectionnez un fournisseur." : "Sélectionnez un client.");
      return;
    }
    if (!hasProductLines) {
      setError("Ajoutez au moins une ligne avec une désignation.");
      return;
    }

    await exportDocumentPdf({
      documentType,
      number,
      date,
      dueDate: dueDate || undefined,
      reference,
      vatRate,
      discount,
      deposit,
      notes,
      lines,
      isSupplier,
      showCachet,
      counterparty: {
        name: counterpartyName,
        ice: counterpartyIce || undefined,
        representative: counterpartyRepresentative || undefined,
        address: counterpartyAddress || undefined,
        city: counterpartyCity || undefined,
      },
      settings,
    });
  }

  const hasCachetAsset = !!settings?.cachetUrl;

  const cachetButton = settings ? (
    <Button
      type="button"
      variant={showCachet ? "default" : "secondary"}
      size="sm"
      className="h-7 gap-1 px-2 text-[10px]"
      disabled={!hasCachetAsset || readOnly}
      title={
        !hasCachetAsset
          ? "Téléversez un cachet dans Modèle société"
          : showCachet
            ? "Retirer le cachet du document"
            : "Ajouter le cachet sur ce document"
      }
      onClick={() => setShowCachet((v) => !v)}
    >
      <Stamp className="h-3 w-3" />
      {showCachet ? "Cachet ajouté" : "Ajouter cachet"}
    </Button>
  ) : null;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="shrink-0 border-b border-black/[0.06] px-4 py-3 sm:px-5">
        <PageHeader
          title={isNew ? `Nouveau ${docLabel.toLowerCase()}` : `${docLabel} ${number}`}
          description={
            existing?.status === "issued"
              ? "Document émis — lecture seule"
              : existing?.status === "cancelled"
                ? "Document annulé"
                : "Saisissez à gauche — l'aperçu se met à jour en direct. ⌘S pour enregistrer."
          }
          compact
          actions={
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={togglePreview}
              title={previewOpen ? "Masquer l'aperçu" : "Afficher l'aperçu"}
            >
              <Eye className="h-4 w-4" />
              Aperçu
            </Button>
            <Button variant="secondary" asChild>
              <Link href={documentPath(documentType)}>Retour</Link>
            </Button>
            {!readOnly ? (
              <Button onClick={() => void saveDraft()} disabled={pending}>
                {pending ? "Enregistrement…" : isNew ? "Enregistrer" : "Mettre à jour"}
              </Button>
            ) : null}
            {existing?.status === "draft" ? (
              <Button variant="secondary" onClick={() => void handleIssue()} disabled={pending}>
                Émettre
              </Button>
            ) : null}
            {settings ? (
              <Button variant="secondary" onClick={() => void handlePdf()}>
                Exporter PDF
              </Button>
            ) : null}
            {cachetButton ? (
              <span className="hidden sm:inline-flex">{cachetButton}</span>
            ) : null}
            {existing ? (
              <Button
                variant="outline"
                onClick={async () => {
                  const id = await duplicateDoc({ id: documentId as Id<"documents"> });
                  router.push(`/documents/${slug}/${id}`);
                }}
              >
                Dupliquer
              </Button>
            ) : null}
          </div>
        }
        />
      </div>

      {error ? (
        <p className="mx-4 mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 sm:mx-5">
          {error}
        </p>
      ) : null}

      <div
        className={cn(
          "flex min-h-0 flex-1 flex-col overflow-y-auto xl:flex-row xl:overflow-hidden",
        )}
      >
        <div
          className={cn(
            "min-h-0 shrink-0 xl:overflow-y-auto",
            previewOpen ? "w-full xl:w-[58%] xl:shrink-0" : "w-full",
          )}
        >
          <div className="space-y-4 px-4 py-4 sm:px-5 sm:py-5">
          {(isNew || existing !== undefined) ? (
            <section className={panelClass}>
              <h3 className={sectionTitleClass}>Project</h3>
              <p className="mt-1 text-xs text-[#6B7280]">
                Assign this document to a project folder.
              </p>
              <div className="mt-4">
                <ProjectSelect value={projectId} onChange={setProjectId} readOnly={readOnly} />
              </div>
            </section>
          ) : null}

          <section className={panelClass}>
            <h3 className={sectionTitleClass}>En-tête</h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Numéro</label>
                <input className={`${inputClass} bg-[#F9FAFB]`} value={number} readOnly />
              </div>
              <div>
                <label className={labelClass}>Date</label>
                <input
                  type="date"
                  className={inputClass}
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  disabled={readOnly}
                />
              </div>
              {documentType === "facture" ? (
                <div>
                  <label className={labelClass}>Échéance</label>
                  <input
                    type="date"
                    className={inputClass}
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    disabled={readOnly}
                  />
                </div>
              ) : null}
              <div className={documentType === "facture" ? "" : "sm:col-span-2"}>
                <label className={labelClass}>Référence interne</label>
                <input
                  className={inputClass}
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  disabled={readOnly}
                  placeholder="Optionnel — visible sur le document"
                />
              </div>
            </div>
          </section>

          <section className={panelClass}>
            <h3 className={sectionTitleClass}>{isSupplier ? "Fournisseur" : "Client"}</h3>

            <div className="mt-4">
              <CounterpartySelectWithSheet
                kind={isSupplier ? "supplier" : "client"}
                clients={clients}
                suppliers={suppliers}
                value={isSupplier ? supplierId : clientId}
                onChange={isSupplier ? setSupplierId : setClientId}
                readOnly={readOnly}
              />
            </div>

            {hasCounterparty && (counterpartyIce || counterpartyAddress || counterpartyRepresentative) ? (
              <div className="mt-3 rounded-xl border border-black/[0.06] bg-[#FAFBFC] px-3 py-2.5 text-xs text-[#6B7280]">
                {counterpartyRepresentative ? (
                  <p>Représentée par {counterpartyRepresentative}</p>
                ) : null}
                {counterpartyIce ? <p>ICE : {counterpartyIce}</p> : null}
                {[counterpartyAddress, counterpartyCity].filter(Boolean).length > 0 ? (
                  <p>{[counterpartyAddress, counterpartyCity].filter(Boolean).join(", ")}</p>
                ) : null}
              </div>
            ) : null}
          </section>

          <section className={panelClass}>
            <LineItemsEditor
              lines={lines}
              onChange={setLines}
              catalog={catalog ?? []}
              readOnly={readOnly}
              hideAmounts={isDeliveryNote(documentType)}
              vatRate={vatRate}
              autoOpenCatalog={isNew && !readOnly}
            />
          </section>

          <section className={panelClass}>
            <h3 className={sectionTitleClass}>Notes & conditions</h3>
            <p className="mt-1 text-xs text-[#9CA3AF]">
              Apparaissent en bas du document PDF (délais, garanties, modalités de paiement…)
            </p>
            <Textarea
              className="mt-3 min-h-[100px]"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={readOnly}
              placeholder="Ex. : Validité 30 jours. Paiement à 60 jours fin de mois."
            />
          </section>

          {!previewOpen ? totalsPanel : null}
          </div>
        </div>

        {previewOpen ? (
        <aside className="flex min-h-0 w-full shrink-0 flex-col border-t border-black/[0.06] bg-[#F8F9FA] xl:w-[42%] xl:shrink-0 xl:overflow-y-auto xl:border-l xl:border-t-0">
          <div className="sticky top-0 z-[1] flex items-center justify-between gap-2 border-b border-black/[0.06] bg-[#F8F9FA]/95 px-4 py-2.5 backdrop-blur-sm">
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#9CA3AF]">
              Aperçu du document
            </p>
            <div className="flex items-center gap-1.5">
              {cachetButton}
              <div className="flex rounded-lg border border-black/[0.08] bg-white/80 p-0.5 text-[10px]">
                <button
                  type="button"
                  onClick={() => setPreviewScale("fit")}
                  className={`rounded-md px-2 py-0.5 font-medium ${
                    previewScale === "fit" ? "bg-brand text-white" : "text-ink-muted"
                  }`}
                >
                  Aperçu
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewScale("full")}
                  className={`rounded-md px-2 py-0.5 font-medium ${
                    previewScale === "full" ? "bg-brand text-white" : "text-ink-muted"
                  }`}
                >
                  A4
                </button>
              </div>
              <Button type="button" variant="ghost" size="sm" className="h-7 px-2" onClick={togglePreview} title="Masquer l'aperçu">
                <Eye className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          <div className="space-y-4 p-4">
          <DocumentPreview
            documentType={documentType}
            number={number}
            date={date}
            dueDate={dueDate}
            reference={reference}
            counterpartyName={counterpartyName}
            counterpartyIce={counterpartyIce}
            counterpartyRepresentative={counterpartyRepresentative}
            counterpartyAddress={counterpartyAddress}
            counterpartyCity={counterpartyCity}
            isSupplier={isSupplier}
            lines={lines}
            vatRate={vatRate}
            discount={discount}
            deposit={deposit}
            notes={notes}
            settings={settings}
            showCachet={showCachet}
            scale={previewScale}
          />

          {!readOnly && settings && !hasSellerFooter(settings) ? (
            <Link
              href="/settings"
              className="flex items-center gap-2 rounded-xl border border-amber-200/80 bg-amber-50/80 px-3 py-2 text-xs text-amber-900 hover:bg-amber-50"
            >
              <ExternalLink className="h-3.5 w-3.5 shrink-0" />
              Modèle société, mise en page et couleurs PDF → Paramètres
            </Link>
          ) : null}

          {totalsPanel}

          {existing?.status === "draft" ? (
            <Button
              variant="destructive"
              className="w-full"
              onClick={() => setDeleteDraftOpen(true)}
            >
              Supprimer le brouillon
            </Button>
          ) : null}
          {existing?.status === "issued" ? (
            <Button
              variant="destructive"
              className="w-full"
              onClick={() => setCancelDocOpen(true)}
            >
              Annuler le document
            </Button>
          ) : null}
          </div>
        </aside>
        ) : null}
      </div>

      <ConfirmDeleteDialog
        open={deleteDraftOpen}
        onClose={() => setDeleteDraftOpen(false)}
        title="Supprimer ce brouillon ?"
        description="Le document et toutes ses lignes seront définitivement supprimés. Cette action est irréversible."
        requireTypedConfirm
        pending={destructivePending}
        onConfirm={async () => {
          setDestructivePending(true);
          try {
            await removeDoc({ id: documentId as Id<"documents"> });
            setDeleteDraftOpen(false);
            router.push(documentPath(documentType));
          } finally {
            setDestructivePending(false);
          }
        }}
      />

      <ConfirmDeleteDialog
        open={cancelDocOpen}
        onClose={() => setCancelDocOpen(false)}
        title="Annuler ce document ?"
        description="Le document émis sera marqué comme annulé. Cette action est définitive et visible dans l'historique."
        requireTypedConfirm
        confirmLabel="Annuler le document"
        pending={destructivePending}
        onConfirm={async () => {
          setDestructivePending(true);
          try {
            await cancelDoc({ id: documentId as Id<"documents"> });
            setCancelDocOpen(false);
          } finally {
            setDestructivePending(false);
          }
        }}
      />

      {/* Sticky save bar */}
      <section className="shrink-0 border-t border-black/[0.08] bg-white/95 px-4 py-3 backdrop-blur-md sm:px-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-[#6B7280] sm:text-sm">
            {saveStatus === "saving" ? (
              "Enregistrement en cours…"
            ) : saveStatus === "saved" ? (
              <span className="text-emerald-700">✓ Document enregistré</span>
            ) : saveStatus === "error" ? (
              <span className="text-red-700">Échec — vérifiez les champs requis</span>
            ) : (
              <>
                <span className="hidden sm:inline">⌘S pour enregistrer · </span>
                {isNew
                  ? "Enregistrez le brouillon pour conserver vos modifications"
                  : readOnly
                    ? "Document verrouillé — dupliquez pour créer une copie modifiable"
                    : "Modifications enregistrées — vous pouvez continuer à éditer"}
              </>
            )}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" asChild>
              <Link href={documentPath(documentType)}>Annuler</Link>
            </Button>
            {!readOnly ? (
              <Button size="sm" onClick={() => void saveDraft()} disabled={pending}>
                {isNew ? "Enregistrer" : "Mettre à jour"}
              </Button>
            ) : null}
            {settings ? (
              <Button size="sm" variant="secondary" onClick={() => void handlePdf()}>
                Générer PDF
              </Button>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}
