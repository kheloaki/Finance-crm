"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Plus, Search } from "lucide-react";
import { ClientDatasheet, SupplierDatasheet } from "@/components/documents/CounterpartyDatasheet";
import { DataSheet } from "@/components/datasheet/DataSheet";
import { Button } from "@/components/ui/button";
import type { Client, Supplier } from "@/lib/convex-types";
import { cn } from "@/lib/utils";

type ClientRow = Client & { phone?: string; email?: string };
type SupplierRow = Supplier & { contact?: string };

export type CounterpartySelection = {
  id: string;
  guestName: string;
};

export function CounterpartySelectWithSheet({
  kind,
  clients,
  suppliers,
  valueId,
  guestName,
  onChange,
  readOnly,
  fieldClassName,
}: {
  kind: "client" | "supplier";
  clients?: ClientRow[];
  suppliers?: SupplierRow[];
  valueId: string;
  guestName: string;
  onChange: (next: CounterpartySelection) => void;
  readOnly?: boolean;
  fieldClassName?: string;
}) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const skipCommitRef = useRef(false);
  const isClient = kind === "client";

  const options = useMemo(() => {
    if (isClient) {
      return (clients ?? []).map((c) => ({
        value: c._id,
        label: c.name,
        hint: c.ice || c.city || undefined,
      }));
    }
    return (suppliers ?? []).map((s) => ({
      value: s._id,
      label: s.name,
      hint: s.ice || s.city || undefined,
    }));
  }, [isClient, clients, suppliers]);

  const selectedLabel = options.find((o) => o.value === valueId)?.label;
  const displayValue = selectedLabel ?? guestName;

  useEffect(() => {
    if (!menuOpen) setDraft(displayValue);
  }, [displayValue, menuOpen]);

  useEffect(() => {
    if (!menuOpen) return;
    function onPointerDown(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [menuOpen]);

  const filtered = useMemo(() => {
    const q = draft.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (o) =>
        o.label.toLowerCase().includes(q) ||
        (o.hint?.toLowerCase().includes(q) ?? false),
    );
  }, [options, draft]);

  const trimmedDraft = draft.trim();
  const exactMatch = options.find(
    (o) => o.label.toLowerCase() === trimmedDraft.toLowerCase(),
  );
  const showUseTyped = !!trimmedDraft && !exactMatch;

  function commitDraft() {
    if (skipCommitRef.current) {
      skipCommitRef.current = false;
      return;
    }
    const next = draft.trim();
    if (!next) {
      onChange({ id: "", guestName: "" });
      return;
    }
    const match = options.find((o) => o.label.toLowerCase() === next.toLowerCase());
    if (match) {
      onChange({ id: match.value, guestName: "" });
      return;
    }
    onChange({ id: "", guestName: next });
  }

  function selectSaved(id: string) {
    skipCommitRef.current = true;
    const label = options.find((o) => o.value === id)?.label ?? "";
    setDraft(label);
    onChange({ id, guestName: "" });
    setMenuOpen(false);
  }

  function selectGuest(name: string) {
    skipCommitRef.current = true;
    const next = name.trim();
    setDraft(next);
    onChange({ id: "", guestName: next });
    setMenuOpen(false);
  }

  function handleSelectFromSheet(id: string) {
    onChange({ id, guestName: "" });
    setSheetOpen(false);
  }

  if (readOnly) {
    return (
      <p className={cn("min-h-[32px] text-sm font-medium text-ink", fieldClassName)}>
        {displayValue || "—"}
      </p>
    );
  }

  return (
    <>
      <div ref={rootRef} className="relative flex gap-2">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={menuOpen ? draft : displayValue}
            onChange={(e) => {
              setDraft(e.target.value);
              setMenuOpen(true);
            }}
            onFocus={() => {
              setDraft(displayValue);
              setMenuOpen(true);
            }}
            onBlur={() => {
              // Defer so list item click can set skipCommitRef first.
              window.setTimeout(() => {
                commitDraft();
                setMenuOpen(false);
              }, 0);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                commitDraft();
                setMenuOpen(false);
              }
              if (e.key === "Escape") {
                setDraft(displayValue);
                setMenuOpen(false);
              }
            }}
            placeholder={
              isClient
                ? "Choisir ou saisir un client…"
                : "Choisir ou saisir un fournisseur…"
            }
            className={cn(
              fieldClassName ??
                "w-full rounded-md border border-slate-300 bg-white px-2 py-1 text-sm outline-none",
              "box-border h-10 min-h-[40px] pl-8 pr-2",
            )}
            autoComplete="off"
          />

          {menuOpen ? (
            <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg">
              <ul className="max-h-52 overflow-y-auto py-1">
                {showUseTyped ? (
                  <li>
                    <button
                      type="button"
                      className="w-full px-3 py-2 text-left text-sm text-teal-700 hover:bg-teal-50"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => selectGuest(trimmedDraft)}
                    >
                      Utiliser « {trimmedDraft} »
                      <span className="mt-0.5 block text-[11px] font-normal text-slate-400">
                        Sans l’enregistrer dans le fichier
                      </span>
                    </button>
                  </li>
                ) : null}
                {filtered.length === 0 && !trimmedDraft ? (
                  <li className="px-3 py-2 text-sm text-slate-400">
                    {isClient
                      ? "Aucun client — saisissez un nom"
                      : "Aucun fournisseur — saisissez un nom"}
                  </li>
                ) : null}
                {filtered.map((opt) => (
                  <li key={opt.value}>
                    <button
                      type="button"
                      className={cn(
                        "w-full px-3 py-2 text-left text-sm hover:bg-slate-50",
                        opt.value === valueId && "bg-slate-100 font-medium",
                      )}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => selectSaved(opt.value)}
                    >
                      {opt.label}
                      {opt.hint ? (
                        <span className="ml-1 text-xs text-slate-400">({opt.hint})</span>
                      ) : null}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>

        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="h-10 shrink-0 px-3"
          onClick={() => setSheetOpen(true)}
          title={
            isClient
              ? "Enregistrer un nouveau client"
              : "Enregistrer un nouveau fournisseur"
          }
          aria-label={isClient ? "Ajouter un client" : "Ajouter un fournisseur"}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <DataSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title={isClient ? "Nouveau client" : "Nouveau fournisseur"}
        footer={
          <Button type="button" variant="secondary" onClick={() => setSheetOpen(false)}>
            Fermer
          </Button>
        }
      >
        {isClient ? (
          <ClientDatasheet
            clients={clients}
            selectedId={valueId}
            onSelect={handleSelectFromSheet}
            readOnly={readOnly}
            initialAdding
          />
        ) : (
          <SupplierDatasheet
            suppliers={suppliers}
            selectedId={valueId}
            onSelect={handleSelectFromSheet}
            readOnly={readOnly}
            initialAdding
          />
        )}
      </DataSheet>
    </>
  );
}
