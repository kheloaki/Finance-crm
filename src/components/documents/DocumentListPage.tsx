"use client";

import { useQuery } from "convex/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Eye, FileDown, Loader2, Pencil, Plus, Search } from "lucide-react";
import { api } from "@convex/_generated/api";
import { DocumentDetailPanelWithSettings } from "@/components/documents/DocumentDetailPanel";
import { PageHeader } from "@/components/layout/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  DOCUMENT_LABELS,
  DOCUMENT_SLUGS,
  documentNewPath,
  documentPath,
  isSupplierDocument,
  STATUS_BADGE_CLASS,
  STATUS_LABELS,
  type DocumentType,
} from "@/lib/documents";
import type { CompanySettings, EnrichedDocument } from "@/lib/convex-types";
import { isDeliveryNote } from "@/lib/documents";
import { exportDocumentPdf } from "@/lib/pdf/document-pdf";
import { DocumentListSkeleton } from "@/components/ui/loading-skeletons";
import { cn, formatDate, formatMoney } from "@/lib/utils";

export function DocumentListPage({ documentType }: { documentType: DocumentType }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState("");
  const [exportingId, setExportingId] = useState<string | null>(null);
  const docs = useQuery(api.documents.listByType, {
    documentType,
    search: search || undefined,
  }) as EnrichedDocument[] | undefined;
  const settings = useQuery(api.companySettings.get) as CompanySettings | null | undefined;

  const urlSelectedId = searchParams.get("id");
  const [selectedId, setSelectedId] = useState<string | null>(urlSelectedId);

  const selectedDoc = useMemo(
    () => docs?.find((d) => d._id === selectedId) ?? null,
    [docs, selectedId],
  );

  const selectDoc = useCallback(
    (id: string) => {
      setSelectedId(id);
      const params = new URLSearchParams(searchParams.toString());
      params.set("id", id);
      router.replace(`${documentPath(documentType)}?${params.toString()}`, { scroll: false });
    },
    [documentType, router, searchParams],
  );

  useEffect(() => {
    if (docs === undefined) return;

    if (docs.length === 0) {
      if (selectedId) setSelectedId(null);
      return;
    }

    if (urlSelectedId) {
      const fromUrl = docs.some((d) => d._id === urlSelectedId);
      if (fromUrl && urlSelectedId !== selectedId) {
        setSelectedId(urlSelectedId);
      } else if (!fromUrl && selectedId) {
        setSelectedId(null);
      }
      return;
    }

    if (selectedId && !docs.some((d) => d._id === selectedId)) {
      setSelectedId(null);
    }
  }, [docs, urlSelectedId, selectedId]);

  const hasDocs = docs && docs.length > 0;

  async function handleExportPdf(doc: EnrichedDocument) {
    const counterparty = doc.client ?? doc.supplier;
    if (!settings || !counterparty || exportingId) return;

    setExportingId(doc._id);
    try {
      await exportDocumentPdf({
        documentType,
        number: doc.number,
        date: doc.date,
        dueDate: doc.dueDate,
        reference: doc.reference,
        vatRate: doc.vatRate,
        discount: doc.discount,
        deposit: doc.deposit,
        notes: doc.notes,
        lines: doc.lines.map((l) => ({
          catalogItemId: l.catalogItemId,
          reference: l.reference,
          designation: l.designation,
          unit: l.unit,
          qty: l.qty,
          unitPriceHt: l.unitPriceHt,
          sortOrder: l.sortOrder,
          isNote: l.isNote,
        })),
        isSupplier: isSupplierDocument(documentType),
        showCachet: doc.showCachet ?? false,
        counterparty: {
          name: counterparty.name,
          ice: counterparty.ice || undefined,
          representative: counterparty.representative || undefined,
          address: counterparty.address || undefined,
          city: counterparty.city || undefined,
        },
        settings,
      });
    } finally {
      setExportingId(null);
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <PageHeader
        title={DOCUMENT_LABELS[documentType]}
        description={`Consultez et créez vos ${DOCUMENT_LABELS[documentType].toLowerCase()}s.`}
        compact
        actions={
          <Button asChild>
            <Link href={documentNewPath(documentType)}>
              <Plus className="h-4 w-4" />
              Créer
            </Link>
          </Button>
        }
      />

      <div className="flex min-h-0 flex-1 gap-0 overflow-hidden rounded-xl border border-black/[0.06] bg-white">
        <section className="flex min-h-0 min-w-0 flex-1 flex-col">
          <div className="shrink-0 border-b border-black/[0.06] p-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" />
              <Input
                placeholder="Rechercher par numéro ou client…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {docs === undefined ? (
              <DocumentListSkeleton />
            ) : docs.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
                <p className="text-sm text-[#6B7280]">Aucun document pour le moment.</p>
                <Button className="mt-4" asChild>
                  <Link href={documentNewPath(documentType)}>Créer le premier</Link>
                </Button>
              </div>
            ) : (
              <Table className="rounded-none border-0">
                <TableHeader className="sticky top-0 z-[1]">
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Numéro</TableHead>
                    <TableHead className="hidden sm:table-cell">Contrepartie</TableHead>
                    <TableHead className="hidden md:table-cell">Date</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Montant</TableHead>
                    <TableHead className="w-[120px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {docs.map((doc) => {
                    const previewOpen = doc._id === selectedId;
                    return (
                      <TableRow
                        key={doc._id}
                        className={cn(previewOpen && "bg-[#FEF2F2] hover:bg-[#FEE2E2]")}
                      >
                        <TableCell>
                          <span
                            className={cn(
                              "font-medium",
                              previewOpen ? "text-[#B91C1C]" : "text-ink",
                            )}
                          >
                            {doc.number}
                          </span>
                        </TableCell>
                        <TableCell className="hidden max-w-[120px] truncate sm:table-cell">
                          {doc.counterpartyName}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">{formatDate(doc.date)}</TableCell>
                        <TableCell>
                          <Badge className={STATUS_BADGE_CLASS[doc.status]}>
                            {STATUS_LABELS[doc.status]}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {isDeliveryNote(documentType)
                            ? "—"
                            : `${formatMoney(doc.totalTtc)}`}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="inline-flex items-center justify-end gap-0.5">
                            <Button
                              variant="ghost"
                              size="icon"
                              className={cn(
                                "h-8 w-8",
                                previewOpen
                                  ? "text-[#B91C1C] hover:text-[#991B1B]"
                                  : "text-[#6B7280] hover:text-ink",
                              )}
                              title="Aperçu"
                              aria-label="Aperçu"
                              onClick={() => selectDoc(doc._id)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-[#6B7280] hover:text-ink"
                              asChild
                              title="Modifier"
                            >
                              <Link href={`/documents/${DOCUMENT_SLUGS[documentType]}/${doc._id}`}>
                                <Pencil className="h-4 w-4" />
                                <span className="sr-only">Modifier</span>
                              </Link>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-[#6B7280] hover:text-ink"
                              title="Télécharger PDF"
                              disabled={!settings || !(doc.client ?? doc.supplier) || exportingId === doc._id}
                              onClick={() => void handleExportPdf(doc)}
                            >
                              {exportingId === doc._id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <FileDown className="h-4 w-4" />
                              )}
                              <span className="sr-only">Télécharger PDF</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </div>
        </section>

        <section className="hidden min-h-0 w-[min(520px,46%)] shrink-0 border-l border-black/[0.06] bg-[#F8F9FA] xl:w-[44%] xl:min-w-[420px] lg:flex lg:flex-col">
          {selectedDoc ? (
            <DocumentDetailPanelWithSettings doc={selectedDoc} documentType={documentType} />
          ) : hasDocs ? (
            <div className="flex flex-1 items-center justify-center px-6 text-center text-sm text-[#9CA3AF]">
              Cliquez sur l&apos;icône aperçu pour prévisualiser un document
            </div>
          ) : (
            <div className="flex flex-1 items-center justify-center text-sm text-[#9CA3AF]">
              Aucun document à afficher
            </div>
          )}
        </section>
      </div>

      {selectedDoc ? (
        <div className="mt-3 rounded-xl border border-black/[0.06] bg-[#F8F9FA] lg:hidden">
          <DocumentDetailPanelWithSettings doc={selectedDoc} documentType={documentType} />
        </div>
      ) : null}
    </div>
  );
}
