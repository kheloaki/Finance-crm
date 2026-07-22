/** Payment terms derived from invoice date → due date (Conditions). */

export const PAYMENT_TERM_OPTIONS = [
  { days: 0, label: "Comptant" },
  { days: 15, label: "Net 15" },
  { days: 30, label: "Net 30" },
  { days: 45, label: "Net 45" },
  { days: 60, label: "Net 60" },
  { days: 90, label: "Net 90" },
] as const;

export function daysBetweenDates(date: string, dueDate: string): number | null {
  const start = new Date(`${date}T12:00:00`);
  const end = new Date(`${dueDate}T12:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;
  return Math.round((end.getTime() - start.getTime()) / 86_400_000);
}

/** Human label for Conditions — defaults to Comptant when no échéance. */
export function paymentTermsLabel(date?: string, dueDate?: string): string {
  if (!date || !dueDate) return "Comptant";
  const days = daysBetweenDates(date, dueDate);
  if (days == null) return "Comptant";
  if (days <= 0) return "Comptant";
  return `Net ${days}`;
}

/** Match a preset select value, or "" when custom Net N. */
export function paymentTermsSelectValue(date?: string, dueDate?: string): string {
  if (!date || !dueDate) return "0";
  const days = daysBetweenDates(date, dueDate);
  if (days == null || days <= 0) return "0";
  const preset = PAYMENT_TERM_OPTIONS.find((o) => o.days === days);
  return preset ? String(preset.days) : "";
}

export function dueDateFromPaymentTerms(date: string, days: number): string {
  const start = new Date(`${date}T12:00:00`);
  if (Number.isNaN(start.getTime())) return date;
  start.setDate(start.getDate() + Math.max(0, days));
  const y = start.getFullYear();
  const m = String(start.getMonth() + 1).padStart(2, "0");
  const d = String(start.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Document Réf. falls back to the document number/code when empty. */
export function displayDocumentRef(reference: string | undefined, number: string): string {
  const ref = reference?.trim();
  return ref || number || "—";
}
