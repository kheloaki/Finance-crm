"use client";

import { cn } from "@/lib/utils";
import { DOCUMENT_COLORS, type DocumentColorId } from "@/lib/document-colors";

export function DocumentColorPicker({
  value,
  onChange,
}: {
  value: DocumentColorId;
  onChange: (id: DocumentColorId) => void;
}) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-[#6B7280]">Couleur du document</p>
      <div className="flex flex-wrap gap-2">
        {DOCUMENT_COLORS.map((color) => {
          const selected = value === color.id;
          return (
            <button
              key={color.id}
              type="button"
              title={color.label}
              onClick={() => onChange(color.id)}
              className={cn(
                "group relative h-9 w-9 rounded-full border-2 transition-all",
                selected
                  ? "scale-110 border-brand shadow-md ring-2 ring-brand/20"
                  : "border-white shadow-sm hover:scale-105 hover:shadow-md",
              )}
              style={{ backgroundColor: color.hex }}
            >
              {selected ? (
                <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white drop-shadow">
                  ✓
                </span>
              ) : null}
              <span className="sr-only">{color.label}</span>
            </button>
          );
        })}
      </div>
      <p className="text-[11px] text-[#9CA3AF]">
        Appliquée aux en-têtes, accents, tableaux et totaux — aperçu et PDF.
      </p>
    </div>
  );
}
