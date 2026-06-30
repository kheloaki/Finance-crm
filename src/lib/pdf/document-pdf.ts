import {
  buildDocumentExportModel,
  type DocumentExportInput,
} from "@/lib/document-export";
import { randomCachetPlacement } from "@/lib/document-cachet-layout";
import { renderPdfLayout, type PdfRenderContext } from "@/lib/pdf/document-pdf-layouts";
import { jsPDF } from "jspdf";

async function loadImageDataUrl(
  url: string,
): Promise<{ dataUrl: string; aspect?: number } | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    const dataUrl = await new Promise<string | null>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : null);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
    if (!dataUrl) return null;

    const aspect = await new Promise<number | undefined>((resolve) => {
      const img = new Image();
      img.onload = () => resolve(img.naturalWidth / img.naturalHeight);
      img.onerror = () => resolve(undefined);
      img.src = dataUrl;
    });

    return { dataUrl, aspect };
  } catch {
    return null;
  }
}

export async function exportDocumentPdf(input: DocumentExportInput) {
  const model = buildDocumentExportModel(input);
  const logoDataUrl = model.settings.logoUrl
    ? (await loadImageDataUrl(model.settings.logoUrl))?.dataUrl ?? null
    : null;
  const cachetLoaded =
    input.showCachet && model.settings.cachetUrl
      ? await loadImageDataUrl(model.settings.cachetUrl)
      : null;
  const cachetDataUrl = cachetLoaded?.dataUrl ?? null;
  const cachetAspect = cachetLoaded?.aspect;
  const cachetPlacement = cachetDataUrl ? randomCachetPlacement() : undefined;

  const doc = new jsPDF({ unit: "mm", format: "a4" });

  const ctx: PdfRenderContext = {
    doc,
    margin: 14,
    delivery: model.delivery,
    label: model.label,
    number: model.number,
    date: model.date,
    dateFormatted: model.dateFormatted,
    dueDateFormatted: model.dueDateFormatted,
    reference: model.reference,
    sellerName: model.settings.sellerName || "Aga Plus",
    sellerActivity: model.settings.sellerActivity || "",
    sellerAddress: model.settings.sellerAddress || "",
    sellerPhone: model.settings.sellerPhone ?? "",
    sellerWebsite: model.settings.sellerWebsite ?? "",
    sellerEmail: model.settings.sellerEmail ?? "",
    sellerIce: model.settings.sellerIce ?? "",
    sellerIf: model.settings.sellerIf ?? "",
    sellerRc: model.settings.sellerRc ?? "",
    sellerCnss: model.settings.sellerCnss ?? "",
    sellerLegal: model.settings.sellerLegal || "",
    sellerContact: model.settings.sellerContact || "",
    logoDataUrl,
    cachetDataUrl,
    cachetAspect,
    cachetPlacement,
    theme: model.theme,
    counterpartyLabel: model.counterpartyLabel,
    counterpartyName: model.counterparty.name,
    counterpartyIce: model.counterparty.ice,
    counterpartyRepresentative: model.counterparty.representative,
    counterpartyAddress: model.counterparty.address,
    counterpartyCity: model.counterparty.city,
    vatRate: model.vatRate,
    discount: model.discount,
    deposit: model.deposit,
    totalHt: model.totalHt,
    netHt: model.netHt,
    vatAmount: model.vatAmount,
    totalTtc: model.totalTtc,
    netToPay: model.netToPay,
    notes: model.notes ?? "",
    lines: model.lines.map((l) => ({
      reference: l.reference,
      designation: l.designation,
      unit: l.unit,
      qty: l.qty,
      unitPriceHt: l.unitPriceHt,
      isNote: l.isNote,
    })),
  };

  renderPdfLayout(model.templateId, ctx);

  const filename = `${model.documentType}-${model.number.replace(/\//g, "-")}.pdf`;
  doc.save(filename);
}
