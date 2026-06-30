/** Client-side cachet prep: remove paper background, refine ink, trim, export PNG. */

export type ProcessCachetResult = {
  blob: Blob;
  width: number;
  height: number;
};

const MAX_DIMENSION = 1200;
const OUTPUT_MIME = "image/png";

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Impossible de lire l'image"));
    };
    img.src = url;
  });
}

function scaleDimensions(w: number, h: number, max: number) {
  if (w <= max && h <= max) return { width: w, height: h };
  const ratio = max / Math.max(w, h);
  return { width: Math.round(w * ratio), height: Math.round(h * ratio) };
}

function clamp(n: number) {
  return Math.max(0, Math.min(255, Math.round(n)));
}

function pixelIndex(x: number, y: number, width: number) {
  return (y * width + x) * 4;
}

function luminance(r: number, g: number, b: number) {
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

function saturation(r: number, g: number, b: number) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  return max === 0 ? 0 : (max - min) / max;
}

/** Paper / scanner background — includes white, cream, light gray. */
function isPaperPixel(r: number, g: number, b: number, a: number, tolerance = 0): boolean {
  if (a < 8) return true;
  const l = luminance(r, g, b);
  const sat = saturation(r, g, b);
  const spread = Math.max(r, g, b) - Math.min(r, g, b);
  const threshold = 228 - tolerance;
  if (l >= threshold && sat < 0.18) return true;
  if (l >= 248) return true;
  if (l >= 215 && sat < 0.08 && spread < 24) return true;
  return false;
}

/** Flood-fill paper from image edges (removes connected background). */
function floodRemovePaperFromEdges(imageData: ImageData): void {
  const { width, height, data } = imageData;
  const total = width * height;
  const visited = new Uint8Array(total);
  const queue = new Int32Array(total);
  let head = 0;
  let tail = 0;

  function tryPush(x: number, y: number) {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    const idx = y * width + x;
    if (visited[idx]) return;
    const pi = pixelIndex(x, y, width);
    if (!isPaperPixel(data[pi], data[pi + 1], data[pi + 2], data[pi + 3], 8)) return;
    visited[idx] = 1;
    queue[tail++] = idx;
  }

  for (let x = 0; x < width; x++) {
    tryPush(x, 0);
    tryPush(x, height - 1);
  }
  for (let y = 0; y < height; y++) {
    tryPush(0, y);
    tryPush(width - 1, y);
  }

  while (head < tail) {
    const idx = queue[head++];
    const pi = idx * 4;
    data[pi + 3] = 0;

    const x = idx % width;
    const y = (idx - x) / width;
    tryPush(x - 1, y);
    tryPush(x + 1, y);
    tryPush(x, y - 1);
    tryPush(x, y + 1);
  }
}

/** Remove remaining near-white pixels (fringe inside/outside stamp). */
function removeNearWhiteFringe(imageData: ImageData): void {
  const { data } = imageData;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];
    if (a < 8) continue;

    const l = luminance(r, g, b);
    const sat = saturation(r, g, b);

    if (l >= 240 && sat < 0.14) {
      data[i + 3] = 0;
      continue;
    }

    if (l >= 220 && sat < 0.1) {
      const fade = Math.min(1, (l - 220) / 28);
      data[i + 3] = clamp(a * (1 - fade));
    }
  }
}

function enhanceStampInk(imageData: ImageData): void {
  const { data } = imageData;

  for (let i = 0; i < data.length; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];
    let a = data[i + 3];

    if (a < 16) {
      data[i + 3] = 0;
      continue;
    }

    const l = luminance(r, g, b);
    const sat = saturation(r, g, b);

    if (isPaperPixel(r, g, b, a)) {
      data[i + 3] = 0;
      continue;
    }

    const contrast = 1.22;
    r = clamp((r - 128) * contrast + 128);
    g = clamp((g - 128) * contrast + 128);
    b = clamp((b - 128) * contrast + 128);

    if (sat > 0.06 && l < 225) {
      const gray = luminance(r, g, b);
      const boost = 1.15;
      r = clamp(gray + (r - gray) * boost);
      g = clamp(gray + (g - gray) * boost);
      b = clamp(gray + (b - gray) * boost);
    }

    if (l > 200 && sat < 0.15) {
      a = clamp(a * 0.2);
    }

    data[i] = r;
    data[i + 1] = g;
    data[i + 2] = b;
    data[i + 3] = a;
  }
}

function trimTransparent(imageData: ImageData, padding = 6): ImageData {
  const { width, height, data } = imageData;
  let minX = width;
  let minY = height;
  let maxX = 0;
  let maxY = 0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const a = data[(y * width + x) * 4 + 3];
      if (a > 24) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }

  if (minX > maxX || minY > maxY) return imageData;

  minX = Math.max(0, minX - padding);
  minY = Math.max(0, minY - padding);
  maxX = Math.min(width - 1, maxX + padding);
  maxY = Math.min(height - 1, maxY + padding);

  const outW = maxX - minX + 1;
  const outH = maxY - minY + 1;
  const out = new ImageData(outW, outH);

  for (let y = 0; y < outH; y++) {
    for (let x = 0; x < outW; x++) {
      const src = ((minY + y) * width + (minX + x)) * 4;
      const dst = (y * outW + x) * 4;
      out.data[dst] = data[src];
      out.data[dst + 1] = data[src + 1];
      out.data[dst + 2] = data[src + 2];
      out.data[dst + 3] = data[src + 3];
    }
  }

  return out;
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Export PNG impossible"))),
      OUTPUT_MIME,
      1,
    );
  });
}

export async function processCachetImage(file: File): Promise<ProcessCachetResult> {
  const img = await loadImage(file);
  const { width, height } = scaleDimensions(img.naturalWidth, img.naturalHeight, MAX_DIMENSION);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Canvas indisponible");

  ctx.drawImage(img, 0, 0, width, height);
  const processed = ctx.getImageData(0, 0, width, height);

  floodRemovePaperFromEdges(processed);
  removeNearWhiteFringe(processed);
  enhanceStampInk(processed);
  removeNearWhiteFringe(processed);

  const trimmed = trimTransparent(processed);

  canvas.width = trimmed.width;
  canvas.height = trimmed.height;
  ctx.clearRect(0, 0, trimmed.width, trimmed.height);
  ctx.putImageData(trimmed, 0, 0);

  const blob = await canvasToBlob(canvas);
  return { blob, width: trimmed.width, height: trimmed.height };
}

/** Stamp ink on white paper — no extra white box. */
export const CACHET_DISPLAY_CLASS =
  "object-contain opacity-[0.92] -rotate-[1.25deg]";
