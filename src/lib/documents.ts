export type DocumentType =
  | "devis"
  | "bon_commande"
  | "bon_livraison"
  | "facture"
  | "bon_retour";

export const DOCUMENT_TYPES: DocumentType[] = [
  "devis",
  "bon_commande",
  "bon_livraison",
  "facture",
  "bon_retour",
];

export const DOCUMENT_LABELS: Record<DocumentType, string> = {
  devis: "Devis",
  bon_commande: "Bon de commande",
  bon_livraison: "Bon de livraison",
  facture: "Facture",
  bon_retour: "Bon de retour",
};

export const DOCUMENT_SLUGS: Record<DocumentType, string> = {
  devis: "devis",
  bon_commande: "bon-commande",
  bon_livraison: "bon-livraison",
  facture: "facture",
  bon_retour: "bon-retour",
};

export const SLUG_TO_TYPE: Record<string, DocumentType> = Object.fromEntries(
  Object.entries(DOCUMENT_SLUGS).map(([type, slug]) => [slug, type as DocumentType]),
) as Record<string, DocumentType>;

export const DOCUMENT_BADGE_CLASS: Record<DocumentType, string> = {
  devis: "bg-amber-50 text-amber-800 border-amber-200",
  bon_commande: "bg-blue-50 text-blue-800 border-blue-200",
  bon_livraison: "bg-sky-50 text-sky-900 border-sky-200",
  facture: "bg-emerald-50 text-emerald-800 border-emerald-200",
  bon_retour: "bg-rose-50 text-rose-800 border-rose-200",
};

export const STATUS_LABELS = {
  draft: "Brouillon",
  issued: "Émis",
  cancelled: "Annulé",
} as const;

export const STATUS_BADGE_CLASS = {
  draft: "bg-amber-50 text-amber-700 border-amber-200",
  issued: "bg-emerald-50 text-emerald-700 border-emerald-200",
  cancelled: "bg-red-50 text-red-700 border-red-200",
} as const;

export function isSupplierDocument(type: DocumentType) {
  return type === "bon_commande";
}

export function isDeliveryNote(type: DocumentType) {
  return type === "bon_livraison";
}

export function documentPath(type: DocumentType) {
  return `/documents/${DOCUMENT_SLUGS[type]}`;
}

export function documentNewPath(type: DocumentType) {
  return `/documents/${DOCUMENT_SLUGS[type]}/new`;
}

export function documentNewPathWithProject(type: DocumentType, projectId?: string) {
  const base = documentNewPath(type);
  if (!projectId) return base;
  return `${base}?project=${projectId}`;
}

export const PRODUCT_UNITS = ["u", "m", "m²", "ml", "l", "kg", "t", "h", "j", "forfait"] as const;

export type LineItem = {
  catalogItemId?: string;
  reference: string;
  designation: string;
  unit: string;
  qty: number;
  unitPriceHt: number;
  sortOrder: number;
  isNote?: boolean;
};
