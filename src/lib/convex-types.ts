export type DashboardStats = {
  documentsThisMonth: number;
  draftCount: number;
  totalFactureTtc: number;
  activeClients: number;
  byType: Record<string, number>;
  last6Months: { month: string; count: number }[];
};

export type EnrichedDocument = {
  _id: string;
  documentType: import("@/lib/documents").DocumentType;
  number: string;
  date: string;
  status: "draft" | "issued" | "cancelled";
  totalTtc: number;
  counterpartyName: string;
  projectId?: string;
  projectName?: string;
  reference: string;
  dueDate?: string;
  vatRate: number;
  discount: number;
  deposit: number;
  notes: string;
  showCachet?: boolean;
  amountDisplay?: import("@/lib/documents").AmountDisplay;
  clientId?: string;
  supplierId?: string;
  totalHt: number;
  lines: Array<{
    catalogItemId?: string;
    reference: string;
    designation: string;
    unit: string;
    qty: number;
    unitPriceHt: number;
    sortOrder: number;
    isNote?: boolean;
  }>;
  client?: {
    name: string;
    ice: string;
    address: string;
    city: string;
    representative?: string;
  } | null;
  supplier?: {
    name: string;
    ice: string;
    address: string;
    city: string;
    representative?: string;
  } | null;
};

export type CompanySettings = {
  sellerName: string;
  sellerActivity: string;
  sellerAddress: string;
  sellerPhone?: string;
  sellerWebsite?: string;
  sellerEmail?: string;
  sellerIce?: string;
  sellerIf?: string;
  sellerRc?: string;
  sellerCnss?: string;
  sellerLegal: string;
  sellerContact: string;
  logoUrl?: string;
  logoStorageId?: string;
  cachetUrl?: string;
  cachetStorageId?: string;
  documentTemplate?: import("@/lib/document-templates").DocumentTemplateId;
  documentColor?: import("@/lib/document-colors").DocumentColorId;
};

export type CatalogItem = {
  _id: string;
  reference: string;
  designation: string;
  unit: string;
  unitPriceHt: number;
};

export type Client = {
  _id: string;
  name: string;
  ice?: string;
  address?: string;
  city?: string;
  representative?: string;
};

export type Supplier = {
  _id: string;
  name: string;
  ice?: string;
  address?: string;
  city?: string;
  representative?: string;
};
