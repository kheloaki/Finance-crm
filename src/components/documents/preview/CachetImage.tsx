import {
  CACHET_PREVIEW,
  cachetPreviewTransform,
  seededCachetPlacement,
} from "@/lib/document-cachet-layout";
import { cn } from "@/lib/utils";
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
  if (!ctx.cachetUrl) return null;

  return (
    <div
      className="pointer-events-none absolute z-[1] flex items-end justify-end"
      style={{
        right: CACHET_PREVIEW.right,
        bottom: CACHET_PREVIEW.bottom,
        maxWidth: CACHET_PREVIEW.maxWidth,
      }}
      aria-hidden
    >
      <CachetImage
        src={ctx.cachetUrl}
        placementSeed={ctx.number || ctx.cachetUrl}
        className={CACHET_PREVIEW.heightClass}
      />
    </div>
  );
}
