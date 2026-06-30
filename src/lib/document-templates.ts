import type { DocumentColorId } from "@/lib/document-colors";

export const DOCUMENT_TEMPLATE_IDS = [
  "classic",
  "modern",
  "minimal",
  "executive",
  "corporate",
  "fresh",
  "warm",
  "ocean",
  "slate",
  "royal",
  "geometric",
  "stripe",
  "gradient",
  "interim",
  "bluepro",
  "studio",
] as const;

export type DocumentTemplateId = (typeof DOCUMENT_TEMPLATE_IDS)[number];

export const DEFAULT_DOCUMENT_TEMPLATE: DocumentTemplateId = "classic";

export function normalizeDocumentTemplate(
  value: string | undefined | null,
): DocumentTemplateId {
  if (value && DOCUMENT_TEMPLATE_IDS.includes(value as DocumentTemplateId)) {
    return value as DocumentTemplateId;
  }
  return DEFAULT_DOCUMENT_TEMPLATE;
}

/** Identifie la mise en page structurelle (aperçu + PDF) */
export type TemplateLayoutKind = DocumentTemplateId;

export type DocumentTemplateMeta = {
  id: DocumentTemplateId;
  label: string;
  description: string;
  tags: string[];
  layoutKind: TemplateLayoutKind;
  defaultColor: DocumentColorId;
};

export const DOCUMENT_TEMPLATES: DocumentTemplateMeta[] = [
  {
    id: "classic",
    label: "Classique",
    description: "En-tête centré, client encadré à droite, tableau comptable et totaux en grille.",
    tags: ["Pro", "Traditionnel"],
    layoutKind: "classic",
    defaultColor: "amber",
  },
  {
    id: "modern",
    label: "Moderne",
    description: "Bandeau pleine largeur, fiche client flottante, lignes en cartes et bannière totaux.",
    tags: ["Tech", "Startup"],
    layoutKind: "modern",
    defaultColor: "sky",
  },
  {
    id: "minimal",
    label: "Minimal",
    description: "Format lettre noir et blanc, liste à traits, totaux alignés à droite.",
    tags: ["Print", "Épuré"],
    layoutKind: "minimal",
    defaultColor: "charcoal",
  },
  {
    id: "executive",
    label: "Exécutif",
    description: "Bandeau sombre, titre XXL, tableau épuré et encart NET central.",
    tags: ["Premium", "Luxe"],
    layoutKind: "executive",
    defaultColor: "charcoal",
  },
  {
    id: "corporate",
    label: "Corporate",
    description: "Double cadre, en-tête en tableau 2 colonnes, grille comptable formelle.",
    tags: ["Enterprise", "Formel"],
    layoutKind: "corporate",
    defaultColor: "navy",
  },
  {
    id: "fresh",
    label: "Fresh",
    description: "Cartes arrondies empilées, lignes en pills, bandeau total gradient.",
    tags: ["Startup", "Dynamique"],
    layoutKind: "fresh",
    defaultColor: "emerald",
  },
  {
    id: "warm",
    label: "Warm",
    description: "Style magazine avec blockquote client, séparateurs chaleureux et pastille NET.",
    tags: ["Artisan", "Local"],
    layoutKind: "warm",
    defaultColor: "orange",
  },
  {
    id: "ocean",
    label: "Ocean",
    description: "Barre latérale verticale, badge circulaire numéro, liste fluide.",
    tags: ["Consulting", "Mer"],
    layoutKind: "ocean",
    defaultColor: "teal",
  },
  {
    id: "slate",
    label: "Slate",
    description: "Lettre commerciale numérotée, bloc Facturé à, montant en prose.",
    tags: ["Pro", "Suisse"],
    layoutKind: "slate",
    defaultColor: "slate",
  },
  {
    id: "royal",
    label: "Royal",
    description: "Composition centrée ornementale, cadre décoratif, totaux encadrés double.",
    tags: ["Luxe", "Élégant"],
    layoutKind: "royal",
    defaultColor: "violet",
  },
  {
    id: "geometric",
    label: "Géométrique",
    description: "Triangles décoratifs, en-tête éditorial, tableau sombre et encart total noir.",
    tags: ["Studio", "Graphique"],
    layoutKind: "geometric",
    defaultColor: "charcoal",
  },
  {
    id: "stripe",
    label: "Bande latérale",
    description: "Barre verticale colorée, titre document en filigrane, colonnes émetteur / client.",
    tags: ["Pro", "Épuré"],
    layoutKind: "stripe",
    defaultColor: "teal",
  },
  {
    id: "gradient",
    label: "Dégradé",
    description: "Bandeaux diagonaux dégradés en tête et pied, tableau à en-tête coloré.",
    tags: ["Créatif", "Moderne"],
    layoutKind: "gradient",
    defaultColor: "sky",
  },
  {
    id: "interim",
    label: "Interim",
    description: "Titre centré, tableau à en-tête vert, barre total pleine largeur.",
    tags: ["Consulting", "Projet"],
    layoutKind: "interim",
    defaultColor: "emerald",
  },
  {
    id: "bluepro",
    label: "Blue Pro",
    description: "Style facture corporate : blocs Facturé à / Livré à, tableau zébré.",
    tags: ["Corporate", "Facture"],
    layoutKind: "bluepro",
    defaultColor: "blue",
  },
  {
    id: "studio",
    label: "Studio",
    description: "Bloc logo coloré, filet d'accent, solde dû en bandeau et pied de page icônes.",
    tags: ["Agence", "Digital"],
    layoutKind: "studio",
    defaultColor: "navy",
  },
];

export function getTemplateMeta(id: DocumentTemplateId): DocumentTemplateMeta {
  return DOCUMENT_TEMPLATES.find((t) => t.id === id) ?? DOCUMENT_TEMPLATES[0];
}
