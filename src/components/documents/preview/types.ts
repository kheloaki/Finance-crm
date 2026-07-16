import type { DocumentType, LineItem } from "@/lib/documents";
import type { CompanySettings } from "@/lib/convex-types";
import type { DocumentTemplateId } from "@/lib/document-templates";
import type { DocumentTheme } from "@/lib/document-theme";

export type PreviewContext = {
  templateId: DocumentTemplateId;
  documentType: DocumentType;
  label: string;
  deliveryNote: boolean;
  number: string;
  date: string;
  dateFormatted: string;
  dueDate?: string;
  dueDateFormatted?: string;
  reference?: string;
  counterpartyLabel: string;
  counterpartyName: string;
  counterpartyIce?: string;
  counterpartyRepresentative?: string;
  addrLine: string;
  lines: LineItem[];
  vatRate: number;
  discount: number;
  deposit: number;
  depositLabel: string;
  notes?: string;
  sellerName: string;
  sellerActivity: string;
  sellerAddress: string;
  sellerPhone: string;
  sellerWebsite: string;
  sellerEmail: string;
  sellerIce: string;
  sellerIf: string;
  sellerRc: string;
  sellerCnss: string;
  sellerLegal: string;
  sellerContact: string;
  logoUrl?: string;
  cachetUrl?: string;
  theme: DocumentTheme;
  totalHt: number;
  netHt: number;
  vatAmount: number;
  totalTtc: number;
  netToPay: number;
  /** When false, hide TTC on lines and totals (HT + TVA only). */
  showTtc: boolean;
  /** Line total for display (TTC when showTtc, else HT). */
  lineAmount: (line: LineItem) => number;
  /** Highlighted due / net amount for display. */
  dueAmount: number;
  dueLabel: string;
  settings?: CompanySettings | null;
  previewMode?: boolean;
  money: (n: number) => string;
  /** @deprecated Prefer lineAmount — same as lineAmount when showTtc. */
  lineTtc: (line: LineItem) => number;
};

export type LayoutProps = { ctx: PreviewContext };
