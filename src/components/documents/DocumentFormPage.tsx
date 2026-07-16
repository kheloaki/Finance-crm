"use client";

import { useMutation, useQuery } from "convex/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import type {
  CatalogItem,
  Client,
  CompanySettings,
  EnrichedDocument,
  Supplier,
} from "@/lib/convex-types";
import {
  DocumentAmountDisplayButton,
  DocumentCachetButton,
  DocumentInlineEditor,
} from "@/components/documents/DocumentInlineEditor";
import { UnsavedChangesDialog } from "@/components/documents/UnsavedChangesDialog";
import { exportDocumentPdf } from "@/lib/pdf/document-pdf";
import { Button } from "@/components/ui/button";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";
import { projectIdForSave } from "@/components/projects/ProjectSelect";
import {
  documentPath,
  isSupplierDocument,
  normalizeAmountDisplay,
  type AmountDisplay,
  type DocumentType,
  type LineItem,
} from "@/lib/documents";
import {
  isDocumentFormDirty,
  snapshotDocumentForm,
  type DocumentFormSnapshot,
} from "@/lib/document-form-snapshot";
import { computeDocumentTotals, DEFAULT_VAT_RATE } from "@/lib/money";
import { todayIso } from "@/lib/utils";

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
  const [amountDisplay, setAmountDisplay] = useState<AmountDisplay>("ht_ttc");
  const [projectId, setProjectId] = useState("");
  const [lines, setLines] = useState<LineItem[]>([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [savedSnapshot, setSavedSnapshot] = useState<string | null>(null);
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
  const [leavePending, setLeavePending] = useState(false);
  const pendingNavigationRef = useRef<string | null>(null);
  const pendingActionRef = useRef<"duplicate" | null>(null);
  const [deleteDraftOpen, setDeleteDraftOpen] = useState(false);
  const [cancelDocOpen, setCancelDocOpen] = useState(false);
  const [destructivePending, setDestructivePending] = useState(false);
  const hydratedDocIdRef = useRef<string | null>(null);
  const skipHydrateForIdRef = useRef<string | null>(null);

  const slug = documentType.replace(/_/g, "-");

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
    setAmountDisplay(normalizeAmountDisplay(existing.amountDisplay));
    setProjectId(existing.projectId ?? "");
    const nextLines = existing.lines.map((l) => ({
      catalogItemId: l.catalogItemId,
      reference: l.reference,
      designation: l.designation,
      unit: l.unit,
      qty: l.qty,
      unitPriceHt: l.unitPriceHt,
      sortOrder: l.sortOrder,
      isNote: l.isNote,
    }));
    setLines(nextLines);
    setSavedSnapshot(
      snapshotDocumentForm({
        date: existing.date,
        dueDate: existing.dueDate ?? "",
        reference: existing.reference,
        clientId: existing.clientId ?? "",
        supplierId: existing.supplierId ?? "",
        vatRate: existing.vatRate,
        discount: existing.discount,
        deposit: existing.deposit,
        notes: existing.notes,
        showCachet: existing.showCachet ?? false,
        amountDisplay: normalizeAmountDisplay(existing.amountDisplay),
        projectId: existing.projectId ?? "",
        lines: nextLines,
      }),
    );
  }, [existing]);

  const readOnly = existing?.status === "issued" || existing?.status === "cancelled";

  const formSnapshot: DocumentFormSnapshot = useMemo(
    () => ({
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
      amountDisplay,
      projectId,
      lines,
    }),
    [
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
      amountDisplay,
      projectId,
      lines,
    ],
  );

  const isDirty = useMemo(
    () => !readOnly && isDocumentFormDirty(formSnapshot, savedSnapshot),
    [formSnapshot, savedSnapshot, readOnly],
  );

  const isSaved = !isDirty && savedSnapshot !== null;

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

  const number = existing?.number ?? nextNumber ?? "…";
  const hasCachetAsset = !!settings?.cachetUrl;

  const requestNavigation = useCallback(
    (href: string) => {
      if (readOnly || !isDirty) {
        router.push(href);
        return;
      }
      pendingNavigationRef.current = href;
      setLeaveDialogOpen(true);
    },
    [readOnly, isDirty, router],
  );

  const saveDraft = useCallback(
    async (opts?: { navigateTo?: string }): Promise<boolean> => {
      if (!hasCounterparty) {
        setError(isSupplier ? "Sélectionnez un fournisseur." : "Sélectionnez un client.");
        return false;
      }
      if (!hasProductLines) {
        setError("Ajoutez au moins une ligne avec une désignation.");
        return false;
      }

      setError("");
      setPending(true);
      try {
        const sharedPayload = {
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
          amountDisplay,
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
            ...sharedPayload,
            documentType,
            ...(savedProjectId ? { folderId: savedProjectId } : {}),
          });
          hydratedDocIdRef.current = id;
          skipHydrateForIdRef.current = id;
          setSavedSnapshot(snapshotDocumentForm(formSnapshot));
          if (opts?.navigateTo) {
            router.push(opts.navigateTo);
          } else {
            router.replace(`/documents/${slug}/${id}`);
          }
        } else {
          const savedProjectId = projectIdForSave(projectId);
          await updateDoc({
            id: documentId as Id<"documents">,
            ...sharedPayload,
            folderId: savedProjectId ?? null,
          });
          setSavedSnapshot(snapshotDocumentForm(formSnapshot));
          if (opts?.navigateTo) {
            router.push(opts.navigateTo);
          }
        }
        return true;
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erreur");
        return false;
      } finally {
        setPending(false);
      }
    },
    [
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
      amountDisplay,
      lines,
      formSnapshot,
      isNew,
      createDoc,
      updateDoc,
      documentId,
      router,
      projectId,
      slug,
    ],
  );

  useEffect(() => {
    if (!isDirty || readOnly) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty, readOnly]);

  useEffect(() => {
    if (!isDirty || readOnly) return;
    const handler = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest("a[href]");
      if (!anchor || anchor.getAttribute("target") === "_blank") return;
      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("mailto:")) return;
      let url: URL;
      try {
        url = new URL(href, window.location.origin);
      } catch {
        return;
      }
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname) return;
      e.preventDefault();
      e.stopPropagation();
      pendingNavigationRef.current = url.pathname + url.search + url.hash;
      setLeaveDialogOpen(true);
    };
    document.addEventListener("click", handler, true);
    return () => document.removeEventListener("click", handler, true);
  }, [isDirty, readOnly]);

  async function runDuplicate() {
    const id = await duplicateDoc({ id: documentId as Id<"documents"> });
    router.push(`/documents/${slug}/${id}`);
  }

  async function handleSaveAndLeave() {
    const href = pendingNavigationRef.current;
    const action = pendingActionRef.current;
    setLeavePending(true);
    try {
      const ok = await saveDraft(href ? { navigateTo: href } : undefined);
      if (ok) {
        setLeaveDialogOpen(false);
        pendingNavigationRef.current = null;
        if (action === "duplicate") {
          pendingActionRef.current = null;
          await runDuplicate();
        }
      }
    } finally {
      setLeavePending(false);
    }
  }

  function handleDiscardAndLeave() {
    const href = pendingNavigationRef.current;
    setLeaveDialogOpen(false);
    pendingNavigationRef.current = null;
    pendingActionRef.current = null;
    if (href) router.push(href);
  }

  const saveDraftAndStay = useCallback(async () => {
    await saveDraft();
  }, [saveDraft]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        if (!readOnly && !pending) void saveDraftAndStay();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [readOnly, pending, saveDraftAndStay]);

  async function handleIssue() {
    const ok = await saveDraft();
    if (!ok || !documentId || documentId === "new") return;
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
      amountDisplay,
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

  return (
    <>
      <DocumentInlineEditor
        documentType={documentType}
        number={number}
        date={date}
        dueDate={dueDate}
        reference={reference}
        onDateChange={setDate}
        onDueDateChange={setDueDate}
        onReferenceChange={setReference}
        isSupplier={isSupplier}
        clientId={clientId}
        supplierId={supplierId}
        onClientChange={setClientId}
        onSupplierChange={setSupplierId}
        clients={clients}
        suppliers={suppliers}
        projectId={projectId}
        onProjectChange={setProjectId}
        showProject={isNew || existing !== undefined}
        lines={lines}
        onLinesChange={setLines}
        catalog={catalog ?? []}
        vatRate={vatRate}
        onVatRateChange={setVatRate}
        discount={discount}
        onDiscountChange={setDiscount}
        deposit={deposit}
        onDepositChange={setDeposit}
        notes={notes}
        onNotesChange={setNotes}
        settings={settings}
        showCachet={showCachet}
        amountDisplay={amountDisplay}
        readOnly={readOnly}
        isNew={isNew}
        status={
          readOnly
            ? existing?.status
            : isDirty
              ? "draft"
              : isSaved
                ? "saved"
                : "draft"
        }
        totals={totals}
        autoOpenCatalog={false}
        error={error}
        toolbar={
          <>
            {!readOnly ? (
              <Button onClick={() => void saveDraftAndStay()} disabled={pending || isSaved}>
                {pending ? "Enregistrement…" : "Enregistrer"}
              </Button>
            ) : null}
            {existing?.status === "draft" ? (
              <Button variant="default" onClick={() => void handleIssue()} disabled={pending}>
                Émettre
              </Button>
            ) : null}
            {settings ? (
              <Button variant="secondary" onClick={() => void handlePdf()}>
                Exporter PDF
              </Button>
            ) : null}
            <Button
              type="button"
              variant="secondary"
              onClick={() => requestNavigation(documentPath(documentType))}
            >
              Retour
            </Button>
            {existing ? (
              <Button
                variant="outline"
                onClick={async () => {
                  if (isDirty) {
                    pendingActionRef.current = "duplicate";
                    setLeaveDialogOpen(true);
                    return;
                  }
                  await runDuplicate();
                }}
              >
                Dupliquer
              </Button>
            ) : null}
          </>
        }
        footer={
          !readOnly ? (
            <section className="shrink-0 border-t border-black/[0.08] bg-white/95 px-3 py-2 backdrop-blur-md sm:px-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-3">
                  <p className="text-xs sm:text-sm">
                    {pending ? (
                      "Enregistrement…"
                    ) : isDirty ? (
                      <span className="text-amber-700">Modifications non enregistrées</span>
                    ) : isSaved ? (
                      <span className="text-emerald-700">Enregistré</span>
                    ) : null}
                  </p>
                  <DocumentCachetButton
                    showCachet={showCachet}
                    hasCachetAsset={hasCachetAsset}
                    readOnly={readOnly}
                    onToggle={() => setShowCachet((v) => !v)}
                  />
                  <DocumentAmountDisplayButton
                    amountDisplay={amountDisplay}
                    readOnly={readOnly}
                    onChange={setAmountDisplay}
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  {existing?.status === "draft" ? (
                    <Button variant="destructive" size="sm" onClick={() => setDeleteDraftOpen(true)}>
                      Supprimer
                    </Button>
                  ) : null}
                  {existing?.status === "issued" ? (
                    <Button variant="destructive" size="sm" onClick={() => setCancelDocOpen(true)}>
                      Annuler
                    </Button>
                  ) : null}
                </div>
              </div>
            </section>
          ) : null
        }
      />

      <UnsavedChangesDialog
        open={leaveDialogOpen}
        isNew={isNew}
        pending={leavePending || pending}
        onClose={() => {
          setLeaveDialogOpen(false);
          pendingNavigationRef.current = null;
          pendingActionRef.current = null;
        }}
        onSave={handleSaveAndLeave}
        onDiscard={handleDiscardAndLeave}
      />

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
    </>
  );
}
