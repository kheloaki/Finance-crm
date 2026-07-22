"use client";

import { Pencil, Stamp } from "lucide-react";
import {
  CACHET_PREVIEW,
  cachetPreviewTransform,
  seededCachetPlacement,
} from "@/lib/document-cachet-layout";
import { cn } from "@/lib/utils";
import { useDocumentEdit } from "./document-edit-context";
import type { PreviewContext } from "./types";

const CACHET_INK_CLASS = "object-contain opacity-[0.92]";

export function CachetImage({
  src,
  className,
  placementSeed,
}: {
  src: string;
  className?: string;
  placementSeed?: string;
}) {
  const placement = seededCachetPlacement(placementSeed ?? src);
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      className={cn(CACHET_INK_CLASS, className)}
      style={cachetPreviewTransform(placement)}
      draggable={false}
    />
  );
}

export function DocumentCachetZone({ ctx }: { ctx: PreviewContext }) {
  const edit = useDocumentEdit();
  const canEdit = !!edit && !edit.readOnly && !!edit.onOpenBranding;

  const zoneStyle = {
    right: CACHET_PREVIEW.right,
    bottom: CACHET_PREVIEW.bottom,
    maxWidth: CACHET_PREVIEW.maxWidth,
  } as const;

  if (!ctx.cachetUrl) {
    if (!canEdit) return null;
    // Company already has a cachet — use the footer Cachet toggle to show it
    if (edit.settings?.cachetUrl) return null;
    return (
      <button
        type="button"
        onClick={() => edit.onOpenBranding?.("cachet")}
        className="absolute z-[1] flex items-center gap-1.5 rounded-md border border-dashed border-slate-300 bg-white/90 px-2.5 py-1.5 text-[10px] font-medium text-teal-600 shadow-sm hover:border-teal-300 hover:bg-teal-50"
        style={zoneStyle}
        title="Ajouter un cachet"
      >
        <Stamp className="h-3.5 w-3.5" />
        Ajouter cachet
      </button>
    );
  }

  const image = (
    <CachetImage
      src={ctx.cachetUrl}
      placementSeed={ctx.number || ctx.cachetUrl}
      className={CACHET_PREVIEW.heightClass}
    />
  );

  if (!canEdit) {
    return (
      <div
        className="pointer-events-none absolute z-[1] flex items-end justify-end"
        style={zoneStyle}
        aria-hidden
      >
        {image}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => edit.onOpenBranding?.("cachet")}
      className="group absolute z-[1] flex items-end justify-end outline-none"
      style={zoneStyle}
      title="Modifier le cachet"
    >
      {image}
      <span className="absolute -left-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 opacity-0 shadow-sm transition group-hover:opacity-100">
        <Pencil className="h-3 w-3" />
      </span>
    </button>
  );
}
