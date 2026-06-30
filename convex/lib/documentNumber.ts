export type DocumentType =
  | "devis"
  | "bon_commande"
  | "bon_livraison"
  | "facture"
  | "bon_retour";

export function yearFromDate(dateStr?: string): number {
  if (!dateStr?.trim()) return new Date().getFullYear();
  const y = parseInt(dateStr.slice(0, 4), 10);
  return Number.isNaN(y) ? new Date().getFullYear() : y;
}

export function formatDocumentNumber(seq: number, year: number, padLen = 3): string {
  return `${String(seq).padStart(padLen, "0")}/${year}`;
}

export function computeNextDocumentNumber(
  existingNumbers: string[],
  year: number,
): string {
  let padLen = 3;
  for (const num of existingNumbers) {
    const m = String(num).match(/^(\d+)/);
    if (m) padLen = Math.max(padLen, m[1].length);
  }
  const nextSeq = existingNumbers.length + 1;
  return formatDocumentNumber(nextSeq, year, padLen);
}
