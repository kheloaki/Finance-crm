"use client";

import { useMemo, useState } from "react";
import { Check, Plus, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { inputDenseClass, tableCellClass, tableHeadClass } from "@/lib/design";
import { cn } from "@/lib/utils";

export type DatasheetField = {
  key: string;
  label: string;
  required?: boolean;
  placeholder?: string;
  type?: "text" | "number";
  /** Show in table columns (defaults to all except hidden) */
  table?: boolean;
  width?: string;
};

type InlineDatasheetProps<T extends { _id: string }> = {
  rows: T[] | undefined;
  fields: DatasheetField[];
  selectedId?: string;
  onSelect?: (row: T) => void;
  onCreate?: (values: Record<string, string>) => Promise<void>;
  getPrimaryLabel: (row: T) => string;
  searchKeys: (keyof T & string)[];
  readOnly?: boolean;
  emptyLabel?: string;
  addLabel?: string;
  compact?: boolean;
  initialAdding?: boolean;
};

function emptyValues(fields: DatasheetField[]) {
  return Object.fromEntries(fields.map((f) => [f.key, ""]));
}

export function InlineDatasheet<T extends { _id: string }>({
  rows,
  fields,
  selectedId,
  onSelect,
  onCreate,
  getPrimaryLabel,
  searchKeys,
  readOnly,
  emptyLabel = "Aucune entrée.",
  addLabel = "Ajouter une ligne",
  compact,
  initialAdding = false,
}: InlineDatasheetProps<T>) {
  const [search, setSearch] = useState("");
  const [adding, setAdding] = useState(initialAdding);
  const [draft, setDraft] = useState<Record<string, string>>(() => emptyValues(fields));
  const [pending, setPending] = useState(false);

  const tableFields = fields.filter((f) => f.table !== false);
  const extraFields = fields.filter((f) => f.table === false);

  const filtered = useMemo(() => {
    const list = rows ?? [];
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter((row) =>
      searchKeys.some((key) =>
        String(row[key] ?? "")
          .toLowerCase()
          .includes(q),
      ),
    );
  }, [rows, search, searchKeys]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!onCreate) return;
    setPending(true);
    try {
      await onCreate(draft);
      setDraft(emptyValues(fields));
      setAdding(false);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className={cn("overflow-hidden rounded-xl border border-black/[0.08] bg-white", compact && "text-sm")}>
      <div className="flex items-center gap-2 border-b border-black/[0.06] bg-[#FAFBFC] px-3 py-2">
        <Search className="h-3.5 w-3.5 shrink-0 text-[#9CA3AF]" />
        {rows === undefined ? (
          <Skeleton className="h-4 min-h-0 flex-1" rounded="sm" />
        ) : (
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filtrer…"
          className="min-h-0 flex-1 border-0 bg-transparent text-sm outline-none placeholder:text-[#9CA3AF]"
          disabled={readOnly}
        />
        )}
        {!readOnly && onCreate ? (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="h-7 shrink-0 px-2 text-xs"
            disabled={rows === undefined}
            onClick={() => {
              setAdding((v) => !v);
              setDraft(emptyValues(fields));
            }}
          >
            <Plus className="h-3.5 w-3.5" />
            {adding ? "Annuler" : "Nouveau"}
          </Button>
        ) : null}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[480px] border-collapse">
          <thead>
            <tr>
              {onSelect ? <th className={`${tableHeadClass} w-8`} /> : null}
              {tableFields.map((f) => (
                <th key={f.key} className={tableHeadClass} style={f.width ? { width: f.width } : undefined}>
                  {f.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows === undefined ? (
              Array.from({ length: 5 }).map((_, row) => (
                <tr key={row}>
                  {onSelect ? (
                    <td className={`${tableCellClass} w-8`}>
                      <Skeleton className="mx-auto h-4 w-4" rounded="sm" />
                    </td>
                  ) : null}
                  {tableFields.map((f, col) => (
                    <td key={f.key} className={tableCellClass}>
                      <Skeleton
                        className={cn("h-8", col === 0 ? "max-w-[130px]" : "w-full max-w-[100px]")}
                        rounded="lg"
                      />
                    </td>
                  ))}
                </tr>
              ))
            ) : filtered.length === 0 && !adding ? (
              <tr>
                <td
                  colSpan={tableFields.length + (onSelect ? 1 : 0)}
                  className={`${tableCellClass} py-6 text-center text-[#6B7280]`}
                >
                  {emptyLabel}
                </td>
              </tr>
            ) : (
              filtered.map((row) => {
                const selected = row._id === selectedId;
                return (
                  <tr
                    key={row._id}
                    className={cn(
                      "transition-colors",
                      onSelect && !readOnly && "cursor-pointer hover:bg-[#FAFBFC]",
                      selected && "bg-brand/[0.04] ring-1 ring-inset ring-brand/10",
                    )}
                    onClick={() => {
                      if (onSelect && !readOnly) onSelect(row);
                    }}
                  >
                    {onSelect ? (
                      <td className={`${tableCellClass} text-center`}>
                        {selected ? <Check className="mx-auto h-4 w-4 text-emerald-600" /> : null}
                      </td>
                    ) : null}
                    {tableFields.map((f) => (
                      <td key={f.key} className={cn(tableCellClass, selected && "font-medium text-ink")}>
                        {f.key === tableFields[0]?.key
                          ? getPrimaryLabel(row)
                          : String((row as Record<string, unknown>)[f.key] ?? "—") || "—"}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}

            {adding && onCreate ? (
              <tr className="bg-[#FAFBFC]">
                {onSelect ? <td className={tableCellClass} /> : null}
                {tableFields.map((f) => (
                  <td key={f.key} className={tableCellClass}>
                    <input
                      type={f.type === "number" ? "number" : "text"}
                      className={inputDenseClass}
                      value={draft[f.key] ?? ""}
                      onChange={(e) => setDraft((d) => ({ ...d, [f.key]: e.target.value }))}
                      placeholder={f.placeholder ?? f.label}
                      required={f.required}
                      step={f.type === "number" ? "0.01" : undefined}
                      min={f.type === "number" ? 0 : undefined}
                    />
                  </td>
                ))}
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {adding && onCreate ? (
        <form
          onSubmit={handleCreate}
          className="space-y-3 border-t border-black/[0.06] bg-[#FAFBFC] px-3 py-3"
        >
          {extraFields.length > 0 ? (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {extraFields.map((f) => (
                <div key={f.key}>
                  <label className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-[#9CA3AF]">
                    {f.label}
                  </label>
                  <input
                    type={f.type === "number" ? "number" : "text"}
                    className={inputDenseClass}
                    value={draft[f.key] ?? ""}
                    onChange={(e) => setDraft((d) => ({ ...d, [f.key]: e.target.value }))}
                    placeholder={f.placeholder ?? f.label}
                    required={f.required}
                  />
                </div>
              ))}
            </div>
          ) : null}
          <div className="flex flex-wrap items-center justify-end gap-2">
            <p className="mr-auto text-[11px] text-[#6B7280]">Nouvelle ligne — enregistrée dans le référentiel</p>
            <Button type="button" variant="ghost" size="sm" onClick={() => setAdding(false)}>
              <X className="h-3.5 w-3.5" />
              Annuler
            </Button>
            <Button type="submit" size="sm" disabled={pending}>
              {pending ? "Enregistrement…" : addLabel}
            </Button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
