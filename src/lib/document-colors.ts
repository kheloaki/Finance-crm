export const DOCUMENT_COLOR_IDS = [
  "navy",
  "blue",
  "sky",
  "teal",
  "emerald",
  "amber",
  "orange",
  "rose",
  "violet",
  "slate",
  "charcoal",
  "crimson",
] as const;

export type DocumentColorId = (typeof DOCUMENT_COLOR_IDS)[number];

export const DEFAULT_DOCUMENT_COLOR: DocumentColorId = "navy";

export function normalizeDocumentColor(value: string | undefined | null): DocumentColorId {
  if (value && DOCUMENT_COLOR_IDS.includes(value as DocumentColorId)) {
    return value as DocumentColorId;
  }
  return DEFAULT_DOCUMENT_COLOR;
}

export type DocumentColorMeta = {
  id: DocumentColorId;
  label: string;
  hex: string;
};

export const DOCUMENT_COLORS: DocumentColorMeta[] = [
  { id: "navy", label: "Marine", hex: "#0f172a" },
  { id: "blue", label: "Bleu", hex: "#2563eb" },
  { id: "sky", label: "Ciel", hex: "#0284c7" },
  { id: "teal", label: "Teal", hex: "#0f766e" },
  { id: "emerald", label: "Émeraude", hex: "#059669" },
  { id: "amber", label: "Ambre", hex: "#d97706" },
  { id: "orange", label: "Orange", hex: "#ea580c" },
  { id: "rose", label: "Rose", hex: "#e11d48" },
  { id: "violet", label: "Violet", hex: "#7c3aed" },
  { id: "slate", label: "Ardoise", hex: "#475569" },
  { id: "charcoal", label: "Anthracite", hex: "#171717" },
  { id: "crimson", label: "Cramoisi", hex: "#be123c" },
];

export function getColorMeta(id: DocumentColorId): DocumentColorMeta {
  return DOCUMENT_COLORS.find((c) => c.id === id) ?? DOCUMENT_COLORS[0];
}
