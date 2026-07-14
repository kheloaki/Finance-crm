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

function paymentTermsLabel(date: string, dueDate?: string): string {
  if (!date || !dueDate) return "—";
  const start = new Date(`${date}T12:00:00`);
  const end = new Date(`${dueDate}T12:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return "—";
  const days = Math.round((end.getTime() - start.getTime()) / 86_400_000);
  if (days <= 0) return "Comptant";
  return `Net ${days}`;
}

export function LayoutMetaBar({
  ctx,
  className,
  variant = "grid",
}: {
  ctx: PreviewContext;
  className?: string;
  variant?: "grid" | "chips" | "inline" | "invoice" | "ledgerBanner" | "folio" | "ruby";
}) {
  const edit = useDocumentEdit();

  if (variant === "ruby") {
    const dateValue = edit?.date ?? ctx.date;
    const dueValue = edit?.dueDate ?? ctx.dueDate;
    const showDue = edit ? edit.documentType === "facture" : !!ctx.dueDateFormatted;
    const terms = paymentTermsLabel(dateValue, dueValue || undefined);
    const accent = ctx.theme.primary;

    const metaRow = (label: string, value: ReactNode) => (
      <div className="space-y-0.5">
        <p className="text-[0.72em] font-medium" style={{ color: accent }}>
          {label}
        </p>
        <div className="text-[0.85em] font-medium text-slate-700">{value}</div>
      </div>
    );

    return (
      <div className={cn("grid gap-4 sm:grid-cols-2", className)}>
        <div className="space-y-3">
          {metaRow(
            "Date",
            edit && !edit.readOnly ? (
              <input
                type="date"
                className={`${docFieldClass} !min-h-[26px] max-w-[10rem] py-0.5 text-xs`}
                value={edit.date}
                onChange={(e) => edit.onDateChange(e.target.value)}
              />
            ) : (
              <span className="tabular-nums">{ctx.dateFormatted}</span>
            ),
          )}
          {metaRow("Conditions", terms)}
          {showDue
            ? metaRow(
                "Échéance",
                edit && !edit.readOnly ? (
                  <input
                    type="date"
                    className={`${docFieldClass} !min-h-[26px] max-w-[10rem] py-0.5 text-xs`}
                    value={edit.dueDate}
                    onChange={(e) => edit.onDueDateChange(e.target.value)}
                  />
                ) : (
                  <span className="tabular-nums">{ctx.dueDateFormatted ?? "—"}</span>
                ),
              )
            : null}
          {edit?.showProject ? (
            <div>
              <p className="mb-0.5 text-[0.72em] font-medium" style={{ color: accent }}>
                Projet
              </p>
              <ProjectSelect
                value={edit.projectId}
                onChange={edit.onProjectChange}
                readOnly={edit.readOnly}
                fieldClassName={docFieldClass}
              />
            </div>
          ) : null}
        </div>
        {!ctx.deliveryNote ? (
          <div
            className="self-start border-t-2 border-r-2 px-4 py-3 text-right sm:ml-auto sm:min-w-[180px]"
            style={{ borderColor: accent }}
          >
            <p className="text-[0.85em] font-bold" style={{ color: accent }}>
              Solde dû
            </p>
            <p className="mt-1 text-[1.25em] font-bold tabular-nums text-slate-800">
              {ctx.money(ctx.netToPay)}
            </p>
          </div>
        ) : null}
      </div>
    );
  }

  if (variant === "folio") {
    const dateValue = edit?.date ?? ctx.date;
    const dueValue = edit?.dueDate ?? ctx.dueDate;
    const showDue = edit ? edit.documentType === "facture" : !!ctx.dueDateFormatted;
    const terms = paymentTermsLabel(dateValue, dueValue || undefined);

    const row = (label: string, value: ReactNode) => (
      <div className="grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-0.5">
        <span className="text-[0.75em] text-slate-400">{label}</span>
        <div className="min-w-0 text-right text-[0.85em] font-medium text-[#0f172a]">{value}</div>
      </div>
    );

    return (
      <div className={cn("w-full max-w-[260px] space-y-1.5 sm:ml-auto", className)}>
        {row("N°", <span className="tabular-nums">{ctx.number}</span>)}
        {row(
          "Date",
          edit && !edit.readOnly ? (
            <input
              type="date"
              className={`${docFieldClass} !min-h-[26px] max-w-[9.5rem] py-0.5 text-right text-xs`}
              value={edit.date}
              onChange={(e) => edit.onDateChange(e.target.value)}
            />
          ) : (
            <span className="tabular-nums">{ctx.dateFormatted}</span>
          ),
        )}
        {row("Conditions", terms)}
        {showDue
          ? row(
              "Échéance",
              edit && !edit.readOnly ? (
                <input
                  type="date"
                  className={`${docFieldClass} !min-h-[26px] max-w-[9.5rem] py-0.5 text-right text-xs`}
                  value={edit.dueDate}
                  onChange={(e) => edit.onDueDateChange(e.target.value)}
                />
              ) : (
                <span className="tabular-nums">{ctx.dueDateFormatted ?? "—"}</span>
              ),
            )
          : null}
        {edit?.showProject ? (
          <div className="pt-1">
            <span className="mb-0.5 block text-[0.75em] text-slate-400">Projet</span>
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

  if (variant === "ledgerBanner") {
    const dateValue = edit?.date ?? ctx.date;
    const dueValue = edit?.dueDate ?? ctx.dueDate;
    const showDue = edit ? edit.documentType === "facture" : !!ctx.dueDateFormatted;
    const terms = paymentTermsLabel(dateValue, dueValue || undefined);
    const bannerBg = ctx.theme.primaryDark;

    return (
      <div className={cn("mb-6 overflow-hidden", className)}>
        <div
          className="grid grid-cols-3 gap-2 px-3 py-2 text-[0.7em] font-semibold uppercase tracking-wide text-white"
          style={{ backgroundColor: bannerBg }}
        >
          <span>Date</span>
          <span className="text-center">Conditions</span>
          <span className="text-right">Échéance</span>
        </div>
        <div className="grid grid-cols-3 gap-2 border border-t-0 border-slate-200 px-3 py-2.5 text-[0.85em]">
          <div>
            {edit && !edit.readOnly ? (
              <input
                type="date"
                className={cn(docFieldClass, "!min-h-[26px] max-w-[10rem] py-0.5 text-xs")}
                value={edit.date}
                onChange={(e) => edit.onDateChange(e.target.value)}
              />
            ) : (
              <span className="font-medium tabular-nums text-[#0f172a]">{ctx.dateFormatted}</span>
            )}
          </div>
          <div className="text-center font-medium text-[#0f172a]">{terms}</div>
          <div className="text-right">
            {showDue ? (
              edit && !edit.readOnly ? (
                <input
                  type="date"
                  className={cn(docFieldClass, "!min-h-[26px] ml-auto max-w-[10rem] py-0.5 text-xs")}
                  value={edit.dueDate}
                  onChange={(e) => edit.onDueDateChange(e.target.value)}
                />
              ) : (
                <span className="font-medium tabular-nums text-[#0f172a]">
                  {ctx.dueDateFormatted ?? "—"}
                </span>
              )
            ) : (
              <span className="text-slate-400">—</span>
            )}
          </div>
        </div>
        {edit?.showProject ? (
          <div className="mt-3 max-w-xs">
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

  if (variant === "invoice") {
    return (
      <div className={cn("w-full max-w-[220px] space-y-2 text-[0.85em] sm:ml-auto", className)}>
        <div className="flex items-baseline justify-between gap-4">
          <span className="shrink-0 text-slate-500">N°</span>
          <span className="font-semibold tabular-nums text-[#0f172a]">{ctx.number}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="shrink-0 text-slate-500">Date</span>
          {edit && !edit.readOnly ? (
            <input
              type="date"
              className={`${docFieldClass} !min-h-[28px] max-w-[9.5rem] py-1 text-right text-xs`}
              value={edit.date}
              onChange={(e) => edit.onDateChange(e.target.value)}
            />
          ) : (
            <span className="font-medium tabular-nums">{ctx.dateFormatted}</span>
          )}
        </div>
        {(edit ? edit.documentType === "facture" : !!ctx.dueDateFormatted) ? (
          <div className="flex items-center justify-between gap-4">
            <span className="shrink-0 text-slate-500">Échéance</span>
            {edit && !edit.readOnly ? (
              <input
                type="date"
                className={`${docFieldClass} !min-h-[28px] max-w-[9.5rem] py-1 text-right text-xs`}
                value={edit.dueDate}
                onChange={(e) => edit.onDueDateChange(e.target.value)}
              />
            ) : (
              <span className="font-medium tabular-nums">{ctx.dueDateFormatted ?? "—"}</span>
            )}
          </div>
        ) : null}
        {edit?.showProject ? (
          <div className="pt-1 text-left">
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

  if (edit) {
    return (
      <div
        className={cn(
          "grid gap-2 border-b border-slate-100 px-4 py-3 sm:grid-cols-2 sm:px-6 lg:grid-cols-3",
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
      </div>
    );
  }

  return null;
}

export function LayoutLines({
  preview,
  className,
  darkHead,
}: {
  ctx: PreviewContext;
  preview: ReactNode;
  className?: string;
  darkHead?: boolean;
}) {
  const edit = useDocumentEdit();

  if (edit) {
    return (
      <div className={cn("px-4 py-3 sm:px-6", className)}>
        <LineItemsEditor
          embedded
          darkHead={darkHead}
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
  variant = "panel",
}: {
  ctx: PreviewContext;
  className?: string;
  variant?: "panel" | "stack";
}) {
  const edit = useDocumentEdit();
  if (!edit || edit.readOnly || ctx.deliveryNote) return null;

  if (variant === "stack") {
    return (
      <div className={cn("mb-3 space-y-2.5 text-[0.8em]", className)}>
        <div>
          <FieldLabel>Remise</FieldLabel>
          <HtTtcField
            valueHt={edit.discount}
            vatRate={edit.vatRate}
            onChangeHt={edit.onDiscountChange}
            fieldClassName={docFieldClass}
            compact
            showLabels={false}
          />
        </div>
        <div>
          <FieldLabel>Acompte</FieldLabel>
          <HtTtcField
            valueHt={edit.deposit}
            vatRate={edit.vatRate}
            onChangeHt={edit.onDepositChange}
            fieldClassName={docFieldClass}
            compact
            showLabels={false}
          />
        </div>
        <div>
          <FieldLabel>TVA</FieldLabel>
          <div className="mt-1 flex flex-wrap justify-end gap-1">
            {VAT_PRESETS.map((rate) => (
              <button
                key={rate}
                type="button"
                onClick={() => edit.onVatRateChange(rate)}
                className={cn(
                  "border px-2 py-0.5 text-[0.75em] font-semibold",
                  edit.vatRate === rate
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
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
