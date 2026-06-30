/** Realistic stamp sizing + placement (preview + PDF export). */

export type CachetPlacement = {
  /** mm — PDF only */
  offsetX: number;
  /** mm — PDF only */
  offsetY: number;
  /** degrees */
  rotation: number;
};

export const CACHET_PDF = {
  maxWidthMm: 52,
  maxHeightMm: 38,
  pageWidthMm: 210,
  pageHeightMm: 297,
  rightRatio: 0.05,
  bottomRatio: 0.13,
  footerTopMm: 266,
  gapAfterContentMm: 4,
} as const;

export const CACHET_PREVIEW = {
  right: "5%",
  bottom: "12%",
  maxWidth: "32%",
  heightClass: "h-[4.8em] max-w-[9.5em]",
} as const;

function hashSeed(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function seededUnit(seed: string, salt: string) {
  const h = hashSeed(`${seed}:${salt}`);
  return (h % 10000) / 10000;
}

/** Stable per document — used in live preview. */
export function seededCachetPlacement(seed: string): CachetPlacement {
  const rx = seededUnit(seed, "x");
  const ry = seededUnit(seed, "y");
  const rr = seededUnit(seed, "r");
  return {
    offsetX: (rx - 0.5) * 14,
    offsetY: (ry - 0.5) * 10,
    rotation: -4 + rr * 5,
  };
}

/** Fresh jitter on every PDF export — mimics hand-stamping. */
export function randomCachetPlacement(): CachetPlacement {
  return {
    offsetX: (Math.random() - 0.5) * 18,
    offsetY: (Math.random() - 0.5) * 14,
    rotation: -4.5 + Math.random() * 6,
  };
}

function fitCachetSize(aspect?: number) {
  const { maxWidthMm, maxHeightMm } = CACHET_PDF;
  if (!aspect || !Number.isFinite(aspect) || aspect <= 0) {
    return { width: maxWidthMm, height: maxHeightMm * 0.88 };
  }
  let width = maxWidthMm;
  let height = width / aspect;
  if (height > maxHeightMm) {
    height = maxHeightMm;
    width = height * aspect;
  }
  return { width, height };
}

export function computeCachetPdfRect(
  placement: CachetPlacement,
  contentEndY?: number,
  aspect?: number,
): { x: number; y: number; width: number; height: number; rotation: number } {
  const { pageWidthMm, pageHeightMm, rightRatio, bottomRatio, footerTopMm, gapAfterContentMm } =
    CACHET_PDF;
  const { width, height } = fitCachetSize(aspect);

  const baseX = pageWidthMm * (1 - rightRatio) - width;
  const baseY = pageHeightMm * (1 - bottomRatio) - height;
  let y = baseY;
  if (contentEndY != null && contentEndY + gapAfterContentMm > baseY) {
    y = Math.min(contentEndY + gapAfterContentMm, footerTopMm - height);
  }

  const x = Math.max(8, Math.min(baseX + placement.offsetX, pageWidthMm - width - 6));
  y = Math.max(40, Math.min(y + placement.offsetY, footerTopMm - height));

  return { x, y, width, height, rotation: placement.rotation };
}

export function cachetPreviewTransform(placement: CachetPlacement) {
  return {
    transform: `rotate(${placement.rotation.toFixed(2)}deg)`,
  } as const;
}
