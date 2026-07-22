"use client";

import type { ReactNode } from "react";
import { buildPreviewContext, resolveTemplateId } from "@/components/documents/preview/build-context";
import { DocumentEditProvider } from "@/components/documents/preview/document-edit-context";
import { LAYOUT_REGISTRY } from "@/components/documents/preview/layouts";
import { Badge } from "@/components/ui/badge";
import type { CatalogItem, Client, CompanySettings, Supplier } from "@/lib/convex-types";
import {
  DOCUMENT_LABELS,
  STATUS_BADGE_CLASS,
  STATUS_LABELS,
  type AmountDisplay,
  type DocumentType,
  type LineItem,
} from "@/lib/documents";

type DocStatus = "draft" | "saved" | "issued" | "cancelled";

type Props = {
  documentType: DocumentType;
  number: string;
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
  guestClientName: string;
  guestSupplierName: string;
  onGuestClientNameChange: (name: string) => void;
  onGuestSupplierNameChange: (name: string) => void;
  guestIce: string;
  guestAddress: string;
  guestCity: string;
  onGuestIceChange: (v: string) => void;
  onGuestAddressChange: (v: string) => void;
  onGuestCityChange: (v: string) => void;
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
  settings?: CompanySettings | null;
  showCachet: boolean;
  onShowCachetChange: (show: boolean) => void;
  amountDisplay: AmountDisplay;
  readOnly: boolean;
  isNew: boolean;
  status?: DocStatus;
  totals: {
    totalHt: number;
    vatAmount: number;
    totalTtc: number;
    netToPay: number;
  };
  autoOpenCatalog?: boolean;
  toolbar: ReactNode;
  error?: string;
  footer?: ReactNode;
  onOpenBranding?: (focus?: "logo" | "cachet" | "design" | "seller" | "footer" | "locale") => void;
  /** Compact language + currency selectors in the top bar */
  localeControls?: ReactNode;
};

export function DocumentInlineEditor(props: Props) {
  const {
    documentType,
    number,
    date,
    dueDate,
    reference,
    onDateChange,
    onDueDateChange,
    onReferenceChange,
    isSupplier,
    clientId,
    supplierId,
    onClientChange,
    onSupplierChange,
    guestClientName,
    guestSupplierName,
    onGuestClientNameChange,
    onGuestSupplierNameChange,
    guestIce,
    guestAddress,
    guestCity,
    onGuestIceChange,
    onGuestAddressChange,
    onGuestCityChange,
    clients,
    suppliers,
    projectId,
    onProjectChange,
    showProject,
    lines,
    onLinesChange,
    catalog,
    vatRate,
    onVatRateChange,
    discount,
    onDiscountChange,
    deposit,
    onDepositChange,
    notes,
    onNotesChange,
    settings,
    showCachet,
    onShowCachetChange,
    amountDisplay,
    readOnly,
    isNew,
    status,
    autoOpenCatalog,
    toolbar,
    error,
    footer,
    onOpenBranding,
    localeControls,
  } = props;

  const docLabel = DOCUMENT_LABELS[documentType];
  const selectedClient = clients?.find((c) => c._id === clientId);
  const selectedSupplier = suppliers?.find((s) => s._id === supplierId);
  const counterpartyName = isSupplier
    ? (selectedSupplier?.name ?? guestSupplierName)
    : (selectedClient?.name ?? guestClientName);
  const usingGuest =
    isSupplier ? !selectedSupplier && !!guestSupplierName.trim() : !selectedClient && !!guestClientName.trim();
  const counterpartyIce = usingGuest
    ? guestIce || undefined
    : isSupplier
      ? selectedSupplier?.ice
      : selectedClient?.ice;
  const counterpartyRep = isSupplier
    ? selectedSupplier?.representative
    : selectedClient?.representative;
  const counterpartyAddress = usingGuest
    ? guestAddress || undefined
    : isSupplier
      ? selectedSupplier?.address
      : selectedClient?.address;
  const counterpartyCity = usingGuest
    ? guestCity || undefined
    : isSupplier
      ? selectedSupplier?.city
      : selectedClient?.city;

  const templateId = resolveTemplateId(undefined, settings);
  const Layout = LAYOUT_REGISTRY[templateId];

  const ctx = buildPreviewContext({
    documentType,
    number,
    date,
    dueDate,
    reference,
    counterpartyName,
    counterpartyIce,
    counterpartyRepresentative: counterpartyRep,
    counterpartyAddress,
    counterpartyCity,
    isSupplier,
    lines,
    vatRate,
    discount,
    deposit,
    notes,
    settings,
    templateId,
    showCachet,
    amountDisplay,
  });

  const editState = {
    documentType,
    readOnly,
    date,
    dueDate,
    reference,
    onDateChange,
    onDueDateChange,
    onReferenceChange,
    isSupplier,
    clientId,
    supplierId,
    guestClientName,
    guestSupplierName,
    guestIce,
    guestAddress,
    guestCity,
    onGuestIceChange,
    onGuestAddressChange,
    onGuestCityChange,
    onClientChange,
    onSupplierChange,
    onCounterpartyChange: (next: { id: string; guestName: string }) => {
      if (isSupplier) {
        onSupplierChange(next.id);
        onGuestSupplierNameChange(next.guestName);
      } else {
        onClientChange(next.id);
        onGuestClientNameChange(next.guestName);
      }
      if (next.id) {
        onGuestIceChange("");
        onGuestAddressChange("");
        onGuestCityChange("");
      }
    },
    clients,
    suppliers,
    projectId,
    onProjectChange,
    showProject,
    lines,
    onLinesChange,
    catalog,
    vatRate,
    onVatRateChange,
    discount,
    onDiscountChange,
    deposit,
    onDepositChange,
    notes,
    onNotesChange,
    amountDisplay,
    settings,
    autoOpenCatalog,
    showCachet,
    onShowCachetChange,
    onOpenBranding,
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-white">
      <div className="shrink-0 border-b border-black/[0.08] px-3 py-2.5 sm:px-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <h1 className="truncate text-base font-semibold text-ink sm:text-lg">
              {isNew ? `Nouveau ${docLabel.toLowerCase()}` : `${docLabel} ${number}`}
            </h1>
            {status ? (
              <Badge className={STATUS_BADGE_CLASS[status]}>{STATUS_LABELS[status]}</Badge>
            ) : isNew ? (
              <Badge className={STATUS_BADGE_CLASS.draft}>{STATUS_LABELS.draft}</Badge>
            ) : null}
            {localeControls}
          </div>
          <div className="flex flex-wrap items-center gap-2">{toolbar}</div>
        </div>
      </div>

      {error ? (
        <p className="mx-3 mt-2 border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 sm:mx-4">
          {error}
        </p>
      ) : null}

      <div className="min-h-0 flex-1 overflow-y-auto bg-white">
        <DocumentEditProvider value={editState}>
          <Layout ctx={ctx} />
        </DocumentEditProvider>
      </div>

      {footer}
    </div>
  );
}
