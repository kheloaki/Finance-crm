"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  DOCUMENT_BADGE_CLASS,
  DOCUMENT_LABELS,
  documentPath,
  type DocumentType,
  STATUS_BADGE_CLASS,
  STATUS_LABELS,
} from "@/lib/documents";
import { RecentDocumentsTableSkeleton } from "@/components/ui/loading-skeletons";
import { formatDate, formatMoney } from "@/lib/utils";
import type { EnrichedDocument } from "@/lib/convex-types";

export function RecentDocumentsTable() {
  const docs = useQuery(api.documents.recent, { limit: 8 }) as EnrichedDocument[] | undefined;

  if (docs === undefined) {
    return <RecentDocumentsTableSkeleton />;
  }

  if (docs.length === 0) {
    return <p className="text-sm text-gray-500">Aucun document pour le moment.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#9CA3AF]">
            Type
          </TableHead>
          <TableHead className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#9CA3AF]">
            Numéro
          </TableHead>
          <TableHead className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#9CA3AF]">
            Contrepartie
          </TableHead>
          <TableHead className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#9CA3AF]">
            Date
          </TableHead>
          <TableHead className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#9CA3AF]">
            Statut
          </TableHead>
          <TableHead className="text-right text-[10px] font-semibold uppercase tracking-[0.08em] text-[#9CA3AF]">
            Montant TTC
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {docs.map((doc) => (
          <TableRow key={doc._id} className="hover:bg-[#FAFBFC]/80">
            <TableCell>
              <Badge className={DOCUMENT_BADGE_CLASS[doc.documentType as DocumentType]}>
                {DOCUMENT_LABELS[doc.documentType as DocumentType]}
              </Badge>
            </TableCell>
            <TableCell>
              <Link
                href={`${documentPath(doc.documentType as DocumentType)}/${doc._id}`}
                className="text-[13px] font-medium text-blue-600 hover:text-blue-700 hover:underline"
              >
                {doc.number}
              </Link>
            </TableCell>
            <TableCell>{doc.counterpartyName}</TableCell>
            <TableCell>{formatDate(doc.date)}</TableCell>
            <TableCell>
              <Badge className={STATUS_BADGE_CLASS[doc.status]}>
                {STATUS_LABELS[doc.status]}
              </Badge>
            </TableCell>
            <TableCell className="text-right font-medium">
              {doc.documentType === "bon_livraison" ? "—" : `${formatMoney(doc.totalTtc)} MAD`}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
