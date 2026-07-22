"use client";

import { useMemo } from "react";
import { SearchableSelect } from "@/components/ui/searchable-select";
import {
  DEFAULT_CURRENCY,
  listCurrencies,
  normalizeCurrency,
} from "@/lib/currencies";
import {
  DEFAULT_DOCUMENT_LANGUAGE,
  DOCUMENT_LANGUAGES,
  normalizeDocumentLanguage,
} from "@/lib/document-i18n";
import { cn } from "@/lib/utils";

const triggerClass =
  "flex h-8 min-w-[5.5rem] max-w-[9.5rem] items-center justify-between gap-1 rounded-md border border-slate-200 bg-white px-2 text-xs font-medium text-ink outline-none hover:border-slate-300";

type Props = {
  currency?: string | null;
  language?: string | null;
  disabled?: boolean;
  className?: string;
  onCurrencyChange: (currency: string) => void;
  onLanguageChange: (language: string) => void;
};

export function DocumentLocaleControls({
  currency,
  language,
  disabled,
  className,
  onCurrencyChange,
  onLanguageChange,
}: Props) {
  const currencyValue = normalizeCurrency(currency ?? DEFAULT_CURRENCY);
  const languageValue = normalizeDocumentLanguage(language ?? DEFAULT_DOCUMENT_LANGUAGE);

  const currencyOptions = useMemo(
    () =>
      listCurrencies().map((c) => ({
        value: c.code,
        label: c.code,
        hint: c.name,
      })),
    [],
  );

  const languageOptions = useMemo(
    () =>
      DOCUMENT_LANGUAGES.map((l) => ({
        value: l.id,
        label: l.id.toUpperCase(),
        hint: l.label,
      })),
    [],
  );

  return (
    <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
      <SearchableSelect
        options={languageOptions}
        value={languageValue}
        disabled={disabled}
        placeholder="Langue"
        triggerClassName={triggerClass}
        onChange={(value) => onLanguageChange(normalizeDocumentLanguage(value))}
      />
      <SearchableSelect
        options={currencyOptions}
        value={currencyValue}
        disabled={disabled}
        placeholder="Devise"
        triggerClassName={triggerClass}
        onChange={(value) => onCurrencyChange(normalizeCurrency(value))}
      />
    </div>
  );
}
