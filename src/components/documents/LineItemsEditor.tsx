"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Copy, MoreHorizontal, Package, Plus, StickyNote, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";
import { CatalogCreateRow } from "@/components/documents/CounterpartyDatasheet";
import { DataSheet, DATA_SHEET_WIDTH_WIDE } from "@/components/datasheet/DataSheet";
import { docFieldDenseClass, inputDenseClass, sectionTitleClass, tableHeadClass } from "@/lib/design";
import type { LineItem } from "@/lib/documents";
import { PRODUCT_UNITS } from "@/lib/documents";
import { formatMoney, htToTtc, lineTotalTtc } from "@/lib/money";
import { cn } from "@/lib/utils";

type CatalogItem = {
  _id: string;
  reference: string;
  designation: string;
  unit: string;
  unitPriceHt: number;
};

function parseAmount(raw: string): number | null {
  const cleaned = raw.replace(/[^0-9.,]/g, "").replace(",", ".");
  if (cleaned === "") return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? Math.max(0, n) : null;
}

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
      setDraft(value === 0 ? "" : formatMoney(value));
    }
  }, [value, editing]);

  return (
    <input
      type="text"
      inputMode="decimal"
      className={cn(className ?? inputDenseClass, "min-w-[5.25rem] text-right")}
      value={editing ? draft : value === 0 ? "" : formatMoney(value)}
      onFocus={() => {
        setEditing(true);
        setDraft(value === 0 ? "" : String(value));
      }}
      onBlur={() => {
        onChange(parseAmount(draft) ?? 0);
        setEditing(false);
      }}
      onChange={(e) => {
        setDraft(e.target.value);
        const parsed = parseAmount(e.target.value);
        if (parsed != null) onChange(parsed);
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
}: {
  valueHt: number;
  vatRate: number;
  onChangeHt: (value: number) => void;
  readOnly?: boolean;
  inputClassName?: string;
}) {
  const ttc = htToTtc(valueHt, vatRate);

  if (readOnly) {
    return (
      <div className="text-right tabular-nums">
        <p>{formatMoney(valueHt)}</p>
        <p className="text-[10px] leading-tight text-ink-muted">{formatMoney(ttc)} TTC</p>
      </div>
    );
  }

  return (
    <div className="min-w-[5.25rem] text-right">
      <AmountInput value={valueHt} onChange={onChangeHt} placeholder="HT" className={inputClassName} />
      <p className="mt-0.5 text-[10px] leading-tight tabular-nums text-ink-muted">
        {valueHt > 0 ? `${formatMoney(ttc)} TTC` : "TTC"}
      </p>
    </div>
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
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerQuery, setPickerQuery] = useState("");
  const [lineToRemove, setLineToRemove] = useState<number | null>(null);
  const autoOpened = useRef(false);

  useEffect(() => {
    if (autoOpenCatalog && lines.length === 0 && !autoOpened.current) {
      autoOpened.current = true;
      setPickerOpen(true);
    }
  }, [autoOpenCatalog, lines.length]);

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
  const lineFieldClass = embedded ? docFieldDenseClass : inputDenseClass;
  const lineHeadClass = embedded
    ? cn(
        `${tableHeadClass} px-1.5 py-1 text-[10px]`,
        darkHead && "!border-slate-900 !bg-slate-900 !text-white",
      )
    : `${tableHeadClass} px-2 py-2`;
  const lineCellClass = embedded
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

  function requestRemoveLine(index: number) {
    setLineToRemove(index);
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
      ) : !readOnly ? (
        <div className="mb-2 flex flex-wrap justify-end gap-1">
          <Button type="button" variant="default" size="sm" className="h-7 px-2 text-[10px]" onClick={() => setPickerOpen(true)}>
            <Package className="h-3 w-3" />
            Catalogue
          </Button>
          <Button type="button" variant="secondary" size="sm" className="h-7 px-2 text-[10px]" onClick={addBlankLine}>
            <Plus className="h-3 w-3" />
            Ligne
          </Button>
          <Button type="button" variant="outline" size="sm" className="h-7 px-2 text-[10px]" onClick={addNoteLine}>
            <StickyNote className="h-3 w-3" />
            Note
          </Button>
        </div>
      ) : null}

      {lines.length === 0 && !readOnly ? (
        <div
          className={cn(
            "border-2 border-dashed border-black/[0.08] bg-[#FAFBFC] px-4 py-6 text-center",
            embedded ? "border-slate-300" : "rounded-xl",
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
        <div className={cn(embedded ? "border border-slate-200" : "rounded-xl border border-black/[0.08]")}>
          <div className="-mx-1 overflow-x-auto px-1 pb-1">
            <table className={cn("w-full border-collapse", embedded ? "min-w-0 text-[11px]" : "min-w-[760px] text-sm")}>
              <thead>
                <tr>
                  {!readOnly ? <th className={`${lineHeadClass} w-7`} /> : null}
                  <th className={`${lineHeadClass} min-w-[9rem]`}>Désignation</th>
                  <th className={`${lineHeadClass} w-20`}>Unité</th>
                  <th className={`${lineHeadClass} w-12 text-right`}>Qté</th>
                  {!hideAmounts ? (
                    <th className={`${lineHeadClass} w-[6.5rem] text-right`}>PU HT</th>
                  ) : null}
                  {!hideAmounts ? (
                    <th className={`${lineHeadClass} w-[7rem] text-right`}>Total</th>
                  ) : null}
                  {!readOnly ? <th className={`${lineHeadClass} w-8`} /> : null}
                </tr>
              </thead>
              <tbody>
                {lines.map((line, index) =>
                  line.isNote ? (
                    <tr key={index} className="bg-amber-50/50">
                      {!readOnly ? <td className={lineCellClass} /> : null}
                      <td colSpan={hideAmounts ? 3 : 5} className={lineCellClass}>
                        <div className="flex items-start gap-2">
                          <StickyNote className="mt-2 h-4 w-4 shrink-0 text-amber-600" />
                          {readOnly ? (
                            <p className="text-sm italic text-[#374151]">{line.designation}</p>
                          ) : (
                            <textarea
                              className={cn(
                                "min-h-[52px] flex-1 border border-amber-200/80 bg-white px-2 py-1.5 text-sm italic text-[#374151] outline-none focus:ring-1 focus:ring-amber-200",
                                embedded ? "rounded-none" : "rounded-lg focus:ring-2",
                              )}
                              value={line.designation}
                              onChange={(e) => updateLine(index, { designation: e.target.value })}
                              placeholder="Note…"
                              rows={2}
                            />
                          )}
                        </div>
                      </td>
                      {!readOnly ? (
                        <td className={lineCellClass}>
                          <RowActions onDuplicate={() => duplicateLine(index)} onRemove={() => requestRemoveLine(index)} />
                        </td>
                      ) : null}
                    </tr>
                  ) : (
                    <tr key={index} className="group">
                      {!readOnly ? (
                        <td className={`${lineCellClass} text-center text-[10px] tabular-nums text-[#D1D5DB]`}>
                          {index + 1}
                        </td>
                      ) : null}
                      <td className={lineCellClass}>
                        {readOnly ? (
                          line.designation
                        ) : (
                          <input
                            className={lineFieldClass}
                            value={line.designation}
                            onChange={(e) => updateLine(index, { designation: e.target.value })}
                            placeholder="Désignation de l'article ou service"
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && index === lines.length - 1) {
                                e.preventDefault();
                                addBlankLine();
                              }
                            }}
                          />
                        )}
                      </td>
                      <td className={lineCellClass}>
                        {readOnly ? (
                          line.unit
                        ) : (
                          <select
                            className={lineFieldClass}
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
                      <td className={`${lineCellClass} text-right`}>
                        {readOnly ? (
                          <span className="tabular-nums">{line.qty}</span>
                        ) : (
                          <QtyInput
                            value={line.qty}
                            onChange={(qty) => updateLine(index, { qty })}
                            className={lineFieldClass}
                          />
                        )}
                      </td>
                      {!hideAmounts ? (
                        <td className={`${lineCellClass} align-top text-right`}>
                          <PuHtTtcCell
                            valueHt={line.unitPriceHt}
                            vatRate={vatRate}
                            readOnly={readOnly}
                            onChangeHt={(v) => updateLine(index, { unitPriceHt: v })}
                            inputClassName={lineFieldClass}
                          />
                        </td>
                      ) : null}
                      {!hideAmounts ? (
                        <td
                          className={`${lineCellClass} whitespace-nowrap text-right font-semibold tabular-nums text-ink`}
                        >
                          {formatMoney(lineTotalTtc(line.qty, line.unitPriceHt, vatRate))}
                        </td>
                      ) : null}
                      {!readOnly ? (
                        <td className={lineCellClass}>
                          <RowActions
                            onDuplicate={() => duplicateLine(index)}
                            onRemove={() => requestRemoveLine(index)}
                          />
                        </td>
                      ) : null}
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {pickerOpen ? (
        <CatalogPicker
          catalog={filteredCatalog}
          query={pickerQuery}
          onQueryChange={setPickerQuery}
          onSelect={addFromCatalog}
          onClose={() => setPickerOpen(false)}
          totalCount={catalog.length}
          vatRate={vatRate}
        />
      ) : null}

      <ConfirmDeleteDialog
        open={lineToRemove != null}
        onClose={() => setLineToRemove(null)}
        title="Supprimer cette ligne ?"
        description={
          lineToRemove != null && lines[lineToRemove]?.isNote
            ? "Cette note sera retirée du document."
            : "Cette ligne sera retirée du document."
        }
        confirmLabel="Supprimer la ligne"
        onConfirm={() => {
          if (lineToRemove == null) return;
          removeLine(lineToRemove);
          setLineToRemove(null);
        }}
      />
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
  const [open, setOpen] = useState(false);

  return (
    <div className="relative flex justify-end opacity-60 transition group-hover:opacity-100">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="rounded-md p-1.5 text-[#9CA3AF] hover:bg-[#F3F4F6] hover:text-[#374151]"
        aria-label="Actions sur la ligne"
        aria-expanded={open}
      >
        <MoreHorizontal className="h-3.5 w-3.5" />
      </button>

      {open ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 cursor-default"
            aria-label="Fermer le menu"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-[calc(100%+4px)] z-50 w-36 overflow-hidden rounded-lg border border-black/[0.08] bg-white py-1 shadow-lg">
            <button
              type="button"
              onClick={() => {
                onDuplicate();
                setOpen(false);
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-ink transition hover:bg-black/[0.04]"
            >
              <Copy className="h-3.5 w-3.5 text-[#9CA3AF]" />
              Dupliquer
            </button>
            <button
              type="button"
              onClick={() => {
                onRemove();
                setOpen(false);
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 transition hover:bg-red-50"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Supprimer
            </button>
          </div>
        </>
      ) : null}
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
}: {
  catalog: CatalogItem[];
  query: string;
  onQueryChange: (q: string) => void;
  onSelect: (item: CatalogItem) => void;
  onClose: () => void;
  totalCount: number;
  vatRate: number;
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
                            {formatMoney(htToTtc(item.unitPriceHt, vatRate))} MAD
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
