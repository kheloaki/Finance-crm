import type { LineItem } from "@/lib/documents";

export type DocumentFormSnapshot = {
  date: string;
  dueDate: string;
  reference: string;
  clientId: string;
  supplierId: string;
  vatRate: number;
  discount: number;
  deposit: number;
  notes: string;
  showCachet: boolean;
  amountDisplay: import("@/lib/documents").AmountDisplay;
  projectId: string;
  lines: LineItem[];
};

export function snapshotDocumentForm(state: DocumentFormSnapshot): string {
  return JSON.stringify({
    ...state,
    lines: state.lines.map((l) => ({
      catalogItemId: l.catalogItemId ?? "",
      reference: l.reference,
      designation: l.designation,
      unit: l.unit,
      qty: l.qty,
      unitPriceHt: l.unitPriceHt,
      sortOrder: l.sortOrder,
      isNote: !!l.isNote,
    })),
  });
}

export function isDocumentFormDirty(
  current: DocumentFormSnapshot,
  savedJson: string | null,
): boolean {
  if (!savedJson) {
    const hasContent =
      !!current.clientId ||
      !!current.supplierId ||
      current.notes.trim() !== "" ||
      current.discount > 0 ||
      current.deposit > 0 ||
      current.lines.some((l) => l.designation.trim() !== "");
    return hasContent;
  }
  return snapshotDocumentForm(current) !== savedJson;
}
