"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { EntityCrudPanel } from "@/components/master-data/EntityCrudPanel";

const FIELDS = [
  { key: "name", label: "Nom / Raison sociale", required: true },
  { key: "representative", label: "Personne représentée" },
  { key: "ice", label: "ICE" },
  { key: "city", label: "Ville" },
  { key: "address", label: "Adresse" },
  { key: "contact", label: "Contact" },
  { key: "bankName", label: "Banque" },
  { key: "rib", label: "RIB" },
];

type SupplierRow = {
  _id: string;
  name: string;
  ice: string;
  city: string;
  address: string;
  contact: string;
  representative: string;
  bankName: string;
  rib: string;
};

export default function FournisseursPage() {
  const suppliers = useQuery(api.suppliers.list, {}) as SupplierRow[] | undefined;
  const create = useMutation(api.suppliers.create);
  const update = useMutation(api.suppliers.update);
  const remove = useMutation(api.suppliers.remove);

  return (
    <EntityCrudPanel<SupplierRow>
      title="Fournisseurs"
      items={suppliers}
      fields={FIELDS}
      emptyLabel="Aucun fournisseur enregistré."
      getLabel={(s) => s.name}
      onCreate={async (values) => {
        await create({
          name: values.name,
          representative: values.representative,
          ice: values.ice,
          city: values.city,
          address: values.address,
          contact: values.contact,
          bankName: values.bankName,
          rib: values.rib,
        });
      }}
      onUpdate={async (id, values) => {
        await update({
          id: id as Id<"suppliers">,
          name: values.name,
          representative: values.representative,
          ice: values.ice,
          city: values.city,
          address: values.address,
          contact: values.contact,
          bankName: values.bankName,
          rib: values.rib,
        });
      }}
      onRemove={async (id) => {
        await remove({ id: id as Id<"suppliers"> });
      }}
    />
  );
}
