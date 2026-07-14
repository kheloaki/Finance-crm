import type { CompanySettings } from "@/lib/convex-types";
import type { DocumentType, LineItem } from "@/lib/documents";
import { resolvePreviewCompanySettings } from "@/lib/company-settings-display";

const BASE_LINES: LineItem[] = [
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

const DELIVERY_LINES: LineItem[] = [
  {
    reference: "MAT-10",
    designation: "Ciment Portland 42.5",
    unit: "t",
    qty: 12,
    unitPriceHt: 850,
    sortOrder: 0,
  },
  {
    reference: "MAT-11",
    designation: "Sable de dune",
    unit: "m³",
    qty: 24,
    unitPriceHt: 120,
    sortOrder: 1,
  },
];

export type DocumentPreviewSample = {
  documentType: DocumentType;
  number: string;
  date: string;
  dueDate?: string;
  reference?: string;
  counterpartyName: string;
  counterpartyIce?: string;
  counterpartyRepresentative?: string;
  counterpartyAddress?: string;
  counterpartyCity?: string;
  isSupplier: boolean;
  lines: LineItem[];
  vatRate: number;
  discount: number;
  deposit: number;
  notes?: string;
};

export function getDocumentPreviewSample(
  documentType: DocumentType,
  settings?: CompanySettings | null,
): DocumentPreviewSample {
  const isSupplier = documentType === "bon_commande";
  const isDelivery = documentType === "bon_livraison";

  const common = {
    date: new Date().toISOString().slice(0, 10),
    vatRate: 20,
    discount: 0,
    deposit: 0,
    notes: isDelivery
      ? "Marchandise livrée en bon état."
      : "Validité 30 jours. Paiement à réception.",
  };

  if (isSupplier) {
    return {
      ...common,
      documentType,
      number: "BC-001/2026",
      reference: "CMD-4582",
      counterpartyName: settings?.sellerName ? "Fournisseur Atlas SARL" : "Fournisseur Atlas SARL",
      counterpartyIce: "002345678000012",
      counterpartyRepresentative: "M. Karim Bennani",
      counterpartyAddress: "Zone industrielle, Lot 12",
      counterpartyCity: "Casablanca",
      isSupplier: true,
      lines: BASE_LINES,
    };
  }

  if (isDelivery) {
    return {
      ...common,
      documentType,
      number: "BL-008/2026",
      reference: "CMD-4582",
      counterpartyName: "Fondation Azura",
      counterpartyIce: "003509567000021",
      counterpartyRepresentative: "Mme Nada TAZI",
      counterpartyAddress: "Hay Riad, Rabat",
      counterpartyCity: "Rabat",
      isSupplier: false,
      lines: DELIVERY_LINES,
      vatRate: 20,
      notes: "Livraison partielle — 2e tournée prévue.",
    };
  }

  if (documentType === "bon_retour") {
    return {
      ...common,
      documentType,
      number: "BR-002/2026",
      reference: "BL-008/2026",
      counterpartyName: "Fondation Azura",
      counterpartyRepresentative: "Mme Nada TAZI",
      counterpartyCity: "Rabat",
      isSupplier: false,
      lines: [
        {
          reference: "MAT-10",
          designation: "Ciment — lot non conforme",
          unit: "t",
          qty: 2,
          unitPriceHt: 850,
          sortOrder: 0,
        },
      ],
    };
  }

  if (documentType === "facture") {
    return {
      ...common,
      documentType,
      number: "FA-012/2026",
      dueDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
      reference: "DEV-015/2026",
      counterpartyName: "Fondation Azura",
      counterpartyIce: "003509567000021",
      counterpartyRepresentative: "Mme Nada TAZI",
      counterpartyAddress: "Hay Riad, Rabat",
      counterpartyCity: "Rabat",
      isSupplier: false,
      lines: BASE_LINES,
      deposit: 500,
    };
  }

  return {
    ...common,
    documentType,
    number: "DEV-015/2026",
    dueDate: new Date(Date.now() + 15 * 86400000).toISOString().slice(0, 10),
    counterpartyName: "Fondation Azura",
    counterpartyIce: "003509567000021",
    counterpartyRepresentative: "Mme Nada TAZI",
    counterpartyAddress: "Hay Riad, Rabat",
    counterpartyCity: "Rabat",
    isSupplier: false,
    lines: BASE_LINES,
  };
}

export function defaultPreviewSettings(settings?: CompanySettings | null): CompanySettings {
  return resolvePreviewCompanySettings(settings);
}
