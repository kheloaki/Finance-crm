import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatMoney as formatMoneyBase } from "@/lib/money";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatMoney(value: number, locale = "fr-MA"): string {
  return formatMoneyBase(value, locale);
}

export function formatDate(value: string, locale = "fr-FR"): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString(locale);
}

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}
