import type { jsPDF } from "jspdf";
import type { DocumentTemplateId } from "@/lib/document-templates";
import type { CachetPlacement } from "@/lib/document-cachet-layout";
import { computeCachetPdfRect } from "@/lib/document-cachet-layout";
import type { DocumentTheme } from "@/lib/document-theme";
import { formatMoney, lineTotalTtc } from "@/lib/money";
import { buildSellerFooterLines } from "@/lib/seller-footer";

export type PdfLine = {
  reference: string;
  designation: string;
  unit: string;
  qty: number;
  unitPriceHt: number;
  isNote?: boolean;
};

export type PdfRenderContext = {
  doc: jsPDF;
  margin: number;
  delivery: boolean;
  label: string;
  number: string;
  date: string;
  dateFormatted: string;
  dueDate?: string;
  dueDateFormatted?: string;
  reference?: string;
  sellerName: string;
  sellerActivity: string;
  sellerAddress: string;
  sellerPhone: string;
  sellerWebsite: string;
  sellerEmail: string;
  sellerIce: string;
  sellerIf: string;
  sellerRc: string;
  sellerCnss: string;
  sellerLegal: string;
  sellerContact: string;
  logoDataUrl?: string | null;
  logoAspect?: number;
  cachetDataUrl?: string | null;
  cachetAspect?: number;
  cachetPlacement?: CachetPlacement;
  theme: DocumentTheme;
  counterpartyLabel: string;
  counterpartyName: string;
  counterpartyIce?: string;
  counterpartyRepresentative?: string;
  counterpartyAddress?: string;
  counterpartyCity?: string;
  vatRate: number;
  discount: number;
  deposit: number;
  totalHt: number;
  netHt: number;
  vatAmount: number;
  totalTtc: number;
  netToPay: number;
  notes: string;
  lines: PdfLine[];
};

type LayoutRenderer = (ctx: PdfRenderContext) => void;

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function blendRgb(
  a: [number, number, number],
  b: [number, number, number],
  t: number,
): [number, number, number] {
  return [
    Math.round(a[0] + (b[0] - a[0]) * t),
    Math.round(a[1] + (b[1] - a[1]) * t),
    Math.round(a[2] + (b[2] - a[2]) * t),
  ];
}

function drawHorizontalGradient(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
  from: [number, number, number],
  to: [number, number, number],
) {
  const steps = 48;
  const stepW = w / steps;
  for (let i = 0; i < steps; i++) {
    const t = i / (steps - 1);
    fillRgb(doc, blendRgb(from, to, t));
    doc.rect(x + i * stepW, y, stepW + 0.25, h, "F");
  }
}


function lineTtc(qty: number, unitPriceHt: number, vatRate: number) {
  return lineTotalTtc(qty, unitPriceHt, vatRate);
}

function fillRgb(doc: jsPDF, rgb: [number, number, number]) {
  doc.setFillColor(rgb[0], rgb[1], rgb[2]);
}

function strokeRgb(doc: jsPDF, rgb: [number, number, number]) {
  doc.setDrawColor(rgb[0], rgb[1], rgb[2]);
}

function textRgb(doc: jsPDF, rgb: [number, number, number]) {
  doc.setTextColor(rgb[0], rgb[1], rgb[2]);
}

function fillPrimary(ctx: PdfRenderContext) {
  fillRgb(ctx.doc, ctx.theme.primaryRgb);
}

function fillPrimaryDark(ctx: PdfRenderContext) {
  fillRgb(ctx.doc, ctx.theme.primaryDarkRgb);
}

function fillSurface(ctx: PdfRenderContext) {
  fillRgb(ctx.doc, hexToRgb(ctx.theme.surface));
}

function fillMuted(ctx: PdfRenderContext) {
  fillRgb(ctx.doc, hexToRgb(ctx.theme.primaryMuted));
}

function textPrimaryDark(ctx: PdfRenderContext) {
  textRgb(ctx.doc, ctx.theme.primaryDarkRgb);
}

function textOnPrimary(ctx: PdfRenderContext) {
  textRgb(ctx.doc, hexToRgb(ctx.theme.onPrimary));
}

function textAccent(ctx: PdfRenderContext) {
  textRgb(ctx.doc, hexToRgb(ctx.theme.accent));
}

function drawLogo(ctx: PdfRenderContext, x: number, y: number, maxW = 48, maxH = 30): { w: number; h: number } {
  if (!ctx.logoDataUrl) return { w: 0, h: 0 };
  let w = maxW;
  let h = maxH;
  if (ctx.logoAspect && ctx.logoAspect > 0) {
    if (ctx.logoAspect >= maxW / maxH) {
      w = maxW;
      h = maxW / ctx.logoAspect;
    } else {
      h = maxH;
      w = maxH * ctx.logoAspect;
    }
  }
  try {
    const fmt = ctx.logoDataUrl.includes("image/png") ? "PNG" : "JPEG";
    ctx.doc.addImage(ctx.logoDataUrl, fmt, x, y, w, h, undefined, "MEDIUM");
  } catch {
    // skip invalid image
  }
  return { w, h };
}

function drawCachet(ctx: PdfRenderContext, contentEndY?: number) {
  if (!ctx.cachetDataUrl || !ctx.cachetPlacement) return;
  const rect = computeCachetPdfRect(ctx.cachetPlacement, contentEndY, ctx.cachetAspect);

  try {
    const fmt = ctx.cachetDataUrl.includes("image/png") ? "PNG" : "JPEG";
    ctx.doc.addImage(
      ctx.cachetDataUrl,
      fmt,
      rect.x,
      rect.y,
      rect.width,
      rect.height,
      undefined,
      "FAST",
      rect.rotation,
    );
  } catch {
    // skip invalid image
  }
}

function footerLegal(ctx: PdfRenderContext, y: number, contentEndY?: number) {
  drawCachet(ctx, contentEndY);
  const lines = buildSellerFooterLines({
    sellerPhone: ctx.sellerPhone,
    sellerWebsite: ctx.sellerWebsite,
    sellerEmail: ctx.sellerEmail,
    sellerIce: ctx.sellerIce,
    sellerIf: ctx.sellerIf,
    sellerRc: ctx.sellerRc,
    sellerCnss: ctx.sellerCnss,
    sellerAddress: ctx.sellerAddress,
    sellerLegal: ctx.sellerLegal,
    sellerContact: ctx.sellerContact,
  });
  if (lines.length === 0) return;
  ctx.doc.setFont("helvetica", "normal");
  ctx.doc.setFontSize(6);
  textRgb(ctx.doc, [156, 163, 175]);
  let fy = y;
  for (const fl of lines) {
    const wrapped = ctx.doc.splitTextToSize(fl.toUpperCase(), 182);
    ctx.doc.text(wrapped, 105, fy, { align: "center" });
    fy += wrapped.length * 3.2;
  }
}

function drawMetaChips(ctx: PdfRenderContext, y: number) {
  const { doc, margin } = ctx;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  textRgb(doc, [71, 85, 105]);
  let x = margin;
  const chips: [string, string][] = [["Date", ctx.dateFormatted]];
  if (ctx.dueDateFormatted) chips.push(["Échéance", ctx.dueDateFormatted]);

  for (const [k, v] of chips) {
    doc.setFillColor(248, 250, 252);
    strokeRgb(doc, [226, 232, 240]);
    const label = `${k} ${v}`;
    const w = doc.getTextWidth(label) + 6;
    doc.roundedRect(x, y, w, 6, 1, 1, "FD");
    doc.text(label, x + 3, y + 4.2);
    x += w + 2;
  }
  return y + 9;
}

function drawNotes(
  ctx: PdfRenderContext,
  y: number,
  opts?: { x?: number; maxWidth?: number },
) {
  if (!ctx.notes?.trim()) return y;
  const { doc, margin } = ctx;
  const x = opts?.x ?? margin;
  const maxWidth = opts?.maxWidth ?? 180;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  textRgb(doc, [148, 163, 184]);
  doc.text("OBSERVATIONS", x, y);
  doc.setFont("helvetica", "italic");
  doc.setFontSize(8);
  textRgb(doc, [75, 85, 99]);
  const lines = doc.splitTextToSize(ctx.notes, maxWidth);
  doc.text(lines, x, y + 4);
  return y + 4 + lines.length * 4;
}

function drawAdjustments(ctx: PdfRenderContext, y: number) {
  const { doc, margin, discount, deposit, vatRate } = ctx;
  if (discount <= 0 && deposit <= 0) return y;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  textRgb(doc, [71, 85, 105]);
  if (discount > 0) {
    doc.text(`Remise HT : ${formatMoney(discount)}`, margin, y);
    y += 4;
  }
  if (deposit > 0) {
    doc.text(`Acompte TTC : ${formatMoney(lineTtc(1, deposit, vatRate))}`, margin, y);
    y += 4;
  }
  return y + 1;
}

function drawSpreadsheetTable(
  ctx: PdfRenderContext,
  y: number,
  opts?: { headRgb?: [number, number, number]; margin?: number; minimalHead?: boolean },
) {
  const { doc, delivery, lines, vatRate, theme } = ctx;
  const margin = opts?.margin ?? ctx.margin;
  const tableW = 196 - margin;
  const headRgb = opts?.headRgb ?? theme.primaryDarkRgb;
  const stripeRgb = hexToRgb(theme.surface);
  const colWidths = delivery
    ? [tableW * 0.56, tableW * 0.22, tableW * 0.22]
    : [tableW * 0.44, tableW * 0.1, tableW * 0.12, tableW * 0.17, tableW * 0.17];
  const headers = delivery
    ? ["Désignation", "Unité", "Qté"]
    : ["Désignation", "U", "Qté", "PU HT", "TTC"];
  const lineHeight = 4.2;
  const cellPad = 2;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  if (opts?.minimalHead) {
    strokeRgb(doc, theme.primaryRgb);
    doc.setLineWidth(0.5);
    doc.line(margin, y, margin + tableW, y);
    textPrimaryDark(ctx);
    y += 3;
  } else {
    fillRgb(doc, headRgb);
    textOnPrimary(ctx);
    doc.rect(margin, y, tableW, 8, "F");
    y += 0;
  }
  let x = margin + cellPad;
  headers.forEach((h, i) => {
    doc.text(h, x, y + 5.5);
    x += colWidths[i];
  });
  y += 10;

  doc.setFont("helvetica", "normal");
  textRgb(doc, [17, 24, 39]);
  const billable = lines.filter((l) => !l.isNote);
  billable.forEach((line, rowIndex) => {
    if (y > 258) {
      doc.addPage();
      y = margin;
    }

    const cells = delivery
      ? [line.designation, line.unit, String(line.qty)]
      : [
          line.designation,
          line.unit,
          String(line.qty),
          formatMoney(line.unitPriceHt),
          formatMoney(lineTtc(line.qty, line.unitPriceHt, vatRate)),
        ];

    const wrappedCells = cells.map((cell, i) =>
      doc.splitTextToSize(String(cell), Math.max(8, colWidths[i] - cellPad)),
    );
    const maxLines = Math.max(1, ...wrappedCells.map((w) => w.length));
    const rowH = Math.max(8, maxLines * lineHeight + 3);

    if (rowIndex % 2 === 1) {
      fillRgb(doc, stripeRgb);
      doc.rect(margin, y, tableW, rowH, "F");
      textRgb(doc, [17, 24, 39]);
    }

    x = margin + cellPad;
    wrappedCells.forEach((wrapped, i) => {
      const align = !delivery && i >= 3 ? ("right" as const) : undefined;
      doc.text(wrapped, x + (align === "right" ? colWidths[i] - cellPad : 0), y + 4, {
        align,
      });
      x += colWidths[i];
    });
    y += rowH;
  });

  for (const line of lines.filter((l) => l.isNote && l.designation.trim())) {
    if (y > 258) {
      doc.addPage();
      y = margin;
    }
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    textRgb(doc, [120, 113, 108]);
    const noteLines = doc.splitTextToSize(line.designation, tableW - cellPad * 2);
    const noteH = Math.max(8, noteLines.length * lineHeight + 2);
    doc.text(noteLines, margin + cellPad, y + 4);
    doc.setFont("helvetica", "normal");
    y += noteH;
  }

  return y;
}

function drawListLines(ctx: PdfRenderContext, y: number) {
  const { doc, margin, delivery, lines, vatRate, theme } = ctx;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  textRgb(doc, [17, 24, 39]);

  for (const line of lines) {
    if (y > 258) {
      doc.addPage();
      y = margin;
    }
    if (line.isNote) {
      doc.setFont("helvetica", "italic");
      doc.setFontSize(8);
      textRgb(doc, [120, 113, 108]);
      doc.text(doc.splitTextToSize(line.designation, 175), margin, y + 4);
      doc.setFont("helvetica", "normal");
      y += 10;
      continue;
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    textRgb(doc, [17, 24, 39]);
    doc.text(line.designation.slice(0, 60), margin, y);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    textRgb(doc, [100, 116, 139]);
    const sub = delivery
      ? `${line.qty} ${line.unit}`
      : `${line.qty} × ${formatMoney(line.unitPriceHt)} HT`;
    doc.text(sub, margin, y + 4);
    if (!delivery) {
      textRgb(doc, [17, 24, 39]);
      doc.text(formatMoney(lineTtc(line.qty, line.unitPriceHt, vatRate)), 196, y, {
        align: "right",
      });
    }
    strokeRgb(doc, hexToRgb(theme.surfaceBorder));
    doc.line(margin, y + 7, 196, y + 7);
    y += 11;
  }
  return y;
}

/** Card-style lines — matches preview Modern / Fresh layouts */
function drawLineCards(ctx: PdfRenderContext, y: number) {
  const { doc, margin, delivery, lines, vatRate, theme } = ctx;
  const cardH = 12;
  const gap = 1.5;

  for (const line of lines) {
    if (y > 255) {
      doc.addPage();
      y = margin;
    }
    if (line.isNote) {
      doc.setFont("helvetica", "italic");
      doc.setFontSize(8);
      textRgb(doc, [120, 113, 108]);
      doc.text(doc.splitTextToSize(line.designation, 175), margin + 3, y + 4);
      doc.setFont("helvetica", "normal");
      y += 9;
      continue;
    }
    if (!line.designation.trim()) continue;

    doc.setFillColor(255, 255, 255);
    strokeRgb(doc, hexToRgb(theme.surfaceBorder));
    doc.roundedRect(margin, y, 182, cardH, 2, 2, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    textRgb(doc, [15, 23, 42]);
    doc.text(line.designation.slice(0, 52), margin + 3, y + 5);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    textRgb(doc, [100, 116, 139]);
    const sub = delivery
      ? `${line.qty} ${line.unit}`
      : `${line.qty} ${line.unit} · HT ${formatMoney(line.unitPriceHt)}`;
    doc.text(sub, margin + 3, y + 9.5);

    if (!delivery) {
      textRgb(doc, theme.primaryRgb);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.text(formatMoney(lineTtc(line.qty, line.unitPriceHt, vatRate)), 196 - 3, y + 6, {
        align: "right",
      });
    }

    y += cardH + gap;
  }
  return y;
}

/** Fresh preview — designation + TTC price pills */
function drawFreshLineCards(ctx: PdfRenderContext, y: number) {
  const { doc, margin, delivery, lines, vatRate, theme } = ctx;
  for (const line of lines) {
    if (y > 255) {
      doc.addPage();
      y = margin;
    }
    if (line.isNote) {
      doc.setFont("helvetica", "italic");
      doc.setFontSize(8);
      textRgb(doc, [120, 113, 108]);
      doc.text(doc.splitTextToSize(line.designation, 175), margin + 3, y + 4);
      doc.setFont("helvetica", "normal");
      y += 9;
      continue;
    }
    if (!line.designation.trim()) continue;
    doc.setFillColor(255, 255, 255);
    strokeRgb(doc, hexToRgb(theme.surfaceBorder));
    doc.roundedRect(margin, y, 182, 10, 3, 3, "FD");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    textRgb(doc, [15, 23, 42]);
    doc.text(line.designation.slice(0, 52), margin + 3, y + 6);
    if (!delivery) {
      textRgb(doc, theme.primaryRgb);
      doc.setFont("helvetica", "bold");
      doc.text(formatMoney(lineTtc(line.qty, line.unitPriceHt, vatRate)), 196 - 3, y + 6, {
        align: "right",
      });
    } else {
      textRgb(doc, theme.primaryRgb);
      doc.setFontSize(7);
      doc.text(`${line.qty} ${line.unit}`, 196 - 3, y + 6, { align: "right" });
    }
    y += 11.5;
  }
  return y;
}

/** Warm preview — magazine lines with ref · qty */
function drawWarmLines(ctx: PdfRenderContext, y: number) {
  const { doc, margin, delivery, lines, vatRate, theme } = ctx;
  for (const line of lines) {
    if (y > 258) {
      doc.addPage();
      y = margin;
    }
    if (line.isNote) {
      doc.setFont("helvetica", "italic");
      doc.setFontSize(8);
      textRgb(doc, [120, 113, 108]);
      doc.text(doc.splitTextToSize(line.designation, 175), margin, y + 4);
      y += 9;
      continue;
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    textPrimaryDark(ctx);
    doc.text(line.designation.slice(0, 55), margin, y + 4);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    textRgb(doc, hexToRgb(theme.primaryDark));
    const sub = `${line.qty} ${line.unit}`;
    doc.text(sub, margin, y + 9);
    if (!delivery) {
      doc.setFont("helvetica", "bold");
      doc.text(formatMoney(lineTtc(line.qty, line.unitPriceHt, vatRate)), 196, y + 6, {
        align: "right",
      });
    }
    strokeRgb(doc, hexToRgb(theme.surfaceBorder));
    doc.line(margin, y + 12, 196, y + 12);
    y += 15;
  }
  return y;
}

/** Royal preview — Article / Qté / Total */
function drawRoyalTable(ctx: PdfRenderContext, y: number) {
  const { doc, margin, delivery, lines, vatRate, theme } = ctx;
  fillPrimaryDark(ctx);
  doc.rect(margin + 8, y, 166, 8, "F");
  textOnPrimary(ctx);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.text("Article", margin + 10, y + 5.5);
  doc.text("Qté", margin + 120, y + 5.5);
  if (!delivery) doc.text("Total", 168, y + 5.5, { align: "right" });
  y += 10;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  textRgb(doc, [17, 24, 39]);
  const billable = lines.filter((l) => !l.isNote);
  billable.forEach((line, i) => {
    if (i % 2 === 1) {
      fillSurface(ctx);
      doc.rect(margin + 8, y - 1, 166, 9, "F");
      textRgb(doc, [17, 24, 39]);
    }
    doc.text(line.designation.slice(0, 48), margin + 10, y + 4);
    doc.text(String(line.qty), margin + 120, y + 4);
    if (!delivery) {
      doc.text(formatMoney(lineTtc(line.qty, line.unitPriceHt, vatRate)), 168, y + 4, {
        align: "right",
      });
    }
    strokeRgb(doc, hexToRgb(theme.surfaceBorder));
    doc.line(margin + 8, y + 9, margin + 174, y + 9);
    y += 10;
  });
  return y;
}

/** Gradient 4-cell banner — matches preview TotalsBanner + gradientBannerStyle */
function drawTotalsBannerGradient(ctx: PdfRenderContext, y: number) {
  const { doc, margin, totalHt, vatAmount, totalTtc, netToPay, theme } = ctx;
  y = drawAdjustments(ctx, y);
  const h = 16;
  const w = 182;
  const cells = [
    { k: "Total HT", v: totalHt, highlight: false },
    { k: "TVA", v: vatAmount, highlight: false },
    { k: "Total TTC", v: totalTtc, highlight: false },
    { k: "Net à payer", v: netToPay, highlight: true },
  ];

  drawHorizontalGradient(doc, margin, y, w, h, theme.primaryRgb, theme.primaryDarkRgb);

  const cw = w / 4;
  cells.forEach((cell, i) => {
    const x = margin + i * cw;
    if (cell.highlight) {
      fillRgb(doc, blendRgb(theme.primaryDarkRgb, [0, 0, 0], 0.35));
      doc.rect(x, y, cw, h, "F");
    } else {
      fillRgb(doc, blendRgb(theme.primaryRgb, [255, 255, 255], 0.12));
      doc.rect(x, y, cw, h, "F");
    }
  });

  strokeRgb(doc, theme.primaryDarkRgb);
  doc.roundedRect(margin, y, w, h, 2, 2, "S");

  textOnPrimary(ctx);
  cells.forEach((cell, i) => {
    const cx = margin + i * cw + cw / 2;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(5.5);
    doc.text(cell.k.toUpperCase(), cx, y + 5, { align: "center" });
    doc.setFont("helvetica", cell.highlight ? "bold" : "normal");
    doc.setFontSize(cell.highlight ? 10 : 8);
    doc.text(formatMoney(cell.v), cx, y + 12, { align: "center" });
  });

  return y + h + 4;
}

/** Classic preview: 2/5 TVA + 3/5 Net à payer with accent label */
function drawTotalsClassic(ctx: PdfRenderContext, y: number) {
  const { doc, margin, vatRate, vatAmount, netToPay, theme } = ctx;
  y = drawAdjustments(ctx, y);
  const w = 182;
  const tvaW = w * 0.4;
  const netW = w * 0.6;

  strokeRgb(doc, hexToRgb(theme.surfaceBorder));
  doc.rect(margin, y, w, 14);
  fillMuted(ctx);
  doc.rect(margin, y, tvaW, 14, "F");
  textPrimaryDark(ctx);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text(`TVA ${vatRate}%`, margin + 3, y + 5);
  doc.setFont("helvetica", "normal");
  doc.text(formatMoney(vatAmount), margin + 3, y + 10);

  fillPrimaryDark(ctx);
  doc.rect(margin + tvaW, y, netW, 14, "F");
  textOnPrimary(ctx);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  textAccent(ctx);
  doc.text("Net à payer", margin + tvaW + netW / 2, y + 5, { align: "center" });
  textOnPrimary(ctx);
  doc.setFontSize(11);
  doc.text(formatMoney(netToPay), margin + tvaW + netW / 2, y + 11, { align: "center" });
  return y + 18;
}

function estimateCounterpartyHeight(ctx: PdfRenderContext, maxWidth: number): number {
  const { doc, counterpartyName, counterpartyIce, counterpartyRepresentative } = ctx;
  let lines = 1;
  lines += doc.splitTextToSize(counterpartyName || "—", maxWidth).length;
  if (counterpartyRepresentative?.trim()) {
    lines += doc.splitTextToSize(
      `Représentée par ${counterpartyRepresentative.trim()}`,
      maxWidth,
    ).length;
  }
  if (counterpartyIce) {
    lines += doc.splitTextToSize(`ICE : ${counterpartyIce}`, maxWidth).length;
  }
  return Math.max(22, 8 + lines * 4.2);
}

function drawCounterpartyTag(
  ctx: PdfRenderContext,
  x: number,
  y: number,
  align: "left" | "right" = "left",
  maxWidth?: number,
) {
  const { doc, counterpartyLabel, counterpartyName, counterpartyIce, counterpartyRepresentative } = ctx;
  const textOpts = align === "right" ? ({ align: "right" as const } as const) : undefined;
  const wrap = (text: string, width: number) => doc.splitTextToSize(text, width);

  textPrimaryDark(ctx);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.text(counterpartyLabel.toUpperCase(), x, y, textOpts);

  let lineY = y + 4.5;
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  textRgb(doc, [15, 23, 42]);
  const nameText = counterpartyName || "—";
  const nameLines = maxWidth ? wrap(nameText, maxWidth) : [nameText];
  doc.text(nameLines, x, lineY, textOpts);
  lineY += nameLines.length * 4.2;

  if (counterpartyRepresentative?.trim()) {
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    textRgb(doc, [71, 85, 105]);
    const repLines = maxWidth
      ? wrap(`Représentée par ${counterpartyRepresentative.trim()}`, maxWidth)
      : [`Représentée par ${counterpartyRepresentative.trim()}`];
    doc.text(repLines, x, lineY, textOpts);
    lineY += repLines.length * 4;
  }
  if (counterpartyIce) {
    doc.setFontSize(8);
    textRgb(doc, [71, 85, 105]);
    const iceLines = maxWidth ? wrap(`ICE : ${counterpartyIce}`, maxWidth) : [`ICE : ${counterpartyIce}`];
    doc.text(iceLines, x, lineY, textOpts);
    lineY += iceLines.length * 4;
  }

  return lineY;
}

function renderClassic(ctx: PdfRenderContext) {
  const { doc, margin, label, number, sellerName, sellerActivity, theme } = ctx;
  fillRgb(doc, [248, 250, 252]);
  doc.rect(0, 0, 210, 50, "F");

  let y = 10;
  drawLogo(ctx, margin, y, 42, 28);
  const boxW = 92;
  const boxH = sellerActivity ? 16 : 11;
  strokeRgb(doc, [226, 232, 240]);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(105 - boxW / 2, y, boxW, boxH, 2, 2, "FD");
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  textRgb(doc, [15, 23, 42]);
  doc.text(sellerName.toUpperCase(), 105, y + 5, { align: "center" });
  if (sellerActivity) {
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    textRgb(doc, [100, 116, 139]);
    doc.text(sellerActivity.toUpperCase(), 105, y + 10, { align: "center" });
  }

  y = 38;
  strokeRgb(doc, theme.primaryRgb);
  doc.line(margin, y, 196, y);
  y += 5;

  const clientBoxX = 126;
  const clientBoxW = 70;
  const clientPad = 3;
  const clientContentW = clientBoxW - clientPad * 2;
  const clientTextX = clientBoxX + clientBoxW - clientPad;
  const clientBoxH = estimateCounterpartyHeight(ctx, clientContentW);
  fillMuted(ctx);
  strokeRgb(doc, hexToRgb(theme.surfaceBorder));
  doc.roundedRect(clientBoxX, y, clientBoxW, clientBoxH, 2, 2, "FD");
  drawCounterpartyTag(ctx, clientTextX, y + 4, "right", clientContentW);
  y += clientBoxH + 6;

  fillPrimary(ctx);
  doc.roundedRect(margin, y + 1, 3, 8, 1, 1, "F");
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  textRgb(doc, [15, 23, 42]);
  doc.text(`${label} N° ${number}`, margin + 6, y + 7);
  y += 10;
  y = drawMetaChips(ctx, y);

  strokeRgb(doc, hexToRgb(theme.surfaceBorder));
  doc.roundedRect(margin, y, 182, 1, 1, 1, "S");
  y += 3;
  y = drawSpreadsheetTable(ctx, y);
  if (!ctx.delivery) y = drawTotalsClassic(ctx, y + 2);
  y = drawNotes(ctx, y + 2);
  fillRgb(doc, [248, 250, 252]);
  doc.rect(0, 276, 210, 21, "F");
  finishLayout(ctx, y);
}

function renderModern(ctx: PdfRenderContext) {
  const { doc, margin, label, number, sellerName, sellerActivity, theme } = ctx;
  const headerH = 36;

  drawHorizontalGradient(doc, 0, 0, 210, headerH, theme.primaryRgb, theme.primaryDarkRgb);

  let sellerTextX = margin;
  if (ctx.logoDataUrl) {
    const logo = drawLogo(ctx, margin, 6, 28, 22);
    sellerTextX = margin + logo.w + 3;
  } else if (sellerName.trim()) {
    const initials = sellerName.slice(0, 2).toUpperCase();
    fillRgb(doc, blendRgb(theme.primaryRgb, [255, 255, 255], 0.22));
    doc.roundedRect(margin, 8, 14, 14, 2, 2, "F");
    textOnPrimary(ctx);
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.text(initials, margin + 7, 17, { align: "center" });
    sellerTextX = margin + 18;
  }

  if (sellerName.trim()) {
    textOnPrimary(ctx);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(sellerName, sellerTextX, 14);
    if (sellerActivity) {
      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      doc.text(sellerActivity, sellerTextX, 19);
    }
  }

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(label.toUpperCase(), 196, 12, { align: "right" });
  doc.setFontSize(9);
  doc.text(`#${number}`, 196, 18, { align: "right" });
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(ctx.dateFormatted, 196, 24, { align: "right" });

  let y = 31;
  doc.setFillColor(255, 255, 255);
  strokeRgb(doc, hexToRgb(theme.surfaceBorder));
  doc.roundedRect(margin, y, 182, 18, 3, 3, "FD");

  const initial = (ctx.counterpartyName || "?")[0]?.toUpperCase() ?? "?";
  fillRgb(doc, hexToRgb(theme.surface));
  strokeRgb(doc, hexToRgb(theme.surfaceBorder));
  doc.circle(margin + 8, y + 9, 5, "FD");
  textPrimaryDark(ctx);
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.text(initial, margin + 8, y + 10, { align: "center" });

  doc.setFontSize(6);
  doc.setFont("helvetica", "bold");
  textRgb(doc, theme.primaryRgb);
  doc.text(ctx.counterpartyLabel.toUpperCase(), margin + 16, y + 5);
  doc.setFontSize(9);
  textRgb(doc, [15, 23, 42]);
  doc.setFont("helvetica", "bold");
  doc.text((ctx.counterpartyName || "—").slice(0, 42), margin + 16, y + 11);
  if (ctx.counterpartyRepresentative?.trim()) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    textRgb(doc, [100, 116, 139]);
    doc.text(
      `Représentée par ${ctx.counterpartyRepresentative.trim()}`.slice(0, 48),
      margin + 16,
      y + 15,
    );
  }
  if (ctx.counterpartyIce) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    textRgb(doc, [100, 116, 139]);
    doc.text(`ICE ${ctx.counterpartyIce}`, 196 - 3, y + 11, { align: "right" });
  }

  y += 22;
  y = drawLineCards(ctx, y);
  if (!ctx.delivery) y = drawTotalsBannerGradient(ctx, y + 2);

  y = drawNotes(ctx, y + 2);
  fillSurface(ctx);
  ctx.doc.rect(0, 276, 210, 21, "F");
  finishLayout(ctx, y);
}

function renderMinimal(ctx: PdfRenderContext) {
  const { doc, margin, label, number, sellerName, sellerActivity, theme } = ctx;
  let y = margin;
  const logo = drawLogo(ctx, margin, y - 1, 36, 24);
  const nameX = margin + (logo.w ? logo.w + 3 : 0);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  textRgb(doc, [17, 24, 39]);
  doc.text(sellerName.toUpperCase(), nameX, y);
  doc.setFontSize(8);
  doc.text(label, 196, y, { align: "right" });
  doc.setFont("helvetica", "bold");
  textRgb(doc, theme.primaryDarkRgb);
  doc.text(`N° ${number}`, 196, y + 5, { align: "right" });
  doc.setFont("helvetica", "normal");
  textRgb(doc, [115, 115, 115]);
  doc.text(ctx.dateFormatted, 196, y + 10, { align: "right" });
  y += sellerActivity ? 12 : 8;
  if (sellerActivity) {
    doc.text(sellerActivity.toUpperCase(), margin, y);
    y += 6;
  }
  strokeRgb(doc, theme.primaryDarkRgb);
  doc.setLineWidth(0.6);
  doc.line(margin, y, 196, y);
  y += 8;
  drawCounterpartyTag(ctx, margin, y);
  y += 18;

  y = drawListLines(ctx, y);
  if (!ctx.delivery) {
    y = drawTotalsMinimalRight(ctx, y + 2);
  }
  y = drawNotes(ctx, y);
  finishLayout(ctx, y);
}

function renderExecutive(ctx: PdfRenderContext) {
  const { doc, margin, label, number, sellerName, theme } = ctx;
  fillPrimaryDark(ctx);
  doc.rect(0, 0, 210, 42, "F");
  const logo = drawLogo(ctx, margin, 8, 28, 22);
  textOnPrimary(ctx);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  textAccent(ctx);
  doc.text(label.toUpperCase(), 196, 16, { align: "right" });
  textOnPrimary(ctx);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`Réf. ${number}`, 196, 24, { align: "right" });
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(sellerName, margin + (logo.w ? logo.w + 3 : 0), 18);

  let y = 48;
  strokeRgb(doc, hexToRgb(theme.surfaceBorder));
  doc.roundedRect(margin, y, 88, 24, 2, 2);
  fillMuted(ctx);
  doc.roundedRect(margin, y, 88, 24, 2, 2, "F");
  drawCounterpartyTag(ctx, margin + 3, y + 4);
  doc.setTextColor(17, 24, 39);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(`Date : ${ctx.dateFormatted}`, margin + 94, y + 9);
  if (ctx.dueDateFormatted) doc.text(`Échéance : ${ctx.dueDateFormatted}`, margin + 94, y + 15);
  y += 30;

  y = drawExecutiveTable(ctx, y);
  if (!ctx.delivery) {
    fillPrimaryDark(ctx);
    doc.roundedRect(margin, y + 2, 182, 22, 3, 3, "F");
    textAccent(ctx);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.text("NET À PAYER", 105, y + 10, { align: "center" });
    doc.setFontSize(16);
    doc.text(`${formatMoney(ctx.netToPay)} MAD`, 105, y + 19, { align: "center" });
    y += 28;
  }
  footerOnDarkBand(ctx, y, 268);
}

function renderCorporate(ctx: PdfRenderContext) {
  const { doc, margin, label, number, sellerName, sellerActivity, sellerAddress } = ctx;

  let y = margin;
  const hasLogo = !!ctx.logoDataUrl;
  const logo = drawLogo(ctx, margin, y, hasLogo ? 48 : 28, hasLogo ? 32 : 20);

  // Large document title on the right
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  textRgb(doc, [51, 65, 85]);
  doc.text(label.toUpperCase(), 196, y + 8, { align: "right" });

  if (!hasLogo) {
    doc.setFontSize(11);
    textPrimaryDark(ctx);
    doc.text(sellerName, margin, y + logo.h + 6);
    let ty = y + logo.h + 11;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    if (sellerActivity) {
      textRgb(doc, [100, 116, 139]);
      doc.text(sellerActivity, margin, ty);
      ty += 4;
    }
    if (sellerAddress) {
      textRgb(doc, [100, 116, 139]);
      const addrLines = doc.splitTextToSize(sellerAddress, 95);
      doc.text(addrLines, margin, ty);
      y = ty + addrLines.length * 3.8 + 6;
    } else {
      y = ty + 6;
    }
  } else if (sellerAddress) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    textRgb(doc, [100, 116, 139]);
    const addrLines = doc.splitTextToSize(sellerAddress, 95);
    doc.text(addrLines, margin, y + logo.h + 5);
    y = y + logo.h + 5 + addrLines.length * 3.6 + 6;
  } else {
    y = y + Math.max(logo.h, 14) + 10;
  }

  y = Math.max(y, margin + 36);

  // Bill To (left) + meta (right)
  const metaX = 130;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  textRgb(doc, [15, 23, 42]);
  doc.text(`${ctx.counterpartyLabel} :`, margin, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(ctx.counterpartyName || "—", margin, y + 5);
  let leftY = y + 10;
  if (ctx.counterpartyIce) {
    doc.setFontSize(7.5);
    textRgb(doc, [100, 116, 139]);
    doc.text(`ICE : ${ctx.counterpartyIce}`, margin, leftY);
    leftY += 4;
  }
  const partyAddr = [ctx.counterpartyAddress, ctx.counterpartyCity].filter(Boolean).join(", ");
  if (partyAddr) {
    doc.setFontSize(7.5);
    textRgb(doc, [100, 116, 139]);
    const addr = doc.splitTextToSize(partyAddr, 100);
    doc.text(addr, margin, leftY);
    leftY += addr.length * 3.5;
  }

  doc.setFontSize(8);
  textRgb(doc, [100, 116, 139]);
  doc.text("N°", metaX, y);
  doc.text("Date", metaX, y + 6);
  if (ctx.dueDateFormatted) doc.text("Échéance", metaX, y + 12);
  doc.setFont("helvetica", "bold");
  textRgb(doc, [15, 23, 42]);
  doc.text(number, 196, y, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.text(ctx.dateFormatted, 196, y + 6, { align: "right" });
  if (ctx.dueDateFormatted) doc.text(ctx.dueDateFormatted, 196, y + 12, { align: "right" });

  y = Math.max(leftY, y + (ctx.dueDateFormatted ? 18 : 12)) + 6;

  y = drawSpreadsheetTable(ctx, y, { headRgb: [17, 24, 39] });

  if (!ctx.delivery) {
    y = drawTotalsMinimalRight(ctx, y + 4);
  }
  y = drawNotes(ctx, y + 2);
  finishLayout(ctx, y);
}

function renderFresh(ctx: PdfRenderContext) {
  const { doc, margin, label, number, sellerName, sellerActivity, theme } = ctx;
  fillSurface(ctx);
  doc.rect(0, 0, 210, 297, "F");
  fillRgb(doc, [255, 255, 255]);
  doc.rect(0, 120, 210, 177, "F");

  let y = margin;
  doc.setFillColor(255, 255, 255);
  strokeRgb(doc, hexToRgb(theme.surfaceBorder));
  doc.roundedRect(margin, y, 182, 24, 4, 4, "FD");
  const logo = drawLogo(ctx, margin + 3, y + 3, 24, 18);
  textPrimaryDark(ctx);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(sellerName, margin + (logo.w ? logo.w + 6 : 3), y + 10);
  if (sellerActivity) {
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    textRgb(doc, theme.primaryRgb);
    doc.text(sellerActivity, margin + (logo.w ? logo.w + 6 : 3), y + 15);
  }
  fillSurface(ctx);
  doc.roundedRect(150, y + 7, 40, 10, 5, 5, "F");
  textPrimaryDark(ctx);
  doc.setFontSize(7);
  doc.text(label, 170, y + 13.5, { align: "center" });
  y += 28;

  strokeRgb(doc, hexToRgb(theme.surfaceBorder));
  doc.roundedRect(margin, y, 88, 16, 3, 3);
  fillPrimary(ctx);
  doc.roundedRect(margin + 94, y, 88, 16, 3, 3, "F");
  drawCounterpartyTag(ctx, margin + 3, y + 4);
  textOnPrimary(ctx);
  doc.setFontSize(7);
  doc.text("Document", margin + 97, y + 5);
  doc.setFont("helvetica", "bold");
  doc.text(`#${number}`, margin + 97, y + 9);
  doc.setFont("helvetica", "normal");
  doc.text(ctx.dateFormatted, margin + 97, y + 13);
  y += 20;

  y = drawFreshLineCards(ctx, y);
  if (!ctx.delivery) {
    y = drawTotalsFreshCenter(ctx, y + 2);
  }
  y = drawNotes(ctx, y);
  finishLayout(ctx, y);
}

function renderWarm(ctx: PdfRenderContext) {
  const { doc, margin, label, number, sellerName, sellerActivity, theme } = ctx;
  fillMuted(ctx);
  doc.rect(0, 0, 210, 297, "F");
  let y = margin;
  const logo = drawLogo(ctx, margin, y - 1, 36, 24);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  textPrimaryDark(ctx);
  doc.text(sellerName, margin + (logo.w ? logo.w + 3 : 0), y);
  y += sellerActivity ? 6 : 4;
  if (sellerActivity) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.text(sellerActivity, margin, y);
    y += 5;
  }
  strokeRgb(doc, theme.primaryRgb);
  doc.setLineWidth(1);
  doc.line(margin, y, 196, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  textRgb(doc, [71, 85, 105]);
  doc.text(`${label} · ${ctx.dateFormatted} · N° ${number}`, margin, y);
  y += 8;

  strokeRgb(doc, theme.primaryRgb);
  doc.setLineWidth(2);
  doc.line(margin, y, margin, y + 16);
  fillMuted(ctx);
  doc.rect(margin, y, 182, 16, "F");
  strokeRgb(doc, theme.primaryRgb);
  doc.line(margin, y, margin, y + 16);
  drawCounterpartyTag(ctx, margin + 6, y + 2);
  y += 22;

  y = drawWarmLines(ctx, y);
  if (!ctx.delivery) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    textRgb(doc, [71, 85, 105]);
    doc.text(`TTC ${formatMoney(ctx.totalTtc)}`, 160, y + 4, { align: "right" });
    fillPrimary(ctx);
    doc.circle(186, y + 8, 10, "F");
    textOnPrimary(ctx);
    doc.setFontSize(5);
    doc.text("NET", 186, y + 5, { align: "center" });
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.text(formatMoney(ctx.netToPay), 186, y + 10, { align: "center" });
    y += 18;
  }
  y = drawNotes(ctx, y);
  finishLayout(ctx, y);
}

function withMargin(ctx: PdfRenderContext, margin: number): PdfRenderContext {
  return { ...ctx, margin };
}

/** Totals block — Sous-total / TVA / Total TTC (Stripe & Ocean preview) */
function drawTotalsColumn(ctx: PdfRenderContext, y: number, rightX = 196, width = 100) {
  const { doc, totalHt, vatAmount, vatRate, netToPay } = ctx;
  const x = rightX - width;
  let cy = y;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  textRgb(doc, [17, 24, 39]);

  const rows: [string, string][] = [
    ["Sous-total HT", formatMoney(totalHt)],
    [`TVA ${vatRate}%`, formatMoney(vatAmount)],
  ];
  for (const [label, val] of rows) {
    strokeRgb(doc, [226, 232, 240]);
    doc.line(x, cy, rightX, cy);
    doc.text(label, x + 2, cy + 4.5);
    doc.text(val, rightX - 2, cy + 4.5, { align: "right" });
    cy += 6;
  }

  fillPrimary(ctx);
  textOnPrimary(ctx);
  doc.rect(x, cy, width, 8, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("Total TTC", x + 2, cy + 5.5);
  doc.text(`${formatMoney(netToPay)} MAD`, rightX - 2, cy + 5.5, { align: "right" });
  return cy + 12;
}

/** Right-aligned HT / TVA / Net — Minimal & Studio previews */
function drawTotalsMinimalRight(ctx: PdfRenderContext, y: number) {
  const { doc, margin, totalHt, vatAmount, netToPay, theme } = ctx;
  y = drawAdjustments(ctx, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  textRgb(doc, [115, 115, 115]);
  const rows: [string, string][] = [
    ["Total HT", formatMoney(totalHt)],
    ["TVA", formatMoney(vatAmount)],
  ];
  for (const [label, val] of rows) {
    doc.text(label, margin + 90, y, { align: "right" });
    doc.text(val, 196, y, { align: "right" });
    y += 5;
  }
  strokeRgb(doc, theme.primaryDarkRgb);
  doc.setLineWidth(0.6);
  doc.line(margin + 90, y, 196, y);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  textRgb(doc, [17, 24, 39]);
  doc.text("Net à payer", margin + 90, y + 5, { align: "right" });
  doc.text(formatMoney(netToPay), 196, y + 5, { align: "right" });
  return y + 12;
}

/** Interim preview — right-aligned rows + TOTAL bar */
function drawTotalsInterim(ctx: PdfRenderContext, y: number) {
  const { doc, totalHt, vatAmount, netToPay } = ctx;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  textRgb(doc, [107, 114, 128]);
  const valX = 196;
  const labelX = valX - 24;
  for (const [label, val] of [
    ["Sous-total", formatMoney(totalHt)],
    ["TVA", formatMoney(vatAmount)],
  ] as const) {
    doc.text(label, labelX, y, { align: "right" });
    doc.text(val, valX, y, { align: "right" });
    y += 5;
  }
  y += 2;
  fillPrimaryDark(ctx);
  textOnPrimary(ctx);
  doc.roundedRect(120, y, 76, 10, 1, 1, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("TOTAL", 168, y + 6.5, { align: "right" });
  doc.text(`${formatMoney(netToPay)} MAD`, valX, y + 6.5, { align: "right" });
  return y + 14;
}

/** Corporate preview — 4-cell totals grid */
function drawTotalsCorporateGrid(ctx: PdfRenderContext, y: number) {
  const { doc, margin, totalHt, vatAmount, netToPay, theme } = ctx;
  const w = 182;
  const cw = w / 4;
  fillSurface(ctx);
  strokeRgb(doc, hexToRgb(theme.surfaceBorder));
  doc.rect(margin, y, cw * 2, 10);
  doc.rect(margin + cw * 2, y, cw, 10);
  doc.rect(margin + cw * 3, y, cw, 10);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  textRgb(doc, [15, 23, 42]);
  doc.text("Total HT", margin + 2, y + 4);
  doc.text(formatMoney(totalHt), margin + cw * 2 - 2, y + 4, { align: "right" });
  doc.text("TVA", margin + cw * 2 + 2, y + 4);
  doc.text(formatMoney(vatAmount), margin + cw * 4 - 2, y + 4, { align: "right" });
  y += 10;
  fillPrimaryDark(ctx);
  textOnPrimary(ctx);
  doc.rect(margin, y, cw * 3, 12, "F");
  doc.rect(margin + cw * 3, y, cw, 12, "F");
  doc.setFontSize(8);
  doc.text("NET À PAYER", margin + 2, y + 7);
  doc.setFontSize(10);
  doc.text(formatMoney(netToPay), margin + cw * 4 - 2, y + 8, { align: "right" });
  return y + 16;
}

/** Bluepro preview — right column totals */
function drawTotalsBlueproRight(ctx: PdfRenderContext, y: number, x: number, width: number) {
  const { doc, totalHt, vatAmount, netToPay, theme } = ctx;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  textRgb(doc, [17, 24, 39]);
  for (const [label, val] of [
    ["Sous-total", formatMoney(totalHt)],
    ["TVA", formatMoney(vatAmount)],
  ] as const) {
    doc.text(label, x, y);
    doc.text(val, x + width, y, { align: "right" });
    y += 5;
  }
  strokeRgb(doc, theme.primaryRgb);
  doc.setLineWidth(0.8);
  doc.line(x, y, x + width, y);
  doc.setFont("helvetica", "bold");
  doc.text("Total", x, y + 5);
  doc.text(`${formatMoney(netToPay)} MAD`, x + width, y + 5, { align: "right" });
  return y + 10;
}

/** Studio preview — Solde dû pill */
function drawTotalsStudio(ctx: PdfRenderContext, y: number) {
  const { doc, totalHt, vatAmount, netToPay } = ctx;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  textRgb(doc, [17, 24, 39]);
  const valX = 196;
  for (const [label, val] of [
    ["Sous-total", formatMoney(totalHt)],
    ["TVA", formatMoney(vatAmount)],
  ] as const) {
    doc.text(label, valX - 40, y, { align: "right" });
    doc.text(val, valX, y, { align: "right" });
    y += 5;
  }
  y += 2;
  const pillW = 52;
  const pillX = valX - pillW;
  fillPrimary(ctx);
  doc.roundedRect(pillX, y, pillW, 9, 2, 2, "F");
  textOnPrimary(ctx);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("Solde dû", pillX + 2, y + 6);
  doc.text(formatMoney(netToPay), valX, y + 6, { align: "right" });
  return y + 14;
}

/** Geometric preview — dark NET box */
function drawTotalsGeometric(ctx: PdfRenderContext, y: number) {
  const { doc, netToPay } = ctx;
  fillRgb(doc, [17, 24, 39]);
  doc.roundedRect(128, y, 68, 14, 2, 2, "F");
  textRgb(doc, [255, 255, 255]);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6);
  doc.text("Net à payer", 162, y + 4, { align: "center" });
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(`${formatMoney(netToPay)} MAD`, 162, y + 11, { align: "center" });
  return y + 18;
}

/** Fresh preview — centered gradient TTC / Net */
function drawTotalsFreshCenter(ctx: PdfRenderContext, y: number) {
  const { doc, margin, totalTtc, netToPay, theme } = ctx;
  const w = 142;
  const h = 22;
  const x = margin + 20;
  drawHorizontalGradient(doc, x, y, w, h, theme.primaryRgb, theme.primaryDarkRgb);
  textOnPrimary(ctx);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.text("TOTAL TTC", 105, y + 6, { align: "center" });
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(formatMoney(totalTtc), 105, y + 12, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.text(`Net : ${formatMoney(netToPay)} MAD`, 105, y + 18, { align: "center" });
  return y + h + 4;
}

/** Executive preview — Description / Qté / Montant table */
function drawExecutiveTable(ctx: PdfRenderContext, y: number) {
  const { doc, margin, delivery, lines, vatRate, theme } = ctx;
  strokeRgb(doc, theme.primaryDarkRgb);
  doc.setLineWidth(0.5);
  doc.line(margin, y, 196, y);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  textRgb(doc, theme.primaryDarkRgb);
  doc.text("DESCRIPTION", margin + 2, y + 5);
  doc.text("QTÉ", margin + 120, y + 5);
  if (!delivery) doc.text("MONTANT", 194, y + 5, { align: "right" });
  y += 8;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  textRgb(doc, [17, 24, 39]);
  for (const line of lines) {
    if (y > 258) {
      doc.addPage();
      y = margin;
    }
    if (line.isNote) {
      doc.setFont("helvetica", "italic");
      textRgb(doc, [120, 113, 108]);
      doc.text(doc.splitTextToSize(line.designation, 175), margin + 2, y + 4);
      doc.setFont("helvetica", "normal");
      textRgb(doc, [17, 24, 39]);
      y += 8;
      continue;
    }
    doc.text(line.designation.slice(0, 48), margin + 2, y + 4);
    doc.text(`${line.qty} ${line.unit}`, margin + 120, y + 4);
    if (!delivery) {
      doc.text(formatMoney(lineTtc(line.qty, line.unitPriceHt, vatRate)), 194, y + 4, {
        align: "right",
      });
    }
    strokeRgb(doc, [241, 245, 249]);
    doc.line(margin, y + 9, 196, y + 9);
    y += 11;
  }
  return y;
}

function finishLayout(ctx: PdfRenderContext, contentEndY: number, footerY = 285) {
  footerLegal(ctx, footerY, contentEndY);
}

function footerOnDarkBand(ctx: PdfRenderContext, contentEndY: number, bandY = 276) {
  fillPrimaryDark(ctx);
  ctx.doc.rect(0, bandY, 210, 297 - bandY, "F");
  drawCachet(ctx, contentEndY);
  const lines = buildSellerFooterLines({
    sellerPhone: ctx.sellerPhone,
    sellerWebsite: ctx.sellerWebsite,
    sellerEmail: ctx.sellerEmail,
    sellerIce: ctx.sellerIce,
    sellerIf: ctx.sellerIf,
    sellerRc: ctx.sellerRc,
    sellerCnss: ctx.sellerCnss,
    sellerAddress: ctx.sellerAddress,
    sellerLegal: ctx.sellerLegal,
    sellerContact: ctx.sellerContact,
  });
  if (lines.length === 0) return;
  ctx.doc.setFont("helvetica", "normal");
  ctx.doc.setFontSize(6);
  textRgb(ctx.doc, hexToRgb(ctx.theme.onPrimary));
  let fy = bandY + 6;
  for (const fl of lines) {
    const wrapped = ctx.doc.splitTextToSize(fl.toUpperCase(), 182);
    ctx.doc.text(wrapped, 105, fy, { align: "center" });
    fy += wrapped.length * 3.2;
  }
}

function footerInGradientBand(ctx: PdfRenderContext, contentEndY: number) {
  const bandY = 276;
  drawHorizontalGradient(
    ctx.doc,
    0,
    bandY,
    210,
    297 - bandY,
    ctx.theme.primaryRgb,
    ctx.theme.primaryDarkRgb,
  );
  drawCachet(ctx, contentEndY);
  const lines = buildSellerFooterLines({
    sellerPhone: ctx.sellerPhone,
    sellerWebsite: ctx.sellerWebsite,
    sellerEmail: ctx.sellerEmail,
    sellerIce: ctx.sellerIce,
    sellerIf: ctx.sellerIf,
    sellerRc: ctx.sellerRc,
    sellerCnss: ctx.sellerCnss,
    sellerAddress: ctx.sellerAddress,
    sellerLegal: ctx.sellerLegal,
    sellerContact: ctx.sellerContact,
  });
  if (lines.length === 0) return;
  ctx.doc.setFont("helvetica", "normal");
  ctx.doc.setFontSize(6);
  textOnPrimary(ctx);
  let fy = bandY + 6;
  for (const fl of lines) {
    const wrapped = ctx.doc.splitTextToSize(fl.toUpperCase(), 182);
    ctx.doc.text(wrapped, 105, fy, { align: "center" });
    fy += wrapped.length * 3.2;
  }
}

function drawClientEmitterBlock(ctx: PdfRenderContext, left: number, y: number, colW: number) {
  const { doc } = ctx;
  const addrLine = [ctx.counterpartyAddress, ctx.counterpartyCity].filter(Boolean).join(", ");
  const emitterX = left + colW + 4;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  textRgb(doc, [156, 163, 175]);
  doc.text(ctx.counterpartyLabel.toUpperCase(), left, y);
  doc.text("ÉMETTEUR", emitterX, y, { align: "right" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  textRgb(doc, [15, 23, 42]);
  doc.text(ctx.counterpartyName || "—", left, y + 5);
  doc.text(ctx.sellerName, emitterX, y + 5, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  textRgb(doc, [107, 114, 128]);
  let ly = y + 10;
  if (ctx.counterpartyRepresentative?.trim()) {
    doc.text(`Représentée par ${ctx.counterpartyRepresentative.trim()}`, left, ly);
    ly += 4;
  }
  if (addrLine) {
    doc.text(addrLine, left, ly);
  }
  if (ctx.sellerAddress) {
    doc.text(ctx.sellerAddress, emitterX, y + 10, { align: "right" });
  }
}

function renderStripe(ctx: PdfRenderContext) {
  const { doc, margin, label, number, dateFormatted, dueDateFormatted } = ctx;
  const barW = 8.4;
  const left = margin + barW + 2;
  const colW = 78;

  fillPrimaryDark(ctx);
  doc.rect(margin - 2, 0, barW, 297, "F");

  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  textRgb(doc, [229, 231, 235]);
  doc.text(label.toUpperCase(), 196, margin + 2, { align: "right" });

  let y = margin;
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  textRgb(doc, [107, 114, 128]);
  let meta = `N° ${number} · ${dateFormatted}`;
  if (dueDateFormatted) meta += ` · Éch. ${dueDateFormatted}`;
  doc.text(meta, left, y);
  y += 9;

  drawClientEmitterBlock(ctx, left, y, colW);
  y += 22;

  y = drawSpreadsheetTable(withMargin(ctx, left), y);
  if (!ctx.delivery) {
    const totalsW = (196 - left) * 0.55;
    y = drawTotalsColumn(ctx, y + 2, 196, totalsW);
  }
  y = drawNotes(withMargin(ctx, left), y);
  finishLayout(ctx, y);
}

function renderOcean(ctx: PdfRenderContext) {
  const { doc, margin, label, number, sellerName } = ctx;
  const sidebarW = 29;
  const left = sidebarW + 4;
  const tableMargin = 10;

  fillPrimaryDark(ctx);
  doc.rect(0, 0, sidebarW, 297, "F");
  textOnPrimary(ctx);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text(label.toUpperCase(), sidebarW / 2, 140, { angle: 90, align: "center" });

  let y = margin;
  const logo = drawLogo(ctx, left, y - 1, 36, 24);
  textPrimaryDark(ctx);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(sellerName, left + (logo.w ? logo.w + 3 : 0), y + 2);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  textRgb(doc, ctx.theme.primaryRgb);
  doc.text(ctx.dateFormatted, left + (logo.w ? logo.w + 3 : 0), y + 8);

  fillPrimary(ctx);
  doc.circle(188, y + 4, 9, "F");
  fillMuted(ctx);
  doc.circle(188, y + 4, 11, "S");
  textOnPrimary(ctx);
  doc.setFontSize(5.5);
  doc.text("N°", 188, y + 2, { align: "center" });
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");
  doc.text(number.split("/")[0] ?? number, 188, y + 7, { align: "center" });

  fillSurface(ctx);
  strokeRgb(doc, hexToRgb(ctx.theme.surfaceBorder));
  doc.roundedRect(left, y + 14, 120, 16, 2, 2, "FD");
  drawCounterpartyTag(ctx, left + 2, y + 16);

  y += 34;
  y = drawSpreadsheetTable(withMargin(ctx, tableMargin), y);
  if (!ctx.delivery) {
    const totalsW = (196 - tableMargin) * 0.55;
    y = drawTotalsColumn(ctx, y + 2, 196, totalsW);
  }
  y = drawNotes(withMargin(ctx, tableMargin), y);
  finishLayout(ctx, y);
}

function renderSlate(ctx: PdfRenderContext) {
  const { doc, margin, label, counterpartyName, counterpartyAddress, counterpartyCity, vatRate, lines } =
    ctx;
  let y = margin;
  const logo = drawLogo(ctx, margin, y - 1, 36, 24);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  textPrimaryDark(ctx);
  doc.text(ctx.sellerName, margin + (logo.w ? logo.w + 3 : 0), y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(`${ctx.dateFormatted}\nRéf. ${ctx.number}`, 196, y, { align: "right" });
  y += 14;

  textPrimaryDark(ctx);
  doc.setLineWidth(1.2);
  strokeRgb(doc, ctx.theme.primaryDarkRgb);
  doc.line(margin, y, margin, y + 16);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.text("FACTURÉ À", margin + 4, y + 4);
  doc.setFontSize(10);
  textRgb(doc, [15, 23, 42]);
  doc.text(counterpartyName, margin + 4, y + 10);
  const addr = [counterpartyAddress, counterpartyCity].filter(Boolean).join(", ");
  if (addr) {
    doc.setFontSize(8);
    doc.text(addr, margin + 4, y + 15);
  }
  y += 22;

  doc.setFontSize(9);
  doc.text(`Objet : ${label}`, margin, y);
  y += 8;

  doc.setFont("helvetica", "normal");
  let n = 1;
  for (const line of lines) {
    if (line.isNote) {
      doc.setFont("helvetica", "italic");
      doc.text(line.designation, margin + 4, y, { maxWidth: 175 });
      y += 8;
      doc.setFont("helvetica", "normal");
      continue;
    }
    const suffix = ctx.delivery
      ? `— ${line.qty} ${line.unit}`
      : `— ${formatMoney(lineTtc(line.qty, line.unitPriceHt, vatRate))} TTC`;
    doc.text(`${n}. ${line.designation} ${suffix}`, margin + 4, y, { maxWidth: 175 });
    y += 8;
    n += 1;
  }

  if (!ctx.delivery) {
    y = drawAdjustments(ctx, y);
    doc.setFont("helvetica", "bold");
    doc.text(`Montant total dû : ${formatMoney(ctx.netToPay)} MAD TTC.`, margin, y + 4);
    y += 10;
  }
  y = drawNotes(ctx, y + 2);
  finishLayout(ctx, y);
}

function renderRoyal(ctx: PdfRenderContext) {
  const { doc, margin, label, number, sellerName, sellerActivity, theme } = ctx;
  const frameX = 12;
  const frameY = 12;
  const frameW = 186;
  const frameH = 273;

  strokeRgb(doc, hexToRgb(theme.surfaceBorder));
  doc.rect(frameX, frameY, frameW, frameH);
  textRgb(doc, theme.primaryRgb);
  doc.setFontSize(8);
  doc.text("◆", frameX + 2, frameY + 6);
  doc.text("◆", frameX + frameW - 2, frameY + 6, { align: "right" });
  doc.text("◆", frameX + 2, frameY + frameH - 2);
  doc.text("◆", frameX + frameW - 2, frameY + frameH - 2, { align: "right" });

  let y = 20;
  drawLogo(ctx, 105 - 12, y - 2, 24, 24);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  textPrimaryDark(ctx);
  doc.text(sellerName.toUpperCase(), 105, y + 14, { align: "center" });
  y += sellerActivity ? 20 : 16;
  if (sellerActivity) {
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    textRgb(doc, theme.primaryRgb);
    doc.text(sellerActivity.toUpperCase(), 105, y, { align: "center" });
    y += 6;
  }
  strokeRgb(doc, hexToRgb(theme.primaryLight));
  doc.line(81, y, 93, y);
  textRgb(doc, theme.primaryRgb);
  doc.text("✦", 105, y + 1, { align: "center" });
  doc.line(117, y, 129, y);
  y += 8;

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  textPrimaryDark(ctx);
  doc.text(label, 105, y, { align: "center" });
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  textRgb(doc, theme.primaryRgb);
  doc.text(`N° ${number} · ${ctx.dateFormatted}`, 105, y + 5, { align: "center" });
  y += 12;

  fillMuted(ctx);
  strokeRgb(doc, hexToRgb(theme.surfaceBorder));
  doc.roundedRect(margin + 16, y, 150, 16, 2, 2, "FD");
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  textRgb(doc, theme.primaryRgb);
  doc.text(ctx.counterpartyLabel.toUpperCase(), 105, y + 4, { align: "center" });
  doc.setFontSize(10);
  textPrimaryDark(ctx);
  doc.text(ctx.counterpartyName || "—", 105, y + 10, { align: "center" });
  y += 22;

  y = drawRoyalTable(ctx, y);
  if (!ctx.delivery) {
    const boxW = 140;
    const boxX = 105 - boxW / 2;
    strokeRgb(doc, theme.primaryRgb);
    doc.setLineWidth(0.8);
    doc.rect(boxX, y + 4, boxW, 18);
    doc.rect(boxX + 1.5, y + 5.5, boxW - 3, 15);
    textRgb(doc, theme.primaryRgb);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.text("NET À PAYER", 105, y + 10, { align: "center" });
    textPrimaryDark(ctx);
    doc.setFontSize(13);
    doc.text(`${formatMoney(ctx.netToPay)} MAD`, 105, y + 17, { align: "center" });
    y += 26;
  }
  finishLayout(ctx, y);
}

function renderGeometric(ctx: PdfRenderContext) {
  const { doc, margin, label, number, sellerName, sellerActivity } = ctx;
  fillRgb(doc, [245, 245, 245]);
  doc.rect(0, 0, 210, 44, "F");
  fillRgb(doc, [212, 212, 212]);
  doc.triangle(196, 0, 168, 0, 196, 28, "F");
  fillRgb(doc, [163, 163, 163]);
  doc.triangle(180, 0, 158, 0, 180, 20, "F");

  let y = margin;
  const logo = drawLogo(ctx, margin, y, 40, 28);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  textRgb(doc, [17, 24, 39]);
  doc.text(sellerName.toUpperCase(), margin + (logo.w ? logo.w + 3 : 0), y + 6);
  if (sellerActivity) {
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    textRgb(doc, [115, 115, 115]);
    doc.text(sellerActivity, margin + (logo.w ? logo.w + 3 : 0), y + 12);
  }
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(label.toUpperCase(), 196, y, { align: "right" });
  doc.setFontSize(8);
  doc.text(`#${number}`, 196, y + 6, { align: "right" });
  y += Math.max(logo.h || 0, 14) + 6;

  const colW = 88;
  strokeRgb(doc, [229, 231, 235]);
  doc.roundedRect(margin, y, colW, 18, 2, 2);
  drawCounterpartyTag(ctx, margin + 2, y + 3);

  if (!ctx.delivery) {
    fillRgb(doc, [17, 24, 39]);
    doc.roundedRect(margin + colW + 4, y, 28, 18, 2, 2, "F");
    textRgb(doc, [255, 255, 255]);
    doc.setFontSize(5);
    doc.text("Total dû", margin + colW + 18, y + 5, { align: "center" });
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text(formatMoney(ctx.netToPay), margin + colW + 18, y + 12, { align: "center" });
  }

  const metaX = margin + colW + (ctx.delivery ? 4 : 36);
  const metaW = 182 - colW - (ctx.delivery ? 4 : 36);
  strokeRgb(doc, [229, 231, 235]);
  doc.roundedRect(metaX, y, metaW / 2 - 1, 18, 2, 2);
  doc.setFontSize(6);
  textRgb(doc, [156, 163, 175]);
  doc.text("Date", metaX + 2, y + 5);
  doc.setFontSize(7);
  textRgb(doc, [17, 24, 39]);
  doc.text(ctx.dateFormatted, metaX + 2, y + 11);
  const box2X = metaX + metaW / 2 + 1;
  doc.roundedRect(box2X, y, metaW / 2 - 1, 18, 2, 2);
  if (ctx.dueDateFormatted) {
    doc.setFontSize(6);
    textRgb(doc, [156, 163, 175]);
    doc.text("Échéance", box2X + 2, y + 5);
    doc.setFontSize(7);
    textRgb(doc, [17, 24, 39]);
    doc.text(ctx.dueDateFormatted, box2X + 2, y + 11);
  } else {
    doc.setFontSize(6);
    textRgb(doc, [156, 163, 175]);
    doc.text("N°", box2X + 2, y + 5);
    doc.setFontSize(7);
    textRgb(doc, [17, 24, 39]);
    doc.text(number, box2X + 2, y + 11);
  }
  y += 22;

  y = drawSpreadsheetTable(ctx, y, { headRgb: [17, 24, 39] });
  if (!ctx.delivery) y = drawTotalsGeometric(ctx, y + 2);
  y = drawNotes(ctx, y);
  finishLayout(ctx, y);
}

function renderGradient(ctx: PdfRenderContext) {
  const { doc, margin, label, number, sellerName, theme } = ctx;
  const headerH = 36;
  drawHorizontalGradient(doc, 0, 0, 210, headerH, theme.primaryRgb, theme.primaryDarkRgb);

  textOnPrimary(ctx);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(label.toUpperCase(), margin, 14);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(`#${number} · ${ctx.dateFormatted}`, margin, 20);
  drawLogo(ctx, 168, 6, 28, 22);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text(sellerName, 196, 30, { align: "right" });

  let y = 32;
  doc.setFillColor(255, 255, 255);
  strokeRgb(doc, [226, 232, 240]);
  doc.roundedRect(margin, y, 182, 16, 3, 3, "FD");
  textPrimaryDark(ctx);
  doc.setFontSize(6);
  doc.setFont("helvetica", "bold");
  doc.text(ctx.counterpartyLabel.toUpperCase(), margin + 3, y + 5);
  doc.setFontSize(9);
  textRgb(doc, [15, 23, 42]);
  doc.text(ctx.counterpartyName || "—", margin + 3, y + 10);
  if (ctx.counterpartyIce) {
    doc.setFontSize(7);
    textRgb(doc, [107, 114, 128]);
    doc.text(`ICE ${ctx.counterpartyIce}`, margin + 3, y + 14);
  }
  y += 20;

  strokeRgb(doc, hexToRgb(theme.surfaceBorder));
  doc.roundedRect(margin, y, 182, 2, 1, 1, "S");
  y += 1;
  y = drawSpreadsheetTable(ctx, y);
  if (!ctx.delivery) y = drawTotalsBannerGradient(ctx, y + 2);
  y = drawNotes(ctx, y + 2);
  footerInGradientBand(ctx, y);
}

function renderInterim(ctx: PdfRenderContext) {
  const { doc, margin, label, number, sellerName, sellerAddress, theme } = ctx;
  let y = margin + 2;
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  textRgb(doc, [38, 38, 38]);
  doc.text(label, 105, y, { align: "center" });
  y += 10;

  drawLogo(ctx, 168, y - 2, 28, 22);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  textRgb(doc, [17, 24, 39]);
  doc.text(sellerName, margin, y);
  if (sellerAddress) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    textRgb(doc, [107, 114, 128]);
    doc.text(sellerAddress.slice(0, 50), margin, y + 5);
  }
  y += 12;

  const colW = 88;
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  textRgb(doc, [75, 85, 99]);
  doc.text("Facturé à :", margin, y);
  doc.setFont("helvetica", "bold");
  textRgb(doc, [17, 24, 39]);
  doc.text(ctx.counterpartyName || "—", margin, y + 5);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  textRgb(doc, [107, 114, 128]);
  let ly = y + 10;
  if (ctx.counterpartyRepresentative?.trim()) {
    doc.text(`Représentée par ${ctx.counterpartyRepresentative.trim()}`, margin, ly);
    ly += 4;
  }
  const addrLine = [ctx.counterpartyAddress, ctx.counterpartyCity].filter(Boolean).join(", ");
  if (addrLine) doc.text(addrLine, margin, ly);

  doc.setFontSize(8);
  textRgb(doc, [17, 24, 39]);
  doc.text(`N° ${number}`, margin + colW + 4, y, { align: "right" });
  doc.text(`Date ${ctx.dateFormatted}`, margin + colW + 4, y + 5, { align: "right" });
  y += 18;

  y = drawSpreadsheetTable(ctx, y, { headRgb: theme.primaryDarkRgb });
  if (!ctx.delivery) y = drawTotalsInterim(ctx, y + 2);
  y = drawNotes(ctx, y);
  finishLayout(ctx, y);
}

function renderBluepro(ctx: PdfRenderContext) {
  const { doc, margin, label, number, sellerName, sellerAddress } = ctx;
  let y = margin;
  let nameX = margin;
  if (ctx.logoDataUrl) {
    const logo = drawLogo(ctx, margin, y, 28, 20);
    nameX = margin + logo.w + 3;
  } else {
    fillPrimaryDark(ctx);
    doc.roundedRect(margin, y, 12, 12, 1, 1, "F");
    nameX = margin + 15;
  }
  textPrimaryDark(ctx);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(sellerName, nameX, y + 5);
  if (sellerAddress) {
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    textRgb(doc, [107, 114, 128]);
    doc.text(sellerAddress.slice(0, 45), nameX, y + 10);
  }
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  textPrimaryDark(ctx);
  doc.text(label.toUpperCase(), 196, y, { align: "right" });
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  textRgb(doc, [17, 24, 39]);
  doc.text(`Date : ${ctx.dateFormatted}`, 196, y + 6, { align: "right" });
  doc.text(`N° : ${number}`, 196, y + 11, { align: "right" });
  y += 24;

  const halfW = 91;
  fillPrimaryDark(ctx);
  doc.rect(margin, y, halfW, 6, "F");
  doc.rect(margin + halfW, y, halfW, 6, "F");
  textOnPrimary(ctx);
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.text("Facturé à", margin + 2, y + 4.5);
  doc.text(ctx.counterpartyLabel.toUpperCase(), margin + halfW + 2, y + 4.5);
  strokeRgb(doc, [229, 231, 235]);
  doc.rect(margin, y + 6, halfW, 16);
  doc.rect(margin + halfW, y + 6, halfW, 16);
  doc.setFont("helvetica", "bold");
  textRgb(doc, [17, 24, 39]);
  doc.setFontSize(8);
  doc.text(ctx.counterpartyName || "—", margin + 2, y + 11);
  doc.text(ctx.counterpartyName || "—", margin + halfW + 2, y + 11);
  if (ctx.counterpartyIce) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.text(`ICE : ${ctx.counterpartyIce}`, margin + halfW + 2, y + 16);
  }
  y += 24;

  y = drawSpreadsheetTable(ctx, y);
  if (!ctx.delivery) {
    const blockY = y + 2;
    let contentEnd = blockY;
    if (ctx.notes?.trim()) {
      contentEnd = drawNotes(ctx, blockY, { x: margin, maxWidth: 88 });
    }
    contentEnd = Math.max(contentEnd, drawTotalsBlueproRight(ctx, blockY, margin + 96, 86));
    y = contentEnd;
  } else {
    y = drawNotes(ctx, y);
  }
  finishLayout(ctx, y);
}

function renderStudio(ctx: PdfRenderContext) {
  const { doc, margin, label, number, sellerName, theme } = ctx;
  let y = margin;
  let nameX = margin;
  if (ctx.logoDataUrl) {
    const logo = drawLogo(ctx, margin, y, 32, 22);
    nameX = margin + logo.w + 3;
  } else if (sellerName.trim()) {
    fillPrimary(ctx);
    doc.roundedRect(margin, y, 22, 14, 1, 1, "F");
    const initials = sellerName.slice(0, 2).toUpperCase();
    textOnPrimary(ctx);
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.text(initials, margin + 11, y + 9, { align: "center" });
    nameX = margin + 26;
  }
  if (sellerName.trim()) {
    doc.setFontSize(10);
    textRgb(doc, [17, 24, 39]);
    doc.setFont("helvetica", "bold");
    doc.text(sellerName.toUpperCase(), nameX, y + 8);
  }
  y += 26;

  strokeRgb(doc, theme.primaryRgb);
  doc.setLineWidth(0.8);
  doc.line(margin, y, 196, y);
  doc.setFontSize(11);
  doc.text(label.toUpperCase(), margin, y + 5);
  y += 10;

  const colW = 88;
  doc.setFontSize(7);
  textRgb(doc, [107, 114, 128]);
  doc.setFont("helvetica", "bold");
  doc.text("FACTURÉ À :", margin, y);
  doc.setFontSize(8);
  textRgb(doc, [17, 24, 39]);
  doc.text(ctx.counterpartyName || "—", margin, y + 5);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  textRgb(doc, [75, 85, 99]);
  doc.text(`N° ${number}`, margin + colW + 4, y, { align: "right" });
  doc.text(`Date : ${ctx.dateFormatted}`, margin + colW + 4, y + 5, { align: "right" });
  if (ctx.dueDateFormatted) {
    doc.text(`Échéance : ${ctx.dueDateFormatted}`, margin + colW + 4, y + 10, { align: "right" });
  }
  y += 14;

  strokeRgb(doc, theme.primaryRgb);
  doc.setLineWidth(0.8);
  doc.line(margin, y, 196, y);
  y += 2;
  y = drawSpreadsheetTable(ctx, y, { minimalHead: true, margin });
  if (!ctx.delivery) y = drawTotalsStudio(ctx, y + 2);
  y = drawNotes(ctx, y);
  strokeRgb(doc, theme.primaryRgb);
  doc.setLineWidth(0.8);
  doc.line(margin, 278, 196, 278);
  finishLayout(ctx, y);
}

function paymentTermsLabelPdf(date?: string, dueDate?: string): string {
  if (!date || !dueDate) return "—";
  const start = new Date(`${date}T12:00:00`);
  const end = new Date(`${dueDate}T12:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return "—";
  const days = Math.round((end.getTime() - start.getTime()) / 86_400_000);
  if (days <= 0) return "Comptant";
  return `Net ${days}`;
}

function renderLedger(ctx: PdfRenderContext) {
  const { doc, margin, label, number, sellerName, sellerActivity, sellerAddress, theme } = ctx;

  let y = margin;
  const hasLogo = !!ctx.logoDataUrl;
  const logo = drawLogo(ctx, margin, y, hasLogo ? 42 : 28, hasLogo ? 28 : 20);

  // Company block — top right
  const rightX = 196;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  textRgb(doc, [15, 23, 42]);
  doc.text(sellerName, rightX, y + 4, { align: "right" });
  let rightY = y + 9;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  textRgb(doc, [100, 116, 139]);
  if (sellerActivity) {
    doc.text(sellerActivity, rightX, rightY, { align: "right" });
    rightY += 4;
  }
  if (sellerAddress) {
    const addrLines = doc.splitTextToSize(sellerAddress, 95);
    for (const line of addrLines) {
      doc.text(line, rightX, rightY, { align: "right" });
      rightY += 3.6;
    }
  }

  y = Math.max(y + Math.max(logo.h, 14) + 8, rightY + 6);

  // Centered document title
  doc.setFont("helvetica", "normal");
  doc.setFontSize(14);
  textRgb(doc, [71, 85, 105]);
  doc.text(label.toUpperCase(), 105, y, { align: "center" });
  y += 10;

  // Bill To + Invoice #
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  textRgb(doc, [100, 116, 139]);
  doc.text(`${ctx.counterpartyLabel}`, margin, y);
  doc.text("N°", rightX, y, { align: "right" });
  y += 5;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  textRgb(doc, [15, 23, 42]);
  doc.text(ctx.counterpartyName || "—", margin, y);
  doc.text(number, rightX, y, { align: "right" });
  let leftY = y + 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  textRgb(doc, [100, 116, 139]);
  if (ctx.counterpartyIce) {
    doc.text(`ICE : ${ctx.counterpartyIce}`, margin, leftY);
    leftY += 3.8;
  }
  const partyAddr = [ctx.counterpartyAddress, ctx.counterpartyCity].filter(Boolean).join(", ");
  if (partyAddr) {
    const addr = doc.splitTextToSize(partyAddr, 100);
    doc.text(addr, margin, leftY);
    leftY += addr.length * 3.5;
  }
  y = Math.max(leftY, y + 6) + 6;

  // Date / Terms / Due banner
  const bannerH = 8;
  const colW = 182 / 3;
  fillPrimaryDark(ctx);
  doc.rect(margin, y, 182, bannerH, "F");
  textOnPrimary(ctx);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.text("DATE", margin + 2, y + 5.2);
  doc.text("CONDITIONS", margin + colW + colW / 2, y + 5.2, { align: "center" });
  doc.text("ÉCHÉANCE", rightX - 2, y + 5.2, { align: "right" });
  y += bannerH;

  strokeRgb(doc, [226, 232, 240]);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.4);
  doc.rect(margin, y, 182, 10);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  textRgb(doc, [15, 23, 42]);
  doc.text(ctx.dateFormatted, margin + 2, y + 6.5);
  doc.text(paymentTermsLabelPdf(ctx.date, ctx.dueDate), margin + colW + colW / 2, y + 6.5, {
    align: "center",
  });
  doc.text(ctx.dueDateFormatted ?? "—", rightX - 2, y + 6.5, { align: "right" });
  y += 14;

  y = drawSpreadsheetTable(ctx, y, { headRgb: theme.primaryDarkRgb });

  if (!ctx.delivery) {
    // Thank-you left + totals right
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    textRgb(doc, [100, 116, 139]);
    doc.text("Merci pour votre confiance.", margin, y + 6);
    y = drawTotalsMinimalRight(ctx, y + 2);
  }

  y = drawNotes(ctx, y + 2);
  finishLayout(ctx, y);
}

function drawFolioSoftTable(ctx: PdfRenderContext, y: number) {
  const { doc, margin, delivery, lines, vatRate } = ctx;
  const tableW = 196 - margin;
  const colNum = 8;
  const colQty = 18;
  const colAmt = delivery ? 0 : 28;
  const colDesc = tableW - colNum - colQty - colAmt;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  textRgb(doc, [148, 163, 184]);
  doc.text("#", margin, y);
  doc.text("ARTICLE & DESCRIPTION", margin + colNum, y);
  doc.text("QTÉ", margin + colNum + colDesc + colQty - 2, y, { align: "right" });
  if (!delivery) {
    doc.text("MONTANT", 196, y, { align: "right" });
  }
  y += 2;
  strokeRgb(doc, [203, 213, 225]);
  doc.setLineWidth(0.35);
  doc.line(margin, y, 196, y);
  y += 5;

  const billable = lines.filter((l) => !l.isNote);
  billable.forEach((line, i) => {
    if (y > 255) {
      doc.addPage();
      y = margin + 8;
    }
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    textRgb(doc, [148, 163, 184]);
    doc.text(String(i + 1), margin, y);
    doc.setFont("helvetica", "bold");
    textRgb(doc, [15, 23, 42]);
    const designationLines = doc.splitTextToSize(line.designation || "—", colDesc - 2);
    doc.text(designationLines[0] ?? "—", margin + colNum, y);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    textRgb(doc, [71, 85, 105]);
    doc.text(String(line.qty), margin + colNum + colDesc + colQty - 2, y, { align: "right" });
    if (!delivery) {
      doc.setFont("helvetica", "bold");
      textRgb(doc, [15, 23, 42]);
      doc.text(formatMoney(lineTotalTtc(line.qty, line.unitPriceHt, vatRate)), 196, y, {
        align: "right",
      });
    }
    let rowH = Math.max(5, designationLines.length * 3.6);
    if (!delivery) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      textRgb(doc, [148, 163, 184]);
      doc.text(
        `${line.qty} × ${formatMoney(line.unitPriceHt)}`,
        margin + colNum,
        y + 4,
      );
      rowH = Math.max(rowH, 8);
    }
    if (designationLines.length > 1) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      textRgb(doc, [15, 23, 42]);
      doc.setFont("helvetica", "bold");
      for (let li = 1; li < designationLines.length; li++) {
        doc.text(designationLines[li], margin + colNum, y + li * 3.6);
      }
    }
    y += rowH + 2;
    strokeRgb(doc, [241, 245, 249]);
    doc.setLineWidth(0.25);
    doc.line(margin, y - 1, 196, y - 1);
  });

  return y + 2;
}

function drawTotalsFolioBox(ctx: PdfRenderContext, y: number) {
  const { doc, totalHt, vatAmount, netToPay, vatRate } = ctx;
  const boxX = 118;
  const boxW = 78;
  y = drawAdjustments(ctx, y);

  fillRgb(doc, [243, 244, 246]);
  doc.rect(boxX, y, boxW, 28, "F");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  textRgb(doc, [100, 116, 139]);
  let cy = y + 6;
  doc.text("Sous-total", boxX + 3, cy);
  textRgb(doc, [15, 23, 42]);
  doc.text(formatMoney(totalHt), boxX + boxW - 3, cy, { align: "right" });
  cy += 5;
  textRgb(doc, [100, 116, 139]);
  doc.text(`TVA (${vatRate}%)`, boxX + 3, cy);
  textRgb(doc, [15, 23, 42]);
  doc.text(formatMoney(vatAmount), boxX + boxW - 3, cy, { align: "right" });
  cy += 6;
  doc.setFont("helvetica", "bold");
  doc.text("Total", boxX + 3, cy);
  doc.text(formatMoney(netToPay), boxX + boxW - 3, cy, { align: "right" });
  cy += 5;
  doc.text("Solde dû", boxX + 3, cy);
  doc.text(formatMoney(netToPay), boxX + boxW - 3, cy, { align: "right" });
  return y + 32;
}

function renderFolio(ctx: PdfRenderContext) {
  const { doc, margin, label, number, sellerName, sellerAddress } = ctx;
  const headerH = 32;
  fillPrimary(ctx);
  doc.rect(0, 0, 210, headerH, "F");

  let logo = { w: 0, h: 0 };
  if (ctx.logoDataUrl) {
    logo = drawLogo(ctx, margin, 6, 28, 20);
  } else if (sellerName.trim()) {
    fillRgb(doc, [255, 255, 255]);
    doc.circle(margin + 8, 16, 7, "F");
    textRgb(doc, [51, 65, 85]);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text(sellerName.slice(0, 1).toUpperCase(), margin + 8, 17.5, { align: "center" });
    logo = { w: 16, h: 16 };
  }

  textOnPrimary(ctx);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(label.toUpperCase(), 105, 18, { align: "center" });

  doc.setFontSize(9);
  doc.text(sellerName, 196, 10, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  if (sellerAddress) {
    const addrLines = doc.splitTextToSize(sellerAddress, 70);
    let ay = 14.5;
    for (const line of addrLines.slice(0, 3)) {
      doc.text(line, 196, ay, { align: "right" });
      ay += 3.2;
    }
  }

  let y = headerH;
  void logo;

  if (!ctx.delivery) {
    fillRgb(doc, [243, 244, 246]);
    doc.rect(0, y, 210, 10, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    textRgb(doc, [15, 23, 42]);
    doc.text(`SOLDE DÛ   ${formatMoney(ctx.netToPay)}`, 196, y + 6.5, { align: "right" });
    y += 14;
  } else {
    y += 6;
  }

  // Client left + meta right
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  textRgb(doc, [15, 23, 42]);
  doc.text(ctx.counterpartyName || "—", margin, y);
  let leftY = y + 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  textRgb(doc, [100, 116, 139]);
  if (ctx.counterpartyIce) {
    doc.text(`ICE : ${ctx.counterpartyIce}`, margin, leftY);
    leftY += 3.8;
  }
  const partyAddr = [ctx.counterpartyAddress, ctx.counterpartyCity].filter(Boolean).join(", ");
  if (partyAddr) {
    const addr = doc.splitTextToSize(partyAddr, 90);
    doc.text(addr, margin, leftY);
    leftY += addr.length * 3.5;
  }

  const metaX = 125;
  const metaValX = 196;
  const terms = paymentTermsLabelPdf(ctx.date, ctx.dueDate);
  const metaRows: [string, string][] = [
    ["N°", number],
    ["Date", ctx.dateFormatted],
    ["Conditions", terms],
  ];
  if (ctx.dueDateFormatted) metaRows.push(["Échéance", ctx.dueDateFormatted]);

  let metaY = y;
  for (const [k, v] of metaRows) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    textRgb(doc, [148, 163, 184]);
    doc.text(k, metaX, metaY);
    doc.setFont("helvetica", "bold");
    textRgb(doc, [15, 23, 42]);
    doc.text(v, metaValX, metaY, { align: "right" });
    metaY += 5;
  }

  y = Math.max(leftY, metaY) + 8;
  y = drawFolioSoftTable(ctx, y);

  if (!ctx.delivery) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    textRgb(doc, [148, 163, 184]);
    doc.text("Merci pour votre confiance.", margin, y + 6);
    y = drawTotalsFolioBox(ctx, y);
  }

  y = drawNotes(ctx, y + 2);
  finishLayout(ctx, y);
}

function drawRubySoftTable(ctx: PdfRenderContext, y: number) {
  const { doc, margin, delivery, lines, vatRate, theme } = ctx;
  const tableW = 196 - margin;
  const colNum = 8;
  const colQty = 16;
  const colRate = delivery ? 0 : 24;
  const colAmt = delivery ? 0 : 28;
  const colDesc = tableW - colNum - colQty - colRate - colAmt;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  textRgb(doc, theme.primaryRgb);
  doc.text("#", margin, y);
  doc.text("ARTICLE & DESCRIPTION", margin + colNum, y);
  doc.text("QTÉ", margin + colNum + colDesc + colQty - 2, y, { align: "right" });
  if (!delivery) {
    doc.text("PU HT", margin + colNum + colDesc + colQty + colRate - 2, y, { align: "right" });
    doc.text("MONTANT", 196, y, { align: "right" });
  }
  y += 2.5;
  strokeRgb(doc, theme.primaryRgb);
  doc.setLineWidth(0.6);
  doc.line(margin, y, 196, y);
  y += 5;

  const billable = lines.filter((l) => !l.isNote);
  billable.forEach((line, i) => {
    if (y > 250) {
      doc.addPage();
      y = margin + 8;
    }
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    textRgb(doc, [148, 163, 184]);
    doc.text(String(i + 1), margin, y);
    doc.setFont("helvetica", "bold");
    textRgb(doc, [51, 65, 85]);
    const designationLines = doc.splitTextToSize(line.designation || "—", colDesc - 2);
    doc.text(designationLines[0] ?? "—", margin + colNum, y);
    textRgb(doc, [71, 85, 105]);
    doc.setFont("helvetica", "normal");
    doc.text(String(line.qty), margin + colNum + colDesc + colQty - 2, y, { align: "right" });
    if (!delivery) {
      doc.text(formatMoney(line.unitPriceHt), margin + colNum + colDesc + colQty + colRate - 2, y, {
        align: "right",
      });
      doc.setFont("helvetica", "bold");
      textRgb(doc, [51, 65, 85]);
      doc.text(formatMoney(lineTotalTtc(line.qty, line.unitPriceHt, vatRate)), 196, y, {
        align: "right",
      });
    }
    let rowH = Math.max(5, designationLines.length * 3.6);
    if (line.unit) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      textRgb(doc, [148, 163, 184]);
      doc.text(line.unit, margin + colNum, y + 3.8);
      rowH = Math.max(rowH, 8);
    }
    if (designationLines.length > 1) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      textRgb(doc, [51, 65, 85]);
      for (let li = 1; li < designationLines.length; li++) {
        doc.text(designationLines[li], margin + colNum, y + li * 3.6);
      }
    }
    y += rowH + 2;
    strokeRgb(doc, [241, 245, 249]);
    doc.setLineWidth(0.25);
    doc.line(margin, y - 1, 196, y - 1);
  });

  return y + 2;
}

function renderRuby(ctx: PdfRenderContext) {
  const { doc, margin, label, number, sellerName, sellerAddress, theme } = ctx;
  let y = margin;

  // Header: client left, title right
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  textRgb(doc, theme.primaryRgb);
  doc.text(ctx.counterpartyLabel, margin, y);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(label.toUpperCase(), 196, y + 2, { align: "right" });
  y += 5;
  doc.setFontSize(11);
  textRgb(doc, [51, 65, 85]);
  doc.text(ctx.counterpartyName || "—", margin, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  textRgb(doc, [148, 163, 184]);
  doc.text(number, 196, y + 1, { align: "right" });
  y += 5;
  let leftY = y;
  if (ctx.counterpartyIce) {
    doc.setFontSize(7.5);
    textRgb(doc, [148, 163, 184]);
    doc.text(`ICE : ${ctx.counterpartyIce}`, margin, leftY);
    leftY += 3.8;
  }
  const partyAddr = [ctx.counterpartyAddress, ctx.counterpartyCity].filter(Boolean).join(", ");
  if (partyAddr) {
    doc.setFontSize(7.5);
    textRgb(doc, [148, 163, 184]);
    const addr = doc.splitTextToSize(partyAddr, 95);
    doc.text(addr, margin, leftY);
    leftY += addr.length * 3.5;
  }

  y = Math.max(leftY, y + 6) + 6;

  // Meta left + balance due L-box right
  const terms = paymentTermsLabelPdf(ctx.date, ctx.dueDate);
  const metaRows: [string, string][] = [
    ["Date", ctx.dateFormatted],
    ["Conditions", terms],
  ];
  if (ctx.dueDateFormatted) metaRows.push(["Échéance", ctx.dueDateFormatted]);

  let metaY = y;
  for (const [k, v] of metaRows) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    textRgb(doc, theme.primaryRgb);
    doc.text(k, margin, metaY);
    doc.setFont("helvetica", "bold");
    textRgb(doc, [71, 85, 105]);
    doc.text(v, margin, metaY + 4.5);
    metaY += 11;
  }

  if (!ctx.delivery) {
    const boxX = 130;
    const boxW = 66;
    const boxH = 18;
    strokeRgb(doc, theme.primaryRgb);
    doc.setLineWidth(1.1);
    doc.line(boxX, y, boxX + boxW, y);
    doc.line(boxX + boxW, y, boxX + boxW, y + boxH);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    textRgb(doc, theme.primaryRgb);
    doc.text("Solde dû", boxX + boxW - 3, y + 6, { align: "right" });
    doc.setFontSize(12);
    textRgb(doc, [51, 65, 85]);
    doc.text(formatMoney(ctx.netToPay), boxX + boxW - 3, y + 13.5, { align: "right" });
  }

  y = Math.max(metaY, y + (ctx.delivery ? 0 : 22)) + 6;
  y = drawRubySoftTable(ctx, y);

  if (!ctx.delivery) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    textRgb(doc, [148, 163, 184]);
    doc.text("Merci pour votre confiance.", margin, y + 6);

    y = drawAdjustments(ctx, y);
    const rightX = 196;
    const labelX = 130;
    doc.setFontSize(8);
    const rows: [string, string, boolean?][] = [
      ["Sous-total", formatMoney(ctx.totalHt)],
      [`TVA (${ctx.vatRate}%)`, formatMoney(ctx.vatAmount)],
      ["Total", formatMoney(ctx.netToPay), true],
    ];
    for (const [k, v, bold] of rows) {
      doc.setFont("helvetica", bold ? "bold" : "normal");
      textRgb(doc, theme.primaryRgb);
      doc.text(k, labelX, y, { align: "right" });
      textRgb(doc, [51, 65, 85]);
      doc.text(v, rightX, y, { align: "right" });
      y += 5;
    }
    y += 2;
    fillPrimary(ctx);
    doc.rect(labelX - 2, y, rightX - (labelX - 2), 10, "F");
    textOnPrimary(ctx);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("Solde dû", labelX + 2, y + 6.5);
    doc.text(formatMoney(ctx.netToPay), rightX - 2, y + 6.5, { align: "right" });
    y += 14;
  }

  y = drawNotes(ctx, y + 2);

  // Seller footer under a rule
  strokeRgb(doc, [226, 232, 240]);
  doc.setLineWidth(0.35);
  doc.line(margin, y, 196, y);
  y += 5;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  textRgb(doc, [15, 23, 42]);
  doc.text(sellerName, margin, y);
  y += 4;
  if (sellerAddress) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    textRgb(doc, [148, 163, 184]);
    const addr = doc.splitTextToSize(sellerAddress, 182);
    doc.text(addr, margin, y);
    y += addr.length * 3.4;
  }

  finishLayout(ctx, y + 2);
}

export const PDF_LAYOUT_RENDERERS: Record<DocumentTemplateId, LayoutRenderer> = {
  classic: renderClassic,
  modern: renderModern,
  minimal: renderMinimal,
  executive: renderExecutive,
  corporate: renderCorporate,
  fresh: renderFresh,
  warm: renderWarm,
  ocean: renderOcean,
  slate: renderSlate,
  royal: renderRoyal,
  geometric: renderGeometric,
  stripe: renderStripe,
  gradient: renderGradient,
  interim: renderInterim,
  bluepro: renderBluepro,
  studio: renderStudio,
  ledger: renderLedger,
  folio: renderFolio,
  ruby: renderRuby,
};

export function renderPdfLayout(templateId: DocumentTemplateId, ctx: PdfRenderContext) {
  PDF_LAYOUT_RENDERERS[templateId](ctx);
}
