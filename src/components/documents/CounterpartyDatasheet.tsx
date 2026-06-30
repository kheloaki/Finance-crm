"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { InlineDatasheet, type DatasheetField } from "@/components/datasheet/InlineDatasheet";
import { HtTtcField } from "@/components/ui/ht-ttc-field";
import { Button } from "@/components/ui/button";
import { inputDenseClass } from "@/lib/design";
import type { Client, Supplier } from "@/lib/convex-types";

const CLIENT_FIELDS: DatasheetField[] = [
  { key: "name", label: "Nom", required: true, table: true },
  { key: "representative", label: "Personne représentée", table: false },
  { key: "ice", label: "ICE", table: true, width: "120px" },
  { key: "city", label: "Ville", table: true, width: "100px" },
  { key: "address", label: "Adresse", table: false },
  { key: "phone", label: "Téléphone", table: false },
  { key: "email", label: "Email", table: false },
];

const SUPPLIER_FIELDS: DatasheetField[] = [
  { key: "name", label: "Nom", required: true, table: true },
  { key: "representative", label: "Personne représentée", table: false },
  { key: "ice", label: "ICE", table: true, width: "120px" },
  { key: "city", label: "Ville", table: true, width: "100px" },
  { key: "address", label: "Adresse", table: false },
  { key: "contact", label: "Contact", table: false },
];

type ClientRow = Client & {
  phone?: string;
  email?: string;
};

type SupplierRow = Supplier & {
  contact?: string;
};

export function ClientDatasheet({
  clients,
  selectedId,
  onSelect,
  readOnly,
  initialAdding,
}: {
  clients: ClientRow[] | undefined;
  selectedId: string;
  onSelect: (id: string) => void;
  readOnly?: boolean;
  initialAdding?: boolean;
}) {
  const create = useMutation(api.clients.create);

  return (
    <InlineDatasheet
      rows={clients}
      fields={CLIENT_FIELDS}
      selectedId={selectedId}
      onSelect={(row) => onSelect(row._id)}
      searchKeys={["name", "representative", "ice", "city", "address"]}
      getPrimaryLabel={(row) => row.name}
      readOnly={readOnly}
      emptyLabel="Aucun client — ajoutez une ligne ci-dessous."
      addLabel="Créer le client"
      initialAdding={initialAdding}
      onCreate={
        readOnly
          ? undefined
          : async (values) => {
              const id = await create({
                name: values.name,
                representative: values.representative,
                ice: values.ice,
                city: values.city,
                address: values.address,
                phone: values.phone,
                email: values.email,
              });
              onSelect(String(id));
            }
      }
    />
  );
}

export function SupplierDatasheet({
  suppliers,
  selectedId,
  onSelect,
  readOnly,
  initialAdding,
}: {
  suppliers: SupplierRow[] | undefined;
  selectedId: string;
  onSelect: (id: string) => void;
  readOnly?: boolean;
  initialAdding?: boolean;
}) {
  const create = useMutation(api.suppliers.create);

  return (
    <InlineDatasheet
      rows={suppliers}
      fields={SUPPLIER_FIELDS}
      selectedId={selectedId}
      onSelect={(row) => onSelect(row._id)}
      searchKeys={["name", "representative", "ice", "city", "address"]}
      getPrimaryLabel={(row) => row.name}
      readOnly={readOnly}
      emptyLabel="Aucun fournisseur — ajoutez une ligne ci-dessous."
      addLabel="Créer le fournisseur"
      initialAdding={initialAdding}
      onCreate={
        readOnly
          ? undefined
          : async (values) => {
              const id = await create({
                name: values.name,
                representative: values.representative,
                ice: values.ice,
                city: values.city,
                address: values.address,
                contact: values.contact,
              });
              onSelect(String(id));
            }
      }
    />
  );
}

export type CatalogRow = {
  _id: string;
  reference: string;
  designation: string;
  unit: string;
  unitPriceHt: number;
};

export function CatalogCreateRow({
  vatRate,
  onCreated,
  onCancel,
}: {
  vatRate: number;
  onCreated: (item: CatalogRow) => void;
  onCancel: () => void;
}) {
  const create = useMutation(api.catalog.create);
  const [pending, setPending] = useState(false);
  const [draft, setDraft] = useState({
    reference: "",
    designation: "",
    unit: "u",
    unitPriceHt: 0,
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.designation.trim()) return;
    setPending(true);
    try {
      const id = await create({
        kind: "article",
        reference: draft.reference,
        designation: draft.designation,
        unit: draft.unit || "u",
        unitPriceHt: draft.unitPriceHt,
      });
      onCreated({
        _id: id as Id<"catalogItems">,
        reference: draft.reference || "REF",
        designation: draft.designation.trim(),
        unit: draft.unit || "u",
        unitPriceHt: draft.unitPriceHt,
      });
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-black/[0.08] bg-[#FAFBFC] p-3">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[#6B7280]">
        Nouvel article / service
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <input
          className={inputDenseClass}
          placeholder="Référence"
          value={draft.reference}
          onChange={(e) => setDraft((d) => ({ ...d, reference: e.target.value }))}
        />
        <input
          className={inputDenseClass}
          placeholder="Unité"
          value={draft.unit}
          onChange={(e) => setDraft((d) => ({ ...d, unit: e.target.value }))}
        />
        <input
          className={`${inputDenseClass} sm:col-span-2`}
          placeholder="Désignation *"
          value={draft.designation}
          onChange={(e) => setDraft((d) => ({ ...d, designation: e.target.value }))}
          required
        />
        <div className="sm:col-span-2">
          <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wide text-[#9CA3AF]">
            Prix unitaire (TVA {vatRate}%)
          </p>
          <HtTtcField
            valueHt={draft.unitPriceHt}
            vatRate={vatRate}
            onChangeHt={(v) => setDraft((d) => ({ ...d, unitPriceHt: v }))}
          />
        </div>
      </div>
      <div className="mt-3 flex justify-end gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit" size="sm" disabled={pending || !draft.designation.trim()}>
          {pending ? "Création…" : "Créer et ajouter au document"}
        </Button>
      </div>
    </form>
  );
}
