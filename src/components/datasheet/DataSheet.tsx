"use client";

import type { ReactNode } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const DATA_SHEET_WIDTH_DEFAULT =
  "w-full sm:w-1/2 sm:min-w-[50vw] sm:max-w-[min(90vw,56rem)]";

export const DATA_SHEET_WIDTH_WIDE =
  "w-full sm:w-3/5 sm:min-w-[50vw] sm:max-w-[min(95vw,80rem)]";

export function DataSheet({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  width = DATA_SHEET_WIDTH_DEFAULT,
  zIndex = 200,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  width?: string;
  zIndex?: number;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0" style={{ zIndex }}>
      <div
        className="absolute inset-0 bg-black/30"
        onClick={onClose}
        role="presentation"
      />
      <aside
        className={cn(
          "absolute inset-y-0 right-0 flex flex-col border-l border-black/[0.08] bg-white shadow-2xl",
          width,
        )}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="data-sheet-title"
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-black/[0.06] px-4 py-4 sm:px-5">
          <div className="min-w-0 pr-2">
            <h4 id="data-sheet-title" className="text-lg font-semibold text-ink">
              {title}
            </h4>
            {description ? (
              <p className="mt-1 text-sm text-[#6B7280]">{description}</p>
            ) : null}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="shrink-0"
            onClick={onClose}
            aria-label="Fermer"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5">{children}</div>
        {footer ? (
          <div className="flex shrink-0 flex-wrap justify-end gap-2 border-t border-black/[0.06] px-4 py-4 sm:px-5">
            {footer}
          </div>
        ) : null}
      </aside>
    </div>
  );
}
