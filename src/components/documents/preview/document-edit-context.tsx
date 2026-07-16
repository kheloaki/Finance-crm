"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { CatalogItem, Client, CompanySettings, Supplier } from "@/lib/convex-types";
import type { DocumentType, LineItem } from "@/lib/documents";

export type DocumentEditState = {
  documentType: DocumentType;
  readOnly: boolean;
  date: string;
  dueDate: string;
  reference: string;
  onDateChange: (v: string) => void;
  onDueDateChange: (v: string) => void;
  onReferenceChange: (v: string) => void;
  isSupplier: boolean;
  clientId: string;
  supplierId: string;
  onClientChange: (id: string) => void;
  onSupplierChange: (id: string) => void;
  clients: Client[] | undefined;
  suppliers: Supplier[] | undefined;
  projectId: string;
  onProjectChange: (id: string) => void;
  showProject: boolean;
  lines: LineItem[];
  onLinesChange: (lines: LineItem[]) => void;
  catalog: CatalogItem[];
  vatRate: number;
  onVatRateChange: (rate: number) => void;
  discount: number;
  onDiscountChange: (v: number) => void;
  deposit: number;
  onDepositChange: (v: number) => void;
  notes: string;
  onNotesChange: (v: string) => void;
  amountDisplay: import("@/lib/documents").AmountDisplay;
  settings?: CompanySettings | null;
  autoOpenCatalog?: boolean;
};

const DocumentEditContext = createContext<DocumentEditState | null>(null);

export function DocumentEditProvider({
  value,
  children,
}: {
  value: DocumentEditState;
  children: ReactNode;
}) {
  return <DocumentEditContext.Provider value={value}>{children}</DocumentEditContext.Provider>;
}

export function useDocumentEdit() {
  return useContext(DocumentEditContext);
}
