import { resolveDocumentCompanySettings } from "@/lib/company-settings-display";
import { randomCachetPlacement } from "@/lib/document-cachet-layout";
import {
  buildDocumentExportModel,
  type DocumentExportInput,
} from "@/lib/document-export";
import { trimImageDataUrl } from "@/lib/image-trim";
import { renderPdfLayout, type PdfRenderContext } from "@/lib/pdf/document-pdf-layouts";
import { jsPDF } from "jspdf";

async function loadImageDataUrl(
  url: string,
  opts?: { trim?: boolean },
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

    if (opts?.trim) {
      const trimmed = await trimImageDataUrl(dataUrl);
      if (trimmed) return trimmed;
    }

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
  const company = resolveDocumentCompanySettings(model.settings);
  const logoLoaded = company.logoUrl
    ? await loadImageDataUrl(company.logoUrl, { trim: true })
    : null;
  const logoDataUrl = logoLoaded?.dataUrl ?? null;
  const logoAspect = logoLoaded?.aspect;
  const cachetLoaded =
    input.showCachet && company.cachetUrl
      ? await loadImageDataUrl(company.cachetUrl)
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
    sellerName: company.sellerName,
    sellerActivity: company.sellerActivity,
    sellerAddress: company.sellerAddress,
    sellerPhone: company.sellerPhone ?? "",
    sellerWebsite: company.sellerWebsite ?? "",
    sellerEmail: company.sellerEmail ?? "",
    sellerIce: company.sellerIce ?? "",
    sellerIf: company.sellerIf ?? "",
    sellerRc: company.sellerRc ?? "",
    sellerCnss: company.sellerCnss ?? "",
    sellerLegal: company.sellerLegal,
    sellerContact: company.sellerContact,
    logoDataUrl,
    logoAspect,
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
    showTtc: model.showTtc,
    dueAmount: model.showTtc ? model.netToPay : model.netHt,
    dueLabel: model.showTtc ? "Net à payer" : "Net HT",
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
