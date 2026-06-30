"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Copy, FileText, Package, Plus, StickyNote, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";
import { CatalogCreateRow } from "@/components/documents/CounterpartyDatasheet";
import { DataSheet, DATA_SHEET_WIDTH_WIDE } from "@/components/datasheet/DataSheet";
import { HtTtcField } from "@/components/ui/ht-ttc-field";
import { inputDenseClass, sectionTitleClass, tableCellClass, tableHeadClass } from "@/lib/design";
import type { LineItem } from "@/lib/documents";
import { PRODUCT_UNITS } from "@/lib/documents";
import { formatMoney, htToTtc, lineTotalTtc } from "@/lib/money";

type CatalogItem = {
  _id: string;
  reference: string;
  designation: string;
  unit: string;
  unitPriceHt: number;
};

export function LineItemsEditor({
  lines,
  onChange,
  catalog,
  readOnly,
  hideAmounts,
  vatRate = 20,
  autoOpenCatalog,
}: {
  lines: LineItem[];
  onChange: (lines: LineItem[]) => void;
  catalog: CatalogItem[];
  readOnly?: boolean;
  hideAmounts?: boolean;
  vatRate?: number;
  /** Open catalog picker once on mount (new documents) */
  autoOpenCatalog?: boolean;
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

  return (
    <section>
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

      {lines.length === 0 && !readOnly ? (
        <div className="rounded-2xl border-2 border-dashed border-black/[0.08] bg-[#FAFBFC] px-4 py-10 text-center">
          <FileText className="mx-auto h-8 w-8 text-[#D1D5DB]" strokeWidth={1.5} />
          <p className="mt-3 text-sm font-medium text-ink">Commencez par ajouter des lignes</p>
          <p className="mt-1 text-xs text-[#6B7280]">
            Choisissez dans votre catalogue ou saisissez une ligne libre.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
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
        <div className="overflow-hidden rounded-xl border border-black/[0.08]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] border-collapse text-sm">
              <thead>
                <tr>
                  {!readOnly ? <th className={`${tableHeadClass} w-8`} /> : null}
                  <th className={`${tableHeadClass} w-[72px]`}>Réf.</th>
                  <th className={`${tableHeadClass} min-w-[200px]`}>Désignation</th>
                  <th className={`${tableHeadClass} w-16`}>Unité</th>
                  <th className={`${tableHeadClass} w-20 text-right`}>Qté</th>
                  {!hideAmounts ? (
                    <th className={`${tableHeadClass} min-w-[140px] text-right`}>PU HT / TTC</th>
                  ) : null}
                  {!hideAmounts ? (
                    <th className={`${tableHeadClass} w-24 text-right`}>Total TTC</th>
                  ) : null}
                  {!readOnly ? <th className={`${tableHeadClass} w-20`} /> : null}
                </tr>
              </thead>
              <tbody>
                {lines.map((line, index) =>
                  line.isNote ? (
                    <tr key={index} className="bg-amber-50/50">
                      {!readOnly ? <td className={tableCellClass} /> : null}
                      <td colSpan={hideAmounts ? 4 : 6} className={tableCellClass}>
                        <div className="flex items-start gap-2">
                          <StickyNote className="mt-2 h-4 w-4 shrink-0 text-amber-600" />
                          {readOnly ? (
                            <p className="text-sm italic text-[#374151]">{line.designation}</p>
                          ) : (
                            <textarea
                              className="min-h-[52px] flex-1 rounded-lg border border-amber-200/80 bg-white px-2 py-1.5 text-sm italic text-[#374151] outline-none focus:ring-2 focus:ring-amber-200"
                              value={line.designation}
                              onChange={(e) => updateLine(index, { designation: e.target.value })}
                              placeholder="Texte de note (visible sur le document)…"
                              rows={2}
                            />
                          )}
                        </div>
                      </td>
                      {!readOnly ? (
                        <td className={tableCellClass}>
                          <RowActions onDuplicate={() => duplicateLine(index)} onRemove={() => requestRemoveLine(index)} />
                        </td>
                      ) : null}
                    </tr>
                  ) : (
                    <tr key={index} className="group">
                      {!readOnly ? (
                        <td className={`${tableCellClass} text-center text-[10px] tabular-nums text-[#D1D5DB]`}>
                          {index + 1}
                        </td>
                      ) : null}
                      <td className={tableCellClass}>
                        {readOnly ? (
                          line.reference || "—"
                        ) : (
                          <input
                            className={inputDenseClass}
                            value={line.reference}
                            onChange={(e) => updateLine(index, { reference: e.target.value })}
                            placeholder="Réf."
                          />
                        )}
                      </td>
                      <td className={tableCellClass}>
                        {readOnly ? (
                          line.designation
                        ) : (
                          <input
                            className={inputDenseClass}
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
                      <td className={tableCellClass}>
                        {readOnly ? (
                          line.unit
                        ) : (
                          <select
                            className={inputDenseClass}
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
                      <td className={`${tableCellClass} text-right`}>
                        {readOnly ? (
                          <span className="tabular-nums">{line.qty}</span>
                        ) : (
                          <input
                            type="number"
                            min={0}
                            step={0.01}
                            className={`${inputDenseClass} text-right`}
                            value={line.qty}
                            onChange={(e) =>
                              updateLine(index, { qty: parseFloat(e.target.value) || 0 })
                            }
                          />
                        )}
                      </td>
                      {!hideAmounts ? (
                        <td className={`${tableCellClass} text-right`}>
                          {readOnly ? (
                            <div className="text-right text-xs tabular-nums">
                              <p>{formatMoney(line.unitPriceHt)} HT</p>
                              <p className="text-[#9CA3AF]">
                                {formatMoney(htToTtc(line.unitPriceHt, vatRate))} TTC
                              </p>
                            </div>
                          ) : (
                            <HtTtcField
                              valueHt={line.unitPriceHt}
                              vatRate={vatRate}
                              onChangeHt={(v) => updateLine(index, { unitPriceHt: v })}
                              compact
                              showLabels={false}
                            />
                          )}
                        </td>
                      ) : null}
                      {!hideAmounts ? (
                        <td className={`${tableCellClass} text-right font-semibold tabular-nums text-ink`}>
                          {formatMoney(lineTotalTtc(line.qty, line.unitPriceHt, vatRate))}
                        </td>
                      ) : null}
                      {!readOnly ? (
                        <td className={tableCellClass}>
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

      {!readOnly && lines.length > 0 ? (
        <p className="mt-2 text-[11px] text-[#9CA3AF]">
          Astuce : appuyez sur <kbd className="rounded border px-1">Entrée</kbd> dans la dernière
          désignation pour ajouter une ligne.
        </p>
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
    </section>
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
    <div className="flex justify-end gap-0.5 opacity-60 transition group-hover:opacity-100">
      <button
        type="button"
        onClick={onDuplicate}
        className="rounded-md p-1.5 text-[#9CA3AF] hover:bg-[#F3F4F6] hover:text-[#374151]"
        aria-label="Dupliquer"
        title="Dupliquer la ligne"
      >
        <Copy className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        onClick={onRemove}
        className="rounded-md p-1.5 text-[#9CA3AF] hover:bg-red-50 hover:text-red-600"
        aria-label="Supprimer"
      >
        <Trash2 className="h-3.5 w-3.5" />
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
      description="Sélectionnez ou créez un article — la fiche reste ouverte pour ajouts multiples."
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
