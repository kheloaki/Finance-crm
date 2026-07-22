"use client";

import { Stamp } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Toggle company cachet on this document (preview + PDF export). */
export function DocumentCachetButton({
  showCachet,
  hasCachetAsset,
  readOnly,
  onToggle,
  onAddCachet,
  className,
}: {
  showCachet: boolean;
  hasCachetAsset: boolean;
  readOnly: boolean;
  onToggle: () => void;
  /** When no company cachet exists, open branding upload instead of disabling. */
  onAddCachet?: () => void;
  className?: string;
}) {
  const canAdd = !hasCachetAsset && !!onAddCachet;
  const label = !hasCachetAsset
    ? "Ajouter un cachet"
    : showCachet
      ? "Retirer le cachet"
      : "Afficher le cachet";
  return (
    <Button
      type="button"
      variant={showCachet ? "default" : "outline"}
      size="sm"
      className={className}
      disabled={readOnly || (!hasCachetAsset && !canAdd)}
      title={label}
      aria-pressed={hasCachetAsset ? showCachet : undefined}
      onClick={() => {
        if (!hasCachetAsset) {
          onAddCachet?.();
          return;
        }
        onToggle();
      }}
    >
      <Stamp className="h-3.5 w-3.5" />
      {label}
    </Button>
  );
}
