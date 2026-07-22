"use client";

import Link from "next/link";
import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { ExternalLink, X } from "lucide-react";
import { CounterpartySelectWithSheet } from "@/components/documents/CounterpartySelectWithSheet";
import { LineItemsEditor } from "@/components/documents/LineItemsEditor";
import { ProjectSelect } from "@/components/projects/ProjectSelect";
import { AutoGrowTextarea } from "@/components/ui/auto-grow-textarea";
import { docFieldClass } from "@/lib/design";
import { isDeliveryNote } from "@/lib/documents";
import { formatMoney } from "@/lib/money";
import {
  daysBetweenDates,
  displayDocumentRef,
  dueDateFromPaymentTerms,
  PAYMENT_TERM_OPTIONS,
  paymentTermsLabel,
  paymentTermsSelectValue,
} from "@/lib/payment-terms";
import { hasSellerFooter } from "@/lib/seller-footer";
import { cn, formatDate } from "@/lib/utils";
import { useDocumentEdit } from "./document-edit-context";
import { accentMutedText } from "./layout-theme";
import { CounterpartyRepLine, NotesBlock, PaperFrame } from "./parts";
import type { PreviewContext } from "./types";

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

type EditState = NonNullable<ReturnType<typeof useDocumentEdit>>;

function syncDateKeepTerms(edit: EditState, nextDate: string) {
  const days = edit.dueDate ? (daysBetweenDates(edit.date, edit.dueDate) ?? 0) : 0;
  edit.onDateChange(nextDate);
  if (edit.documentType === "facture" || edit.dueDate) {
    edit.onDueDateChange(dueDateFromPaymentTerms(nextDate, Math.max(0, days)));
  }
}

/** Conditions (= délai de paiement) — shared across all templates. */
function ConditionsField({
  edit,
  ctx,
  className,
  readOnlyClassName,
}: {
  edit: EditState | null | undefined;
  ctx: PreviewContext;
  className?: string;
  readOnlyClassName?: string;
}) {
  const dateValue = edit?.date ?? ctx.date;
  const dueValue = edit?.dueDate ?? ctx.dueDate;
  const terms = paymentTermsLabel(dateValue, dueValue || undefined);
  const termsSelect = paymentTermsSelectValue(dateValue, dueValue || undefined);

  if (edit && !edit.readOnly) {
    return (
      <select
        className={className}
        title="Délai de paiement — calcule l'échéance depuis la date"
        value={termsSelect || "custom"}
        onChange={(e) => {
          const raw = e.target.value;
          if (raw === "custom") return;
          const days = Number(raw);
          if (!Number.isFinite(days)) return;
          edit.onDueDateChange(dueDateFromPaymentTerms(edit.date, days));
        }}
      >
        {PAYMENT_TERM_OPTIONS.map((o) => (
          <option key={o.days} value={String(o.days)}>
            {o.label}
          </option>
        ))}
        {termsSelect === "" ? <option value="custom">{terms}</option> : null}
      </select>
    );
  }
  return <span className={readOnlyClassName}>{terms}</span>;
}

/** Réf. — empty shows document number/code. Shared across templates. */
function ReferenceField({
  edit,
  ctx,
  className,
  readOnlyClassName,
}: {
  edit: EditState | null | undefined;
  ctx: PreviewContext;
  className?: string;
  readOnlyClassName?: string;
}) {
  const refStored = edit?.reference ?? ctx.reference ?? "";
  const refDisplay = displayDocumentRef(refStored, ctx.number);

  if (edit && !edit.readOnly) {
    return (
      <AutoGrowTextarea
        className={className}
        value={edit.reference.trim() ? edit.reference : ctx.number}
        onChange={(e) => {
          const next = e.target.value;
          edit.onReferenceChange(next.trim() === ctx.number.trim() ? "" : next);
        }}
        placeholder={ctx.number}
        minRows={1}
      />
    );
  }
  return <span className={readOnlyClassName}>{refDisplay}</span>;
}

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
  const guestName = edit
    ? edit.isSupplier
      ? edit.guestSupplierName
      : edit.guestClientName
    : "";
  const isGuestCounterparty = !!edit && !counterpartyId && !!guestName.trim();

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
              valueId={counterpartyId}
              guestName={edit.isSupplier ? edit.guestSupplierName : edit.guestClientName}
              onChange={edit.onCounterpartyChange}
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
      {edit && !edit.readOnly && isGuestCounterparty ? (
        <div className="mt-2 space-y-1.5 text-left">
          <input
            type="text"
            className={cn(docFieldClass, "w-full")}
            value={edit.guestIce}
            onChange={(e) => edit.onGuestIceChange(e.target.value)}
            placeholder="ICE"
            aria-label="ICE"
          />
          <AutoGrowTextarea
            className={cn(docFieldClass, "min-h-[40px] w-full resize-none py-1.5")}
            value={edit.guestAddress}
            onChange={(e) => edit.onGuestAddressChange(e.target.value)}
            placeholder="Adresse"
            aria-label="Adresse"
            minRows={1}
          />
          <input
            type="text"
            className={cn(docFieldClass, "w-full")}
            value={edit.guestCity}
            onChange={(e) => edit.onGuestCityChange(e.target.value)}
            placeholder="Ville"
            aria-label="Ville"
          />
        </div>
      ) : (
        <>
          {showIce && ctx.counterpartyIce ? (
            <p className="text-[0.85em] text-slate-600">ICE : {ctx.counterpartyIce}</p>
          ) : null}
          {ctx.addrLine ? (
            <p className="text-[0.85em] text-slate-500">{ctx.addrLine}</p>
          ) : null}
        </>
      )}
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
  variant?: "grid" | "chips" | "inline" | "invoice" | "ledgerBanner" | "folio" | "ruby" | "quill";
}) {
  const edit = useDocumentEdit();

  if (variant === "quill") {
    const dateValue = edit?.date ?? ctx.date;
    const dueValue = edit?.dueDate ?? ctx.dueDate;
    const showDue = edit ? edit.documentType === "facture" : !!ctx.dueDateFormatted;
    const terms = paymentTermsLabel(dateValue, dueValue || undefined);
    const termsSelect = paymentTermsSelectValue(dateValue, dueValue || undefined);
    const refStored = edit?.reference ?? ctx.reference ?? "";
    const refDisplay = displayDocumentRef(refStored, ctx.number);
    const field =
      "box-border block h-10 w-full min-w-0 rounded-md border border-slate-300 bg-white px-3 text-[0.9em] text-[#0f172a] outline-none focus:border-slate-400";

    const row = (label: string, value: ReactNode) => (
      <div className="grid grid-cols-[6.5rem_minmax(0,1fr)] items-center gap-3">
        <span className="shrink-0 text-[0.9em] text-slate-500">{label}</span>
        <div className="min-w-0">{value}</div>
      </div>
    );

    return (
      <div className={cn("w-full space-y-3", className)}>
        {row(
          ctx.t("date"),
          edit && !edit.readOnly ? (
            <input
              type="date"
              className={cn(field, "text-right")}
              value={edit.date}
              onChange={(e) => {
                const nextDate = e.target.value;
                const days = edit.dueDate
                  ? (daysBetweenDates(edit.date, edit.dueDate) ?? 0)
                  : 0;
                edit.onDateChange(nextDate);
                // Keep Conditions ↔ Échéance in sync (facture always has a due date).
                if (edit.documentType === "facture" || edit.dueDate) {
                  edit.onDueDateChange(dueDateFromPaymentTerms(nextDate, Math.max(0, days)));
                }
              }}
            />
          ) : (
            <div className={`${field} flex items-center justify-end tabular-nums`}>{ctx.dateFormatted}</div>
          ),
        )}
        {row(
          ctx.t("terms"),
          edit && !edit.readOnly ? (
            <select
              className={cn(field, "text-right")}
              title="Délai de paiement — calcule l'échéance depuis la date"
              value={termsSelect || "custom"}
              onChange={(e) => {
                const raw = e.target.value;
                if (raw === "custom") return;
                const days = Number(raw);
                if (!Number.isFinite(days)) return;
                edit.onDueDateChange(dueDateFromPaymentTerms(edit.date, days));
              }}
            >
              {PAYMENT_TERM_OPTIONS.map((o) => (
                <option key={o.days} value={String(o.days)}>
                  {o.label}
                </option>
              ))}
              {termsSelect === "" ? (
                <option value="custom">{terms}</option>
              ) : null}
            </select>
          ) : (
            <div className={`${field} flex items-center justify-end`}>{terms}</div>
          ),
        )}
        {showDue
          ? row(
              ctx.t("due"),
              edit && !edit.readOnly ? (
                <input
                  type="date"
                  className={cn(field, "text-right")}
                  value={edit.dueDate || edit.date}
                  onChange={(e) => edit.onDueDateChange(e.target.value)}
                  onBlur={() => {
                    if (!edit.dueDate.trim()) {
                      edit.onDueDateChange(edit.date);
                    }
                  }}
                />
              ) : (
                <div className={`${field} flex items-center justify-end tabular-nums`}>
                  {ctx.dueDateFormatted ?? "—"}
                </div>
              ),
            )
          : null}
        {row(
          ctx.t("ref"),
          edit && !edit.readOnly ? (
            <AutoGrowTextarea
              className={cn(field, "text-right leading-snug tabular-nums")}
              value={edit.reference.trim() ? edit.reference : ctx.number}
              onChange={(e) => {
                const next = e.target.value;
                edit.onReferenceChange(next.trim() === ctx.number.trim() ? "" : next);
              }}
              placeholder={ctx.number}
              minRows={1}
            />
          ) : (
            <div className={`${field} flex items-center justify-end whitespace-pre-wrap break-words tabular-nums`}>
              {refDisplay}
            </div>
          ),
        )}
        {edit?.showProject ? (
          <div className="pt-0.5 text-left">
            <span className="mb-1 block text-[0.9em] text-slate-500">{ctx.t("project")}</span>
            <ProjectSelect
              value={edit.projectId}
              onChange={edit.onProjectChange}
              readOnly={edit.readOnly}
              fieldClassName={cn(docFieldClass, "!box-border !h-10 !min-h-[40px] !rounded-md !text-[0.9em]")}
            />
          </div>
        ) : null}
      </div>
    );
  }

  if (variant === "ruby") {
    const showDue = edit ? edit.documentType === "facture" : !!ctx.dueDateFormatted;
    const accent = ctx.theme.primary;
    const fieldClass = `${docFieldClass} !min-h-[26px] max-w-[10rem] py-0.5 text-xs`;

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
                className={fieldClass}
                value={edit.date}
                onChange={(e) => syncDateKeepTerms(edit, e.target.value)}
              />
            ) : (
              <span className="tabular-nums">{ctx.dateFormatted}</span>
            ),
          )}
          {metaRow(
            "Conditions",
            <ConditionsField
              edit={edit}
              ctx={ctx}
              className={fieldClass}
              readOnlyClassName="tabular-nums"
            />,
          )}
          {showDue
            ? metaRow(
                "Échéance",
                edit && !edit.readOnly ? (
                  <input
                    type="date"
                    className={fieldClass}
                    value={edit.dueDate || edit.date}
                    onChange={(e) => edit.onDueDateChange(e.target.value)}
                    onBlur={() => {
                      if (!edit.dueDate.trim()) edit.onDueDateChange(edit.date);
                    }}
                  />
                ) : (
                  <span className="tabular-nums">{ctx.dueDateFormatted ?? "—"}</span>
                ),
              )
            : null}
          {metaRow(
            "Réf.",
            <ReferenceField
              edit={edit}
              ctx={ctx}
              className={`${fieldClass} leading-snug tabular-nums`}
              readOnlyClassName="tabular-nums"
            />,
          )}
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
              {ctx.dueLabel === "Net HT" ? "Net HT" : "Solde dû"}
            </p>
            <p className="mt-1 text-[1.25em] font-bold tabular-nums text-slate-800">
              {ctx.money(ctx.dueAmount)}
            </p>
          </div>
        ) : null}
      </div>
    );
  }

  if (variant === "folio") {
    const showDue = edit ? edit.documentType === "facture" : !!ctx.dueDateFormatted;
    const fieldClass = `${docFieldClass} !min-h-[26px] max-w-[9.5rem] py-0.5 text-right text-xs`;

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
              className={fieldClass}
              value={edit.date}
              onChange={(e) => syncDateKeepTerms(edit, e.target.value)}
            />
          ) : (
            <span className="tabular-nums">{ctx.dateFormatted}</span>
          ),
        )}
        {row(
          "Conditions",
          <ConditionsField
            edit={edit}
            ctx={ctx}
            className={fieldClass}
            readOnlyClassName="tabular-nums"
          />,
        )}
        {showDue
          ? row(
              "Échéance",
              edit && !edit.readOnly ? (
                <input
                  type="date"
                  className={fieldClass}
                  value={edit.dueDate || edit.date}
                  onChange={(e) => edit.onDueDateChange(e.target.value)}
                  onBlur={() => {
                    if (!edit.dueDate.trim()) edit.onDueDateChange(edit.date);
                  }}
                />
              ) : (
                <span className="tabular-nums">{ctx.dueDateFormatted ?? "—"}</span>
              ),
            )
          : null}
        {row(
          "Réf.",
          <ReferenceField
            edit={edit}
            ctx={ctx}
            className={`${fieldClass} leading-snug tabular-nums`}
            readOnlyClassName="tabular-nums"
          />,
        )}
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
              onChange={(e) => syncDateKeepTerms(edit, e.target.value)}
            />
          ) : (
            <span className="font-medium tabular-nums">{ctx.dateFormatted}</span>
          )}
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="shrink-0 text-slate-500">Conditions</span>
          <ConditionsField
            edit={edit}
            ctx={ctx}
            className={`${docFieldClass} !min-h-[28px] max-w-[9.5rem] py-1 text-right text-xs`}
            readOnlyClassName="font-medium"
          />
        </div>
        {(edit ? edit.documentType === "facture" : !!ctx.dueDateFormatted) ? (
          <div className="flex items-center justify-between gap-4">
            <span className="shrink-0 text-slate-500">Échéance</span>
            {edit && !edit.readOnly ? (
              <input
                type="date"
                className={`${docFieldClass} !min-h-[28px] max-w-[9.5rem] py-1 text-right text-xs`}
                value={edit.dueDate || edit.date}
                onChange={(e) => edit.onDueDateChange(e.target.value)}
                onBlur={() => {
                  if (!edit.dueDate.trim()) edit.onDueDateChange(edit.date);
                }}
              />
            ) : (
              <span className="font-medium tabular-nums">{ctx.dueDateFormatted ?? "—"}</span>
            )}
          </div>
        ) : null}
        <div className="flex items-start justify-between gap-4">
          <span className="shrink-0 pt-1.5 text-slate-500">Réf.</span>
          <ReferenceField
            edit={edit}
            ctx={ctx}
            className={`${docFieldClass} !min-h-[28px] max-w-[9.5rem] py-1 text-right text-xs leading-snug tabular-nums`}
            readOnlyClassName="font-medium tabular-nums"
          />
        </div>
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
              onChange={(e) => syncDateKeepTerms(edit, e.target.value)}
            />
          )}
        </div>
        <div>
          <FieldLabel>Conditions</FieldLabel>
          <ConditionsField
            edit={edit}
            ctx={ctx}
            className={`${docFieldClass} !min-h-[28px] py-1 text-xs`}
            readOnlyClassName="text-[0.9em] font-medium"
          />
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
                value={edit.dueDate || edit.date}
                onChange={(e) => edit.onDueDateChange(e.target.value)}
                onBlur={() => {
                  if (!edit.dueDate.trim()) edit.onDueDateChange(edit.date);
                }}
              />
            )}
          </div>
        ) : null}
        <div>
          <FieldLabel>Réf.</FieldLabel>
          <ReferenceField
            edit={edit}
            ctx={ctx}
            className={`${docFieldClass} !min-h-[28px] py-1 text-xs leading-snug tabular-nums`}
            readOnlyClassName="text-[0.9em] font-medium tabular-nums"
          />
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
  ctx,
  preview,
  className,
  darkHead,
  variant,
}: {
  ctx: PreviewContext;
  preview: ReactNode;
  className?: string;
  darkHead?: boolean;
  variant?: "quill";
}) {
  const edit = useDocumentEdit();

  if (edit) {
    return (
      <div className={cn("px-4 py-3 sm:px-6", className)}>
        <LineItemsEditor
          embedded
          darkHead={darkHead || variant === "quill"}
          variant={variant}
          amountDisplay={edit.amountDisplay}
          lines={edit.lines}
          onChange={edit.onLinesChange}
          catalog={edit.catalog}
          readOnly={edit.readOnly}
          hideAmounts={isDeliveryNote(edit.documentType)}
          vatRate={edit.vatRate}
          autoOpenCatalog={edit.autoOpenCatalog}
          currency={ctx.currency}
          lang={ctx.lang}
        />
      </div>
    );
  }

  return <div className={className}>{preview}</div>;
}

/** Totals while editing — same Remise / TVA / Acompte UX on every template. */
export function LayoutAdjustments({
  ctx,
  className,
}: {
  ctx: PreviewContext;
  className?: string;
  /** @deprecated Ignored — all templates use the shared totals UX. */
  variant?: "panel" | "stack";
}) {
  const edit = useDocumentEdit();
  if (!edit || ctx.deliveryNote) return null;
  return <QuillTotals ctx={ctx} className={className} />;
}

/** Design-only totals chrome — hidden in the editor via PaperFrame. */
export function LayoutStaticTotals({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn("doc-preview-totals", className)}>{children}</div>;
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
          <AutoGrowTextarea
            className="mt-1 min-h-[64px] rounded-none border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-ink outline-none placeholder:text-slate-400 focus:border-brand focus:ring-1 focus:ring-brand/20"
            value={edit.notes}
            onChange={(e) => edit.onNotesChange(e.target.value)}
            placeholder="Conditions, délais de paiement…"
            minRows={3}
          />
        )}
      </div>
    );
  }

  return <NotesBlock ctx={ctx} className={className} style={style} />;
}

/** Invoice Ninja–style Notes + Terms (terms = company legal text). */
export function QuillNotesAndTerms({
  ctx,
  className,
}: {
  ctx: PreviewContext;
  className?: string;
}) {
  const edit = useDocumentEdit();
  const box =
    "mt-1.5 min-h-[80px] w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-[0.85em] leading-relaxed text-[#0f172a] outline-none placeholder:text-slate-400 focus:border-slate-400";

  return (
    <div className={cn("space-y-5", className)}>
      <div>
        <p className="text-[0.9em] font-medium text-[#334155]">{ctx.t("notes")}</p>
        {edit && !edit.readOnly ? (
          <AutoGrowTextarea
            className={box}
            value={edit.notes}
            onChange={(e) => edit.onNotesChange(e.target.value)}
            placeholder={ctx.t("notes")}
            minRows={3}
          />
        ) : (
          <div className={cn(box, "whitespace-pre-wrap break-words text-slate-400")}>
            {ctx.notes?.trim() || ctx.t("notes")}
          </div>
        )}
      </div>
      <div>
        <p className="text-[0.9em] font-medium text-[#334155]">{ctx.t("conditions")}</p>
        <div className={cn(box, "min-h-[96px] whitespace-pre-wrap text-slate-400")}>
          {ctx.sellerLegal?.trim() || ctx.t("conditions")}
        </div>
      </div>
    </div>
  );
}

/** Invoice Ninja–style totals (Remise / TVA / Acompte). */
export function QuillTotals({
  ctx,
  className,
}: {
  ctx: PreviewContext;
  className?: string;
}) {
  const edit = useDocumentEdit();
  const [showDiscount, setShowDiscount] = useState(false);
  const [showTax, setShowTax] = useState(false);
  const [showDeposit, setShowDeposit] = useState(false);

  const discount = edit?.discount ?? ctx.discount;
  const deposit = edit?.deposit ?? ctx.deposit;
  const vatRate = edit?.vatRate ?? ctx.vatRate;

  useEffect(() => {
    if (discount > 0) setShowDiscount(true);
    if (vatRate > 0) setShowTax(true);
    if (deposit > 0) setShowDeposit(true);
  }, [discount, vatRate, deposit]);

  if (ctx.deliveryNote) return null;

  const canEdit = !!edit && !edit.readOnly;
  const addRowClass =
    "flex h-10 w-full items-center rounded-md border border-dashed border-slate-300 bg-slate-50 px-3 text-[0.9em] font-medium text-teal-600 hover:border-teal-300 hover:bg-teal-50/50 hover:text-teal-700";
  const paidField =
    "box-border h-10 w-full min-w-[7rem] max-w-[11rem] rounded-md border border-slate-300 bg-white py-2 pl-10 pr-3 text-right text-[0.9em] tabular-nums outline-none focus:border-slate-400";
  const taxField =
    "box-border h-10 w-full min-w-[5rem] max-w-[7rem] rounded-md border border-slate-300 bg-white py-2 pr-8 text-right text-[0.9em] tabular-nums outline-none focus:border-slate-400";

  function removeDiscount() {
    edit?.onDiscountChange(0);
    setShowDiscount(false);
  }

  function removeTax() {
    edit?.onVatRateChange(0);
    setShowTax(false);
  }

  function removeDeposit() {
    edit?.onDepositChange(0);
    setShowDeposit(false);
  }

  const removeBtn = (onClick: () => void, label: string) =>
    canEdit ? (
      <button
        type="button"
        onClick={onClick}
        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-red-500 hover:bg-red-50 hover:text-red-600"
        aria-label={label}
        title={label}
      >
        <X className="h-4 w-4" strokeWidth={2.5} />
      </button>
    ) : null;

  return (
    <div className={cn("w-full space-y-3 text-[0.95em]", className)}>
      <div className="flex h-10 items-center justify-between gap-4">
        <span className="text-slate-500">{ctx.t("subtotal")}</span>
        <span className="tabular-nums text-[#0f172a]">{ctx.money(ctx.totalHt)}</span>
      </div>

      {(showDiscount || discount > 0) && (
        <div className="flex h-10 items-center justify-between gap-2">
          <span className="shrink-0 text-slate-500">{ctx.t("discount")}</span>
          <div className="flex items-center gap-1.5">
            {canEdit && edit ? (
              <div className="relative">
                <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[12px] text-slate-400">
                  {ctx.currency}
                </span>
                <input
                  type="text"
                  inputMode="decimal"
                  className={paidField}
                  value={discount === 0 ? "" : String(discount)}
                  placeholder="0"
                  onChange={(e) => {
                    const cleaned = e.target.value.replace(/[^0-9.,]/g, "").replace(",", ".");
                    const n = cleaned === "" || cleaned === "." ? 0 : Number(cleaned);
                    if (Number.isFinite(n)) edit.onDiscountChange(Math.max(0, n));
                  }}
                />
              </div>
            ) : (
              <span className="tabular-nums">{ctx.money(discount)}</span>
            )}
            {removeBtn(removeDiscount, "Retirer la remise")}
          </div>
        </div>
      )}

      {(showTax || (!canEdit && vatRate > 0)) && (
        <div className="flex h-10 items-center justify-between gap-2">
          <span className="shrink-0 text-slate-500">{ctx.t("tax")}</span>
          <div className="flex items-center gap-1.5">
            {canEdit && edit ? (
              <div className="relative">
                <input
                  type="text"
                  inputMode="decimal"
                  className={taxField}
                  value={String(edit.vatRate)}
                  onChange={(e) => {
                    const cleaned = e.target.value.replace(/[^0-9.,]/g, "").replace(",", ".");
                    const n = cleaned === "" || cleaned === "." ? 0 : Number(cleaned);
                    if (Number.isFinite(n)) edit.onVatRateChange(Math.min(100, Math.max(0, n)));
                  }}
                />
                <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[12px] text-slate-400">
                  %
                </span>
              </div>
            ) : (
              <span className="tabular-nums text-[#0f172a]">{vatRate} %</span>
            )}
            {removeBtn(removeTax, "Retirer la TVA")}
          </div>
        </div>
      )}

      {showTax && vatRate > 0 ? (
        <div className="flex h-8 items-center justify-between gap-4 text-[0.9em]">
          <span className="text-slate-400">{ctx.t("taxAmount")}</span>
          <span className="tabular-nums text-slate-600">{ctx.money(ctx.vatAmount)}</span>
        </div>
      ) : null}

      {canEdit ? (
        <div className="space-y-2">
          {!showDiscount && discount <= 0 ? (
            <button type="button" className={addRowClass} onClick={() => setShowDiscount(true)}>
              {ctx.t("addDiscount")}
            </button>
          ) : null}
          {!showTax ? (
            <button
              type="button"
              className={addRowClass}
              onClick={() => {
                setShowTax(true);
                if (edit && edit.vatRate === 0) edit.onVatRateChange(20);
              }}
            >
              {ctx.t("addTax")}
            </button>
          ) : null}
          {!showDeposit && deposit <= 0 ? (
            <button type="button" className={addRowClass} onClick={() => setShowDeposit(true)}>
              {ctx.t("addDeposit")}
            </button>
          ) : null}
        </div>
      ) : null}

      <div className="flex h-10 items-center justify-between gap-4 border-t border-slate-200 pt-3">
        <span className="font-bold text-[#0f172a]">{ctx.showTtc ? ctx.t("total") : ctx.t("totalHt")}</span>
        <span className="font-bold tabular-nums text-[#0f172a]">
          {ctx.money(ctx.showTtc ? ctx.totalTtc : ctx.netHt)}
        </span>
      </div>

      {(showDeposit || deposit > 0) && (
        <div className="flex h-10 items-center justify-between gap-2">
          <span className="shrink-0 text-slate-500">{ctx.t("depositPaid")}</span>
          <div className="flex items-center gap-1.5">
            {canEdit && edit ? (
              <div className="relative">
                <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[12px] text-slate-400">
                  {ctx.currency}
                </span>
                <input
                  type="text"
                  inputMode="decimal"
                  className={paidField}
                  value={deposit === 0 ? "" : String(deposit)}
                  placeholder="0"
                  onChange={(e) => {
                    const cleaned = e.target.value.replace(/[^0-9.,]/g, "").replace(",", ".");
                    const n = cleaned === "" || cleaned === "." ? 0 : Number(cleaned);
                    if (Number.isFinite(n)) edit.onDepositChange(Math.max(0, n));
                  }}
                />
              </div>
            ) : (
              <span className="tabular-nums">{ctx.money(deposit)}</span>
            )}
            {canEdit ? removeBtn(removeDeposit, "Retirer l'acompte") : null}
          </div>
        </div>
      )}

      <div className="flex h-11 items-center justify-between gap-4 border-t border-slate-200 pt-3">
        <span className="text-[1.05em] font-bold text-[#0f172a]">
          {ctx.showTtc || deposit > 0 ? ctx.t("balanceDue") : ctx.dueLabel}
        </span>
        <span className="text-[1.15em] font-bold tabular-nums text-[#0f172a]">
          {ctx.money(ctx.dueAmount)}
        </span>
      </div>
    </div>
  );
}

export function LayoutSettingsBanner({ ctx }: { ctx: PreviewContext }) {
  void ctx;
  const edit = useDocumentEdit();
  if (!edit || edit.readOnly || !edit.settings) return null;

  const missingFooter = !hasSellerFooter(edit.settings);
  const missingLogo = !edit.settings.logoUrl;
  const missingCachet = !edit.settings.cachetUrl;
  if (!missingFooter && !missingLogo && !missingCachet) return null;

  const parts: string[] = [];
  if (missingLogo) parts.push("logo");
  if (missingCachet) parts.push("cachet");
  if (missingFooter) parts.push("pied de page");
  const label =
    parts.length === 1
      ? `Ajouter ${parts[0] === "pied de page" ? "le pied de page" : `un ${parts[0]}`}`
      : "Compléter le modèle société";

  const openBranding = edit.onOpenBranding;

  const focus =
    missingLogo ? "logo" : missingCachet ? "cachet" : missingFooter ? "footer" : "design";

  return (
    <div className="mx-4 mb-3 flex flex-wrap items-center gap-2 border border-amber-200/80 bg-amber-50/80 px-2 py-1.5 text-[0.75em] text-amber-900 sm:mx-6">
      {openBranding ? (
        <button
          type="button"
          onClick={() => openBranding(focus)}
          className="inline-flex items-center gap-2 font-medium hover:underline"
        >
          <ExternalLink className="h-3 w-3 shrink-0" />
          {label}
        </button>
      ) : (
        <Link href="/settings" className="inline-flex items-center gap-2 font-medium hover:underline">
          <ExternalLink className="h-3 w-3 shrink-0" />
          {label}
        </Link>
      )}
    </div>
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
  const due = edit ? formatMoney(ctx.dueAmount) : ctx.money(ctx.dueAmount);

  return (
    <div className={className} style={style}>
      <div className="col-span-2 border-r border-slate-200 p-2">
        <p className="font-bold text-slate-500">TVA {vatRate}%</p>
        <p className="tabular-nums">{vatAmount}</p>
      </div>
      <div className="col-span-3 p-2 text-center">
        <p style={{ color: ctx.theme.accent }}>{ctx.dueLabel}</p>
        <p className="text-[1.2em] font-bold tabular-nums">{due} {ctx.currency}</p>
      </div>
    </div>
  );
}
