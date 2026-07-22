export const DEFAULT_VAT_RATE = 20;

export function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function htToTtc(ht: number, vatRate: number): number {
  if (vatRate <= 0) return roundMoney(ht);
  return roundMoney(ht * (1 + vatRate / 100));
}

export function ttcToHt(ttc: number, vatRate: number): number {
  if (vatRate <= 0) return roundMoney(ttc);
  return roundMoney(ttc / (1 + vatRate / 100));
}

export function lineTotalTtc(qty: number, unitPriceHt: number, vatRate: number): number {
  return roundMoney(qty * htToTtc(unitPriceHt, vatRate));
}

export function linesTotalTtc(
  lines: { qty: number; unitPriceHt: number }[],
  vatRate: number,
): number {
  return roundMoney(
    lines.reduce((sum, line) => sum + lineTotalTtc(line.qty, line.unitPriceHt, vatRate), 0),
  );
}

export type DocumentLineForTotals = {
  qty: number;
  unitPriceHt: number;
  isNote?: boolean;
};

export function computeDocumentTotals(
  lines: DocumentLineForTotals[],
  vatRate: number,
  discount = 0,
  deposit = 0,
) {
  const billable = lines.filter((l) => !l.isNote);
  const totalHt = roundMoney(billable.reduce((acc, l) => acc + l.qty * l.unitPriceHt, 0));
  const grossTtc = linesTotalTtc(
    billable.map((l) => ({ qty: l.qty, unitPriceHt: l.unitPriceHt })),
    vatRate,
  );
  const netHt = roundMoney(Math.max(0, totalHt - discount));
  const discountTtc = discount > 0 ? htToTtc(discount, vatRate) : 0;
  const totalTtc = roundMoney(Math.max(0, grossTtc - discountTtc));
  const vatAmount = roundMoney(Math.max(0, totalTtc - netHt));
  const netToPay = roundMoney(Math.max(0, totalTtc - deposit));
  return { totalHt, netHt, grossTtc, vatAmount, totalTtc, netToPay };
}

export function formatMoney(value: number, locale = "fr-MA"): string {
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}
