"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Copy, Package, Plus, StickyNote, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AutoGrowTextarea } from "@/components/ui/auto-grow-textarea";
import { HtTtcField } from "@/components/ui/ht-ttc-field";
import { CatalogCreateRow } from "@/components/documents/CounterpartyDatasheet";
import { DocumentCachetButton } from "@/components/documents/DocumentCachetButton";
import { CachetImage } from "@/components/documents/preview/CachetImage";
import { useDocumentEdit } from "@/components/documents/preview/document-edit-context";
import { DataSheet, DATA_SHEET_WIDTH_WIDE } from "@/components/datasheet/DataSheet";
import { docFieldDenseClass, inputDenseClass, sectionTitleClass, tableHeadClass } from "@/lib/design";
import type { LineItem } from "@/lib/documents";
import { PRODUCT_UNITS } from "@/lib/documents";
import { formatMoney, htToTtc, lineTotalTtc, roundMoney } from "@/lib/money";
import { cn } from "@/lib/utils";
import { DEFAULT_CURRENCY } from "@/lib/currencies";
import { DEFAULT_DOCUMENT_LANGUAGE, t, type DocumentLanguageId } from "@/lib/document-i18n";

type CatalogItem = {
  _id: string;
  reference: string;
  designation: string;
  unit: string;
  unitPriceHt: number;
};

function AmountInput({
  value,
  onChange,
  placeholder,
  className,
}: {
  value: number;
  onChange: (value: number) => void;
  placeholder?: string;
  className?: string;
}) {
  const [draft, setDraft] = useState("");
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (!editing) {
      setDraft(value === 0 ? "" : String(value));
    }
  }, [value, editing]);

  return (
    <input
      type="text"
      inputMode="decimal"
      className={cn(className ?? inputDenseClass, "min-w-[5rem] text-right")}
      value={editing ? draft : value === 0 ? "" : String(value)}
      onFocus={() => {
        setEditing(true);
        setDraft(value === 0 ? "" : String(value));
      }}
      onBlur={() => {
        const cleaned = draft.replace(/[^0-9.,]/g, "").replace(",", ".");
        const n = cleaned === "" ? 0 : Number(cleaned);
        onChange(Number.isFinite(n) ? Math.max(0, n) : 0);
        setEditing(false);
      }}
      onChange={(e) => {
        setDraft(e.target.value);
        const cleaned = e.target.value.replace(/[^0-9.,]/g, "").replace(",", ".");
        if (cleaned === "" || cleaned === ".") return;
        const n = Number(cleaned);
        if (Number.isFinite(n)) onChange(Math.max(0, n));
      }}
      placeholder={placeholder}
    />
  );
}

function PuHtTtcCell({
  valueHt,
  vatRate,
  onChangeHt,
  readOnly,
  inputClassName,
  showTtc,
}: {
  valueHt: number;
  vatRate: number;
  onChangeHt: (value: number) => void;
  readOnly?: boolean;
  inputClassName?: string;
  showTtc: boolean;
}) {
  const ttc = htToTtc(valueHt, vatRate);

  if (readOnly) {
    return (
      <div className="text-right tabular-nums leading-tight">
        <p>{formatMoney(valueHt)}</p>
        {showTtc && valueHt > 0 ? (
          <p className="text-[10px] text-ink-muted">{formatMoney(ttc)} TTC</p>
        ) : null}
      </div>
    );
  }

  if (!showTtc) {
    return (
      <AmountInput
        value={valueHt}
        onChange={onChangeHt}
        placeholder="HT"
        className={inputClassName}
      />
    );
  }

  return (
    <HtTtcField
      compact
      showLabels={false}
      valueHt={valueHt}
      vatRate={vatRate}
      onChangeHt={onChangeHt}
      fieldClassName={cn(inputClassName, "min-w-0 px-1")}
      className="w-[8.75rem] gap-1"
    />
  );
}

function parseQty(raw: string): number | null {
  const cleaned = raw.replace(/[^0-9.,]/g, "").replace(",", ".");
  if (cleaned === "" || cleaned === ".") return null;
  const n = Number(cleaned);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

function QtyInput({
  value,
  onChange,
  className,
}: {
  value: number;
  onChange: (qty: number) => void;
  className?: string;
}) {
  const [draft, setDraft] = useState("");
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (!editing) {
      setDraft(value === 0 ? "" : String(value));
    }
  }, [value, editing]);

  function bump(delta: number) {
    const next = Math.max(0, Math.round((value + delta) * 1000) / 1000);
    onChange(next);
    setDraft(next === 0 ? "" : String(next));
  }

  return (
    <input
      type="text"
      inputMode="decimal"
      className={cn(className ?? inputDenseClass, "min-w-[2.75rem] text-right")}
      value={editing ? draft : value === 0 ? "" : String(value)}
      onFocus={() => {
        setEditing(true);
        setDraft(value === 0 ? "" : String(value));
      }}
      onBlur={() => {
        const parsed = parseQty(draft);
        onChange(parsed ?? 0);
        setEditing(false);
      }}
      onChange={(e) => {
        setDraft(e.target.value);
        const parsed = parseQty(e.target.value);
        if (parsed != null) onChange(parsed);
      }}
      onKeyDown={(e) => {
        if (e.key === "ArrowUp") {
          e.preventDefault();
          bump(1);
        }
        if (e.key === "ArrowDown") {
          e.preventDefault();
          bump(-1);
        }
      }}
      placeholder="0"
      title="Quantité"
    />
  );
}

export function LineItemsEditor({
  lines,
  onChange,
  catalog,
  readOnly,
  hideAmounts,
  vatRate = 20,
  autoOpenCatalog,
  embedded,
  darkHead,
  amountDisplay = "ht_ttc",
  variant,
  currency = DEFAULT_CURRENCY,
  lang = DEFAULT_DOCUMENT_LANGUAGE,
}: {
  lines: LineItem[];
  onChange: (lines: LineItem[]) => void;
  catalog: CatalogItem[];
  readOnly?: boolean;
  hideAmounts?: boolean;
  vatRate?: number;
  /** Open catalog picker once on mount (new documents) */
  autoOpenCatalog?: boolean;
  /** Inside document paper — compact chrome */
  embedded?: boolean;
  /** Dark table header (invoice-style layouts) */
  darkHead?: boolean;
  /** HT only vs HT + TTC columns */
  amountDisplay?: import("@/lib/documents").AmountDisplay;
  /** Invoice Ninja–style simplified columns */
  variant?: "quill";
  currency?: string;
  lang?: DocumentLanguageId | string;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerQuery, setPickerQuery] = useState("");
  const autoOpened = useRef(false);
  const quillSeeded = useRef(false);
  const isQuill = variant === "quill";
  const edit = useDocumentEdit();
  const hasCachetAsset = !!edit?.settings?.cachetUrl;
  const cachetUrl = edit?.showCachet ? edit.settings?.cachetUrl : undefined;

  const cachetControls =
    edit && !readOnly ? (
      <div className="flex flex-col items-end gap-2">
        <DocumentCachetButton
          showCachet={edit.showCachet}
          hasCachetAsset={hasCachetAsset}
          readOnly={!!readOnly}
          onToggle={() => edit.onShowCachetChange(!edit.showCachet)}
          onAddCachet={() => edit.onOpenBranding?.("cachet")}
          className={isQuill ? "h-8 gap-1.5 px-3 text-[12px] shadow-sm" : "h-7 gap-1 px-2 text-[10px]"}
        />
        {cachetUrl ? (
          <button
            type="button"
            onClick={() => edit.onOpenBranding?.("cachet")}
            className="rounded-md border border-slate-200 bg-white p-2 shadow-sm outline-none hover:border-slate-300"
            title="Modifier le cachet"
          >
            <CachetImage
              src={cachetUrl}
              placementSeed={cachetUrl}
              className="h-16 max-w-[7.5rem]"
            />
          </button>
        ) : null}
      </div>
    ) : cachetUrl ? (
      <div className="flex justify-end">
        <CachetImage src={cachetUrl} placementSeed={cachetUrl} className="h-16 max-w-[7.5rem]" />
      </div>
    ) : null;

  useEffect(() => {
    if (autoOpenCatalog && lines.length === 0 && !autoOpened.current && !embedded) {
      autoOpened.current = true;
      setPickerOpen(true);
    }
  }, [autoOpenCatalog, lines.length, embedded]);

  // Seed one blank row in the document editor (Quill-style — no dashed empty state).
  useEffect(() => {
    if (!embedded || readOnly || quillSeeded.current || lines.length > 0) return;
    quillSeeded.current = true;
    onChange([
      {
        reference: "",
        designation: "",
        unit: "u",
        qty: 1,
        unitPriceHt: 0,
        sortOrder: 0,
      },
    ]);
  }, [embedded, readOnly, lines.length, onChange]);

  const filteredCatalog = useMemo(() => {
    const q = pickerQuery.trim().toLowerCase();
    if (!q) return catalog;
    return catalog.filter(
      (c) =>
        c.reference.toLowerCase().includes(q) ||
        c.designation.toLowerCase().includes(q),
    );
  }, [catalog, pickerQuery]);

  const productCount = lines.filter((l) => !l.isNote && l.designation.trim()).length;
  const showTtc = amountDisplay !== "ht";
  const lineFieldClass = embedded
    ? isQuill
      ? "w-full min-h-[28px] rounded-none border-0 bg-transparent px-1 py-0.5 text-[12px] text-ink outline-none placeholder:text-slate-400 focus:bg-slate-50/80"
      : "w-full min-h-[28px] rounded-none border-0 bg-transparent px-1 py-0.5 text-xs text-ink outline-none placeholder:text-ink-muted focus:bg-slate-50/80"
    : inputDenseClass;
  const lineTextClass = cn(lineFieldClass, "min-w-0 max-w-full leading-[1.35]");
  // Numeric cells keep a light border for clarity (qty / tarif).
  const lineNumericClass = isQuill
    ? lineFieldClass
    : embedded
      ? docFieldDenseClass
      : inputDenseClass;
  const lineHeadClass = embedded
    ? cn(
        `${tableHeadClass} px-1.5 py-1 text-[10px]`,
        (darkHead || isQuill) && "!border-slate-900 !bg-slate-900 !text-white",
        isQuill && "!px-3 !py-2.5 !text-[11px] !normal-case !tracking-normal",
      )
    : `${tableHeadClass} px-2 py-2`;
  const lineCellClass = isQuill
    ? "border-b border-slate-200 px-2 py-1.5 align-top text-[12px] text-ink-secondary"
    : embedded
      ? "border-b border-slate-100 px-1.5 py-1 align-top text-[11px] text-ink-secondary"
      : "border-b border-slate-100 px-2 py-1.5 align-top text-sm text-ink-secondary";

  function updateLine(index: number, patch: Partial<LineItem>) {
    onChange(lines.map((l, i) => (i === index ? { ...l, ...patch } : l)));
  }

  function addBlankLine() {
    onChange([
      ...lines,
      {
        reference: "",
        designation: "",
        unit: "u",
        qty: 1,
        unitPriceHt: 0,
        sortOrder: lines.length,
      },
    ]);
  }

  function addNoteLine() {
    onChange([
      ...lines,
      {
        reference: "",
        designation: "",
        unit: "",
        qty: 0,
        unitPriceHt: 0,
        sortOrder: lines.length,
        isNote: true,
      },
    ]);
  }

  function addFromCatalog(item: CatalogItem) {
    onChange([
      ...lines,
      {
        catalogItemId: item._id,
        reference: item.reference,
        designation: item.designation,
        unit: item.unit,
        qty: 1,
        unitPriceHt: item.unitPriceHt,
        sortOrder: lines.length,
      },
    ]);
    setPickerQuery("");
    // Keep picker open for multi-add; user closes manually
  }

  function duplicateLine(index: number) {
    const src = lines[index];
    if (!src) return;
    const copy = { ...src, catalogItemId: src.catalogItemId, sortOrder: lines.length };
    onChange([...lines.slice(0, index + 1), copy, ...lines.slice(index + 1)].map((l, i) => ({
      ...l,
      sortOrder: i,
    })));
  }

  function removeLine(index: number) {
    onChange(lines.filter((_, i) => i !== index).map((l, i) => ({ ...l, sortOrder: i })));
  }

  const Wrapper = embedded ? "div" : "section";

  return (
    <Wrapper>
      {!embedded ? (
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className={sectionTitleClass}>Lignes du document</h3>
          {productCount > 0 ? (
            <p className="text-[11px] text-[#9CA3AF]">
              {productCount} article{productCount > 1 ? "s" : ""}
              {lines.some((l) => l.isNote) ? " · notes incluses" : ""}
            </p>
          ) : null}
        </div>
        {!readOnly ? (
          <div className="flex flex-wrap gap-1.5">
            <Button type="button" variant="default" size="sm" onClick={() => setPickerOpen(true)}>
              <Package className="h-3.5 w-3.5" />
              Catalogue
            </Button>
            <Button type="button" variant="secondary" size="sm" onClick={addBlankLine}>
              <Plus className="h-3.5 w-3.5" />
              Ligne libre
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={addNoteLine}>
              <StickyNote className="h-3.5 w-3.5" />
              Note
            </Button>
          </div>
        ) : null}
      </div>
      ) : !readOnly && !isQuill ? (
        <div className="mb-2 flex flex-wrap items-center justify-end gap-1.5">
          <Button type="button" variant="default" size="sm" className="h-7 px-2 text-[10px]" onClick={() => setPickerOpen(true)}>
            <Package className="h-3 w-3" />
            Catalogue
          </Button>
          <Button type="button" variant="outline" size="sm" className="h-7 px-2 text-[10px]" onClick={addNoteLine}>
            <StickyNote className="h-3 w-3" />
            Note
          </Button>
        </div>
      ) : null}

      {lines.length === 0 && !readOnly && !embedded ? (
        <div
          className={cn(
            "border-2 border-dashed border-black/[0.08] bg-[#FAFBFC] px-4 py-6 text-center",
            "rounded-xl",
          )}
        >
          <div className="flex flex-wrap justify-center gap-2">
            <Button type="button" onClick={() => setPickerOpen(true)}>
              <Package className="h-4 w-4" />
              Parcourir le catalogue
            </Button>
            <Button type="button" variant="secondary" onClick={addBlankLine}>
              Saisie libre
            </Button>
          </div>
        </div>
      ) : (
        <div className={cn(!isQuill && (embedded ? "border border-slate-200" : "rounded-xl border border-black/[0.08]"))}>
          <div className={cn(!isQuill && "-mx-1 overflow-x-auto px-1 pb-1")}>
            <table
              className={cn(
                "w-full border-collapse",
                // Fixed layout so Article has a real column width and wraps like Excel.
                (isQuill || embedded) && "table-fixed",
                embedded ? "min-w-0 text-[11px]" : "min-w-[760px] text-sm",
              )}
            >
              <thead>
                <tr>
                  {!readOnly && !isQuill ? <th className={`${lineHeadClass} w-7`} /> : null}
                  <th className={cn(lineHeadClass, isQuill ? "w-auto" : "min-w-[9rem]")}>
                    {isQuill ? t(lang, "item") : "Désignation"}
                  </th>
                  {!isQuill ? <th className={`${lineHeadClass} w-20`}>Unité</th> : null}
                  <th className={`${lineHeadClass} ${isQuill ? "w-20" : "w-12"} text-right`}>
                    {isQuill ? t(lang, "qty") : "Qté"}
                  </th>
                  {!hideAmounts ? (
                    <th className={`${lineHeadClass} ${isQuill ? "w-[9.5rem]" : "w-[9.5rem]"} text-right`}>
                      {isQuill
                        ? showTtc
                          ? `${t(lang, "rate")} ${t(lang, "ht")} / ${t(lang, "ttc")}`
                          : t(lang, "rate")
                        : showTtc
                          ? "PU HT / TTC"
                          : "PU HT"}
                    </th>
                  ) : null}
                  {!hideAmounts ? (
                    <th className={`${lineHeadClass} ${isQuill ? "w-28" : "w-[7rem]"} text-right`}>
                      {isQuill ? t(lang, "amount") : "Total"}
                    </th>
                  ) : null}
                  {!readOnly ? <th className={`${lineHeadClass} w-24`} /> : null}
                </tr>
              </thead>
              <tbody>
                {lines.map((line, index) =>
                  line.isNote ? (
                    <tr key={index} className="bg-amber-50/50">
                      {!readOnly && !isQuill ? <td className={lineCellClass} /> : null}
                      <td
                        colSpan={
                          isQuill
                            ? hideAmounts
                              ? 2
                              : 4
                            : hideAmounts
                              ? 3
                              : 5
                        }
                        className={lineCellClass}
                      >
                        <div className="flex items-start gap-2">
                          <StickyNote className="mt-2 h-4 w-4 shrink-0 text-amber-600" />
                          {readOnly ? (
                            <p className="whitespace-pre-wrap break-words text-sm italic text-[#374151]">
                              {line.designation}
                            </p>
                          ) : (
                            <AutoGrowTextarea
                              className={cn(
                                "min-h-[52px] flex-1 border border-amber-200/80 bg-white px-2 py-1.5 text-sm italic text-[#374151] outline-none focus:ring-1 focus:ring-amber-200",
                                isQuill || !embedded ? "rounded-md" : "rounded-none",
                              )}
                              value={line.designation}
                              onChange={(e) => updateLine(index, { designation: e.target.value })}
                              placeholder="Note…"
                              minRows={2}
                            />
                          )}
                        </div>
                      </td>
                      {!readOnly ? (
                        <td className={lineCellClass}>
                          <RowActions
                            onDuplicate={() => duplicateLine(index)}
                            onRemove={() => removeLine(index)}
                          />
                        </td>
                      ) : null}
                    </tr>
                  ) : (
                    <tr key={index} className="group">
                      {!readOnly && !isQuill ? (
                        <td className={`${lineCellClass} text-center text-[10px] tabular-nums text-[#D1D5DB]`}>
                          {index + 1}
                        </td>
                      ) : null}
                      <td className={cn(lineCellClass, "min-w-0", isQuill && "w-full")}>
                        {readOnly ? (
                          <p className="whitespace-pre-wrap break-words">{line.designation}</p>
                        ) : (
                          <AutoGrowTextarea
                            className={cn(lineTextClass, "min-w-0 max-w-full")}
                            value={line.designation}
                            onChange={(e) => updateLine(index, { designation: e.target.value })}
                            placeholder={
                              isQuill
                                ? "Description de l'article ou service…"
                                : "Désignation de l'article ou service"
                            }
                            minRows={1}
                          />
                        )}
                      </td>
                      {!isQuill ? (
                        <td className={lineCellClass}>
                          {readOnly ? (
                            line.unit
                          ) : (
                            <select
                              className={lineNumericClass}
                              value={line.unit}
                              onChange={(e) => updateLine(index, { unit: e.target.value })}
                            >
                              {PRODUCT_UNITS.map((u) => (
                                <option key={u} value={u}>
                                  {u}
                                </option>
                              ))}
                            </select>
                          )}
                        </td>
                      ) : null}
                      <td className={`${lineCellClass} text-right`}>
                        {readOnly ? (
                          <span className="tabular-nums">{line.qty}</span>
                        ) : (
                          <QtyInput
                            value={line.qty}
                            onChange={(qty) => updateLine(index, { qty })}
                            className={lineNumericClass}
                          />
                        )}
                      </td>
                      {!hideAmounts ? (
                        <td className={`${lineCellClass} align-top text-right`}>
                          <PuHtTtcCell
                            valueHt={line.unitPriceHt}
                            vatRate={vatRate}
                            readOnly={readOnly}
                            showTtc={showTtc}
                            onChangeHt={(v) => updateLine(index, { unitPriceHt: v })}
                            inputClassName={lineNumericClass}
                          />
                        </td>
                      ) : null}
                      {!hideAmounts ? (
                        <td
                          className={`${lineCellClass} whitespace-nowrap text-right font-semibold tabular-nums text-ink`}
                        >
                          <div className="leading-tight">
                            <p>{formatMoney(roundMoney(line.qty * line.unitPriceHt))}</p>
                            {showTtc ? (
                              <p className="text-[10px] font-normal text-ink-muted">
                                {formatMoney(lineTotalTtc(line.qty, line.unitPriceHt, vatRate))} TTC
                              </p>
                            ) : null}
                          </div>
                        </td>
                      ) : null}
                      {!readOnly ? (
                        <td className={lineCellClass}>
                          <RowActions
                            onDuplicate={() => duplicateLine(index)}
                            onRemove={() => removeLine(index)}
                          />
                        </td>
                      ) : null}
                    </tr>
                  ),
                )}
              </tbody>
            </table>
            {embedded && !readOnly ? (
              <button
                type="button"
                onClick={addBlankLine}
                className={cn(
                  "flex w-full items-center justify-center gap-1.5 py-2.5 text-[13px] font-medium",
                  isQuill
                    ? "border border-t-0 border-slate-200 bg-[#f3f4f6] text-slate-600 hover:bg-slate-200/70 hover:text-slate-800"
                    : "border-t border-slate-200 bg-[#f3f4f6] text-slate-600 hover:bg-slate-200/70 hover:text-slate-800",
                )}
              >
                <Plus className="h-3.5 w-3.5" strokeWidth={2.25} />
                Ligne
              </button>
            ) : null}
          </div>
        </div>
      )}

      {embedded ? (
        <div className="mt-3 mb-1 flex flex-col items-end gap-2 pr-2">
          {isQuill && !readOnly ? (
            <button
              type="button"
              onClick={() => setPickerOpen(true)}
              className="text-[0.75em] font-medium text-slate-400 hover:text-teal-600"
            >
              Catalogue…
            </button>
          ) : null}
          {cachetControls}
        </div>
      ) : null}

      {pickerOpen ? (
        <CatalogPicker
          catalog={filteredCatalog}
          query={pickerQuery}
          onQueryChange={setPickerQuery}
          onSelect={addFromCatalog}
          onClose={() => setPickerOpen(false)}
          totalCount={catalog.length}
          vatRate={vatRate}
          currency={currency}
        />
      ) : null}
    </Wrapper>
  );
}

function RowActions({
  onDuplicate,
  onRemove,
}: {
  onDuplicate: () => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-center justify-end gap-1 opacity-90 transition group-hover:opacity-100">
      <button
        type="button"
        onClick={onDuplicate}
        className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-slate-50 hover:text-slate-900"
        aria-label="Dupliquer la ligne"
        title="Dupliquer"
      >
        <Copy className="h-4 w-4" strokeWidth={2.25} />
      </button>
      <button
        type="button"
        onClick={onRemove}
        className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 shadow-sm hover:border-red-200 hover:bg-red-50 hover:text-red-600"
        aria-label="Supprimer la ligne"
        title="Supprimer"
      >
        <Trash2 className="h-4 w-4" strokeWidth={2.25} />
      </button>
    </div>
  );
}

function CatalogPicker({
  catalog,
  query,
  onQueryChange,
  onSelect,
  onClose,
  totalCount,
  vatRate,
  currency = DEFAULT_CURRENCY,
}: {
  catalog: CatalogItem[];
  query: string;
  onQueryChange: (q: string) => void;
  onSelect: (item: CatalogItem) => void;
  onClose: () => void;
  totalCount: number;
  vatRate: number;
  currency?: string;
}) {
  const [tab, setTab] = useState<"list" | "create">(totalCount === 0 ? "create" : "list");

  return (
    <DataSheet
      open
      onClose={onClose}
      width={DATA_SHEET_WIDTH_WIDE}
      title="Catalogue"
      footer={
        <Button type="button" variant="secondary" onClick={onClose}>
          Terminer la sélection
        </Button>
      }
    >
      <div className="flex gap-1 pb-4">
        <button
          type="button"
          onClick={() => setTab("list")}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
            tab === "list"
              ? "bg-brand text-white"
              : "text-[#6B7280] hover:bg-black/[0.04]"
          }`}
        >
          Articles ({totalCount})
        </button>
        <button
          type="button"
          onClick={() => setTab("create")}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
            tab === "create"
              ? "bg-brand text-white"
              : "text-[#6B7280] hover:bg-black/[0.04]"
          }`}
        >
          Nouveau
        </button>
      </div>

      {tab === "list" ? (
        <>
          <input
            autoFocus
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Rechercher référence ou désignation…"
            className={inputDenseClass}
          />
          <div className="mt-3">
            {totalCount === 0 ? (
              <div className="rounded-xl border border-dashed border-black/[0.1] p-6 text-center">
                <p className="text-sm text-[#6B7280]">Votre catalogue est vide.</p>
                <Button className="mt-3" size="sm" onClick={() => setTab("create")}>
                  <Plus className="h-4 w-4" />
                  Créer un premier article
                </Button>
              </div>
            ) : catalog.length === 0 ? (
              <p className="py-8 text-center text-sm text-[#9CA3AF]">Aucun résultat pour cette recherche.</p>
            ) : (
              <ul className="space-y-1.5">
                {catalog.map((item) => (
                  <li key={item._id}>
                    <button
                      type="button"
                      onClick={() => onSelect(item)}
                      className="flex w-full items-center justify-between gap-3 rounded-xl border border-black/[0.06] px-3 py-3 text-left transition hover:border-brand/15 hover:bg-[#FAFBFC] active:scale-[0.99]"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-ink">
                          {item.reference}
                        </p>
                        <p className="truncate text-xs text-[#6B7280]">{item.designation}</p>
                          <p className="mt-0.5 text-[11px] tabular-nums text-[#9CA3AF]">
                            {item.unit} · HT {formatMoney(item.unitPriceHt)} · TTC{" "}
                            {formatMoney(htToTtc(item.unitPriceHt, vatRate))} {currency}
                          </p>
                      </div>
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand text-white">
                        <Plus className="h-4 w-4" />
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      ) : (
        <CatalogCreateRow
          vatRate={vatRate}
          onCreated={(item) => {
            onSelect(item);
            setTab("list");
          }}
          onCancel={() => setTab("list")}
        />
      )}
    </DataSheet>
  );
}
