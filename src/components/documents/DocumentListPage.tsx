"use client";

import { useQuery } from "convex/react";
import Link from "next/link";
import { useState } from "react";
import { FileDown, Loader2, Pencil, Plus, Search } from "lucide-react";
import { api } from "@convex/_generated/api";
import { PageHeader } from "@/components/layout/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  DOCUMENT_LABELS,
  DOCUMENT_SLUGS,
  documentNewPath,
  isSupplierDocument,
  STATUS_BADGE_CLASS,
  STATUS_LABELS,
  type DocumentType,
} from "@/lib/documents";
import type { CompanySettings, EnrichedDocument } from "@/lib/convex-types";
import { isDeliveryNote } from "@/lib/documents";
import { exportDocumentPdf } from "@/lib/pdf/document-pdf";
import { DocumentListSkeleton } from "@/components/ui/loading-skeletons";
import { formatDate, formatMoney } from "@/lib/utils";

export function DocumentListPage({ documentType }: { documentType: DocumentType }) {
  const [search, setSearch] = useState("");
  const [exportingId, setExportingId] = useState<string | null>(null);
  const docs = useQuery(api.documents.listByType, {
    documentType,
    search: search || undefined,
  }) as EnrichedDocument[] | undefined;
  const settings = useQuery(api.companySettings.get) as CompanySettings | null | undefined;

  async function handleExportPdf(doc: EnrichedDocument) {
    const saved = doc.client ?? doc.supplier;
    const guestName = doc.guestClientName?.trim() || doc.guestSupplierName?.trim();
    if (!settings || (!saved && !guestName) || exportingId) return;

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
        amountDisplay: doc.amountDisplay === "ht" ? "ht" : "ht_ttc",
        counterparty: {
          name: saved?.name || guestName || doc.counterpartyName,
          ice: saved?.ice || doc.guestIce || undefined,
          representative: saved?.representative || undefined,
          address: saved?.address || doc.guestAddress || undefined,
          city: saved?.city || doc.guestCity || undefined,
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

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-black/[0.06] bg-white">
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
                  <TableHead className="w-[100px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {docs.map((doc) => (
                  <TableRow key={doc._id}>
                    <TableCell>
                      <span className="font-medium text-ink">{doc.number}</span>
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
                      {isDeliveryNote(documentType) ? "—" : `${formatMoney(doc.totalTtc)}`}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="inline-flex items-center justify-end gap-0.5">
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
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </div>
  );
}
