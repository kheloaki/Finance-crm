import type { CSSProperties } from "react";
import { getColorMeta, type DocumentColorId } from "@/lib/document-colors";

export type DocumentTheme = {
  colorId: DocumentColorId;
  primary: string;
  primaryDark: string;
  primaryLight: string;
  primaryMuted: string;
  onPrimary: string;
  accent: string;
  surface: string;
  surfaceBorder: string;
  text: string;
  textMuted: string;
  /** RGB 0-255 for PDF / jsPDF */
  primaryRgb: [number, number, number];
  primaryDarkRgb: [number, number, number];
};

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function mix(hex: string, amount: number, toward: "#000000" | "#ffffff"): string {
  const [r, g, b] = hexToRgb(hex);
  const t = toward === "#ffffff" ? 255 : 0;
  const f = (c: number) => Math.round(c + (t - c) * amount);
  return `#${[f(r), f(g), f(b)].map((x) => x.toString(16).padStart(2, "0")).join("")}`;
}

function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function resolveDocumentTheme(colorId: DocumentColorId): DocumentTheme {
  const { hex } = getColorMeta(colorId);
  const primaryDark = mix(hex, 0.35, "#000000");
  const primaryLight = mix(hex, 0.82, "#ffffff");
  const primaryMuted = mix(hex, 0.92, "#ffffff");
  const onPrimary = luminance(hex) > 0.45 ? "#0f172a" : "#ffffff";

  return {
    colorId,
    primary: hex,
    primaryDark,
    primaryLight,
    primaryMuted,
    onPrimary,
    accent: mix(hex, 0.15, "#ffffff"),
    surface: mix(hex, 0.95, "#ffffff"),
    surfaceBorder: mix(hex, 0.75, "#ffffff"),
    text: "#0f172a",
    textMuted: "#64748b",
    primaryRgb: hexToRgb(hex),
    primaryDarkRgb: hexToRgb(primaryDark),
  };
}

export function themeGradient(theme: DocumentTheme, direction: "to-r" | "to-b" | "to-br" = "to-r") {
  const map = {
    "to-r": "to right",
    "to-b": "to bottom",
    "to-br": "to bottom right",
  };
  return `linear-gradient(${map[direction]}, ${theme.primary}, ${theme.primaryDark})`;
}

export function themeCssVars(theme: DocumentTheme): CSSProperties {
  return {
    ["--doc-primary" as string]: theme.primary,
    ["--doc-primary-dark" as string]: theme.primaryDark,
    ["--doc-primary-light" as string]: theme.primaryLight,
    ["--doc-primary-muted" as string]: theme.primaryMuted,
    ["--doc-on-primary" as string]: theme.onPrimary,
    ["--doc-accent" as string]: theme.accent,
    ["--doc-surface" as string]: theme.surface,
    ["--doc-surface-border" as string]: theme.surfaceBorder,
  };
}
