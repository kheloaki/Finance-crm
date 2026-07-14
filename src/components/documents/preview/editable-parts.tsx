"use client";

import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { ExternalLink } from "lucide-react";
import { CounterpartySelectWithSheet } from "@/components/documents/CounterpartySelectWithSheet";
import { LineItemsEditor } from "@/components/documents/LineItemsEditor";
import { ProjectSelect } from "@/components/projects/ProjectSelect";
import { HtTtcField } from "@/components/ui/ht-ttc-field";
import { Textarea } from "@/components/ui/input";
import { docFieldClass } from "@/lib/design";
import { isDeliveryNote } from "@/lib/documents";
import { formatMoney } from "@/lib/money";
import { hasSellerFooter } from "@/lib/seller-footer";
import { cn, formatDate } from "@/lib/utils";
import { useDocumentEdit } from "./document-edit-context";
import { accentMutedText } from "./layout-theme";
import { CounterpartyRepLine, NotesBlock, PaperFrame } from "./parts";
import type { PreviewContext } from "./types";

const VAT_PRESETS = [0, 7, 10, 14, 20];

export function EditableLayoutFrame({
  ctx,
  children,
}: {
  ctx: PreviewContext;
  children: ReactNode;
}) {
  const edit = useDocumentEdit();
  return (
    <PaperFrame ctx={ctx} variant={edit ? "editor" : "preview"}>
      {children}
    </PaperFrame>
  );
}

function FieldLabel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "mb-0.5 block text-[0.65em] font-semibold uppercase tracking-wide text-slate-400",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function LayoutCounterparty({
  ctx,
  className,
  style,
  showIce = true,
  labelClassName,
}: {
  ctx: PreviewContext;
  className?: string;
  style?: CSSProperties;
  showIce?: boolean;
  labelClassName?: string;
}) {
  const edit = useDocumentEdit();
  const counterpartyId = edit ? (edit.isSupplier ? edit.supplierId : edit.clientId) : "";

  return (
    <div className={className} style={style}>
      {edit && !edit.readOnly ? (
        <>
          <FieldLabel className={labelClassName}>{ctx.counterpartyLabel}</FieldLabel>
          <div className="mt-1 text-left">
            <CounterpartySelectWithSheet
              kind={edit.isSupplier ? "supplier" : "client"}
              clients={edit.clients}
              suppliers={edit.suppliers}
              value={counterpartyId}
              onChange={edit.isSupplier ? edit.onSupplierChange : edit.onClientChange}
              fieldClassName={docFieldClass}
            />
          </div>
        </>
      ) : (
        <>
          <p className={cn("text-[0.7em] font-bold uppercase", labelClassName)} style={accentMutedText(ctx)}>
            {ctx.counterpartyLabel}
          </p>
          <p className="break-words font-bold leading-snug text-[#0f172a]">
            {ctx.counterpartyName || "—"}
          </p>
        </>
      )}
      <CounterpartyRepLine ctx={ctx} />
      {showIce && ctx.counterpartyIce ? (
        <p className="text-[0.85em] text-slate-600">ICE : {ctx.counterpartyIce}</p>
      ) : null}
      {!edit && ctx.addrLine ? (
        <p className="text-[0.85em] text-slate-500">{ctx.addrLine}</p>
      ) : null}
    </div>
  );
}

export function LayoutMetaBar({
  ctx,
  className,
  variant = "grid",
}: {
  ctx: PreviewContext;
  className?: string;
  variant?: "grid" | "chips" | "inline";
}) {
  const edit = useDocumentEdit();

  if (edit) {
    return (
      <div
        className={cn(
          "grid gap-2 border-b border-slate-100 px-4 py-3 sm:grid-cols-2 sm:px-6 lg:grid-cols-4",
          className,
        )}
      >
        <div>
          <FieldLabel>Date</FieldLabel>
          {edit.readOnly ? (
            <p className="text-[0.9em] font-medium">{formatDate(edit.date)}</p>
          ) : (
            <input
              type="date"
              className={`${docFieldClass} !min-h-[28px] py-1 text-xs`}
              value={edit.date}
              onChange={(e) => edit.onDateChange(e.target.value)}
            />
          )}
        </div>
        {edit.documentType === "facture" ? (
          <div>
            <FieldLabel>Échéance</FieldLabel>
            {edit.readOnly ? (
              <p className="text-[0.9em] font-medium">
                {edit.dueDate ? formatDate(edit.dueDate) : "—"}
              </p>
            ) : (
              <input
                type="date"
                className={`${docFieldClass} !min-h-[28px] py-1 text-xs`}
                value={edit.dueDate}
                onChange={(e) => edit.onDueDateChange(e.target.value)}
              />
            )}
          </div>
        ) : null}
        <div>
          <FieldLabel>Référence</FieldLabel>
          {edit.readOnly ? (
            <p className="text-[0.9em]">{edit.reference || "—"}</p>
          ) : (
            <input
              className={`${docFieldClass} !min-h-[28px] py-1 text-xs`}
              value={edit.reference}
              onChange={(e) => edit.onReferenceChange(e.target.value)}
              placeholder="Optionnel"
            />
          )}
        </div>
        {edit.showProject ? (
          <div>
            <FieldLabel>Projet</FieldLabel>
            <ProjectSelect
              value={edit.projectId}
              onChange={edit.onProjectChange}
              readOnly={edit.readOnly}
              fieldClassName={docFieldClass}
            />
          </div>
        ) : null}
      </div>
    );
  }

  if (variant === "chips") {
    return (
      <div className={cn("flex flex-wrap gap-1.5 px-[5%] pb-2", className)}>
        {[
          ["Date", ctx.dateFormatted],
          ...(ctx.dueDateFormatted ? [["Échéance", ctx.dueDateFormatted] as const] : []),
          ...(ctx.reference ? [["Réf.", ctx.reference] as const] : []),
        ].map(([k, v]) => (
          <span key={k} className="rounded border border-slate-200 bg-slate-50 px-2 py-1 text-[0.75em]">
            <span className="text-slate-400">{k}</span> {v}
          </span>
        ))}
      </div>
    );
  }

  if (variant === "inline") {
    return (
      <div className={cn("space-y-2 text-[0.8em]", className)}>
        <p>
          <span className="text-slate-400">Date</span> <strong>{ctx.dateFormatted}</strong>
        </p>
        {ctx.dueDateFormatted ? (
          <p>
            <span className="text-slate-400">Échéance</span> <strong>{ctx.dueDateFormatted}</strong>
          </p>
        ) : null}
        {ctx.reference ? (
          <p>
            <span className="text-slate-400">Réf.</span> <strong>{ctx.reference}</strong>
          </p>
        ) : null}
      </div>
    );
  }

  return null;
}

export function LayoutLines({
  preview,
  className,
}: {
  ctx: PreviewContext;
  preview: ReactNode;
  className?: string;
}) {
  const edit = useDocumentEdit();

  if (edit) {
    return (
      <div className={cn("px-4 py-3 sm:px-6", className)}>
        <LineItemsEditor
          embedded
          lines={edit.lines}
          onChange={edit.onLinesChange}
          catalog={edit.catalog}
          readOnly={edit.readOnly}
          hideAmounts={isDeliveryNote(edit.documentType)}
          vatRate={edit.vatRate}
          autoOpenCatalog={edit.autoOpenCatalog}
        />
      </div>
    );
  }

  return <div className={className}>{preview}</div>;
}

export function LayoutAdjustments({
  ctx,
  className,
}: {
  ctx: PreviewContext;
  className?: string;
}) {
  const edit = useDocumentEdit();
  if (!edit || edit.readOnly || ctx.deliveryNote) return null;

  return (
    <div className={cn("grid gap-0 border-t border-slate-200 sm:grid-cols-2", className)}>
      <div className="border-b border-r border-slate-200 p-3 text-[0.85em] sm:border-b-0">
        <FieldLabel>Remise</FieldLabel>
        <HtTtcField
          valueHt={edit.discount}
          vatRate={edit.vatRate}
          onChangeHt={edit.onDiscountChange}
          fieldClassName={docFieldClass}
        />
      </div>
      <div className="border-b border-slate-200 p-3 text-[0.85em]">
        <FieldLabel>Acompte</FieldLabel>
        <HtTtcField
          valueHt={edit.deposit}
          vatRate={edit.vatRate}
          onChangeHt={edit.onDepositChange}
          fieldClassName={docFieldClass}
        />
      </div>
      <div className="border-b border-slate-200 p-3 sm:col-span-2">
        <FieldLabel>TVA</FieldLabel>
        <div className="mt-1 flex flex-wrap gap-0">
          {VAT_PRESETS.map((rate) => (
            <button
              key={rate}
              type="button"
              onClick={() => edit.onVatRateChange(rate)}
              className={cn(
                "border border-slate-300 px-2.5 py-1 text-[0.75em] font-semibold -ml-px first:ml-0",
                edit.vatRate === rate
                  ? "relative z-[1] border-brand bg-brand text-white"
                  : "bg-white text-slate-600 hover:bg-slate-50",
              )}
            >
              {rate}%
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function LayoutNotes({
  ctx,
  className,
  style,
}: {
  ctx: PreviewContext;
  className?: string;
  style?: CSSProperties;
}) {
  const edit = useDocumentEdit();

  if (edit) {
    return (
      <div className={cn("border-t border-slate-200 px-4 py-3 sm:px-6", className)} style={style}>
        <FieldLabel>Observations</FieldLabel>
        {edit.readOnly ? (
          edit.notes?.trim() ? (
            <p className="mt-1 whitespace-pre-wrap text-[0.9em] text-slate-600">{edit.notes}</p>
          ) : null
        ) : (
          <Textarea
            className="mt-1 min-h-[64px] rounded-none border-slate-300 text-xs focus-visible:ring-1 focus-visible:ring-brand/20"
            value={edit.notes}
            onChange={(e) => edit.onNotesChange(e.target.value)}
            placeholder="Conditions, délais de paiement…"
          />
        )}
      </div>
    );
  }

  return <NotesBlock ctx={ctx} className={className} style={style} />;
}

export function LayoutSettingsBanner({ ctx }: { ctx: PreviewContext }) {
  void ctx;
  const edit = useDocumentEdit();
  if (!edit || edit.readOnly || !edit.settings || hasSellerFooter(edit.settings)) return null;

  return (
    <Link
      href="/settings"
      className="mx-4 mb-3 flex items-center gap-2 border border-amber-200/80 bg-amber-50/80 px-2 py-1.5 text-[0.75em] text-amber-900 sm:mx-6"
    >
      <ExternalLink className="h-3 w-3 shrink-0" />
      Compléter le modèle société
    </Link>
  );
}

export function LayoutNetSummary({
  ctx,
  className,
  style,
}: {
  ctx: PreviewContext;
  className?: string;
  style?: CSSProperties;
}) {
  const edit = useDocumentEdit();
  if (ctx.deliveryNote) return null;

  const vatRate = edit?.vatRate ?? ctx.vatRate;
  const vatAmount = edit ? formatMoney(ctx.vatAmount) : ctx.money(ctx.vatAmount);
  const netToPay = edit ? formatMoney(ctx.netToPay) : ctx.money(ctx.netToPay);

  return (
    <div className={className} style={style}>
      <div className="col-span-2 border-r border-slate-200 p-2">
        <p className="font-bold text-slate-500">TVA {vatRate}%</p>
        <p className="tabular-nums">{vatAmount}</p>
      </div>
      <div className="col-span-3 p-2 text-center">
        <p style={{ color: ctx.theme.accent }}>Net à payer</p>
        <p className="text-[1.2em] font-bold tabular-nums">{netToPay} MAD</p>
      </div>
    </div>
  );
}
