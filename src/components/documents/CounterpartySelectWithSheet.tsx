"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { ClientDatasheet, SupplierDatasheet } from "@/components/documents/CounterpartyDatasheet";
import { DataSheet } from "@/components/datasheet/DataSheet";
import { Button } from "@/components/ui/button";
import { SearchableSelect } from "@/components/ui/searchable-select";
import type { Client, Supplier } from "@/lib/convex-types";

type ClientRow = Client & { phone?: string; email?: string };
type SupplierRow = Supplier & { contact?: string };

export function CounterpartySelectWithSheet({
  kind,
  clients,
  suppliers,
  value,
  onChange,
  readOnly,
}: {
  kind: "client" | "supplier";
  clients?: ClientRow[];
  suppliers?: SupplierRow[];
  value: string;
  onChange: (id: string) => void;
  readOnly?: boolean;
}) {
  const [open, setOpen] = useState(false);
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

  function handleSelect(id: string) {
    onChange(id);
    setOpen(false);
  }

  return (
    <>
      <div className="flex gap-2">
        <SearchableSelect
          options={options}
          value={value}
          onChange={onChange}
          placeholder={isClient ? "Choisir un client…" : "Choisir un fournisseur…"}
          disabled={readOnly}
          className="flex-1"
        />
        {!readOnly ? (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="shrink-0 px-3"
            onClick={() => setOpen(true)}
            title={isClient ? "Ajouter un client" : "Ajouter un fournisseur"}
            aria-label={isClient ? "Ajouter un client" : "Ajouter un fournisseur"}
          >
            <Plus className="h-4 w-4" />
          </Button>
        ) : null}
      </div>

      <DataSheet
        open={open}
        onClose={() => setOpen(false)}
        title={isClient ? "Nouveau client" : "Nouveau fournisseur"}
        description={
          isClient
            ? "Créez un client — il sera enregistré dans le référentiel et sélectionné sur ce document."
            : "Créez un fournisseur — il sera enregistré dans le référentiel et sélectionné sur ce document."
        }
        footer={
          <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
            Fermer
          </Button>
        }
      >
        {isClient ? (
          <ClientDatasheet
            clients={clients}
            selectedId={value}
            onSelect={handleSelect}
            readOnly={readOnly}
            initialAdding
          />
        ) : (
          <SupplierDatasheet
            suppliers={suppliers}
            selectedId={value}
            onSelect={handleSelect}
            readOnly={readOnly}
            initialAdding
          />
        )}
      </DataSheet>
    </>
  );
}
