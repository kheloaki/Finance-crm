export const DEFAULT_CURRENCY = "MAD";

export type CurrencyMeta = {
  code: string;
  name: string;
};

const FALLBACK_CURRENCIES: CurrencyMeta[] = [
  { code: "MAD", name: "Moroccan Dirham" },
  { code: "EUR", name: "Euro" },
  { code: "USD", name: "US Dollar" },
  { code: "GBP", name: "British Pound" },
  { code: "CHF", name: "Swiss Franc" },
  { code: "CAD", name: "Canadian Dollar" },
  { code: "AED", name: "UAE Dirham" },
  { code: "SAR", name: "Saudi Riyal" },
  { code: "TND", name: "Tunisian Dinar" },
  { code: "DZD", name: "Algerian Dinar" },
];

function buildCurrencyList(displayLocale = "fr"): CurrencyMeta[] {
  try {
    const codes =
      typeof Intl !== "undefined" && "supportedValuesOf" in Intl
        ? (Intl as typeof Intl & { supportedValuesOf(key: string): string[] }).supportedValuesOf(
            "currency",
          )
        : FALLBACK_CURRENCIES.map((c) => c.code);
    const names = new Intl.DisplayNames([displayLocale, "en"], { type: "currency" });
    return codes
      .map((code) => ({
        code,
        name: names.of(code) ?? code,
      }))
      .sort((a, b) => a.code.localeCompare(b.code));
  } catch {
    return FALLBACK_CURRENCIES;
  }
}

let cached: CurrencyMeta[] | null = null;

export function listCurrencies(displayLocale = "fr"): CurrencyMeta[] {
  if (!cached) cached = buildCurrencyList(displayLocale);
  return cached;
}

const CODE_SET = new Set(listCurrencies().map((c) => c.code));

export function normalizeCurrency(value?: string | null): string {
  const code = value?.trim().toUpperCase();
  if (code && CODE_SET.has(code)) return code;
  return DEFAULT_CURRENCY;
}

export function getCurrencyMeta(code: string): CurrencyMeta {
  const normalized = normalizeCurrency(code);
  return listCurrencies().find((c) => c.code === normalized) ?? { code: normalized, name: normalized };
}
