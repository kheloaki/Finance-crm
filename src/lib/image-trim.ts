/** Trim near-white / transparent padding so logos fill their box. */

function isEmptyPixel(
  data: Uint8ClampedArray,
  i: number,
  alphaThreshold: number,
  whiteThreshold: number,
): boolean {
  const a = data[i + 3] ?? 0;
  if (a < alphaThreshold) return true;
  const r = data[i] ?? 0;
  const g = data[i + 1] ?? 0;
  const b = data[i + 2] ?? 0;
  return r >= whiteThreshold && g >= whiteThreshold && b >= whiteThreshold;
}

/**
 * Crop empty margins from a data URL (transparent or near-white pixels).
 * Returns the original data URL if cropping is unnecessary or fails.
 */
export async function trimImageDataUrl(
  dataUrl: string,
  opts?: { alphaThreshold?: number; whiteThreshold?: number; padding?: number },
): Promise<{ dataUrl: string; aspect: number } | null> {
  const alphaThreshold = opts?.alphaThreshold ?? 8;
  const whiteThreshold = opts?.whiteThreshold ?? 242;
  const padding = opts?.padding ?? 1;

  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("image load failed"));
      el.src = dataUrl;
    });

    const w = img.naturalWidth;
    const h = img.naturalHeight;
    if (!w || !h) return null;

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return { dataUrl, aspect: w / h };

    ctx.drawImage(img, 0, 0);
    const { data } = ctx.getImageData(0, 0, w, h);

    let top = 0;
    let left = 0;
    let right = w - 1;
    let bottom = h - 1;

    outerTop: for (; top < h; top++) {
      for (let x = 0; x < w; x++) {
        if (!isEmptyPixel(data, (top * w + x) * 4, alphaThreshold, whiteThreshold)) break outerTop;
      }
    }
    outerBottom: for (; bottom > top; bottom--) {
      for (let x = 0; x < w; x++) {
        if (!isEmptyPixel(data, (bottom * w + x) * 4, alphaThreshold, whiteThreshold)) break outerBottom;
      }
    }
    outerLeft: for (; left < w; left++) {
      for (let y = top; y <= bottom; y++) {
        if (!isEmptyPixel(data, (y * w + left) * 4, alphaThreshold, whiteThreshold)) break outerLeft;
      }
    }
    outerRight: for (; right > left; right--) {
      for (let y = top; y <= bottom; y++) {
        if (!isEmptyPixel(data, (y * w + right) * 4, alphaThreshold, whiteThreshold)) break outerRight;
      }
    }

    top = Math.max(0, top - padding);
    left = Math.max(0, left - padding);
    right = Math.min(w - 1, right + padding);
    bottom = Math.min(h - 1, bottom + padding);

    const cropW = right - left + 1;
    const cropH = bottom - top + 1;
    if (cropW <= 0 || cropH <= 0) return { dataUrl, aspect: w / h };

    // Skip if we barely cropped anything (< 5% margins)
    if (cropW * cropH > w * h * 0.95) {
      return { dataUrl, aspect: w / h };
    }

    const out = document.createElement("canvas");
    out.width = cropW;
    out.height = cropH;
    const outCtx = out.getContext("2d");
    if (!outCtx) return { dataUrl, aspect: w / h };
    outCtx.drawImage(canvas, left, top, cropW, cropH, 0, 0, cropW, cropH);

    const trimmed = out.toDataURL("image/png");
    return { dataUrl: trimmed, aspect: cropW / cropH };
  } catch {
    return null;
  }
}
