"use client";

import { useMutation, useQuery } from "convex/react";
import { useSearchParams } from "next/navigation";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { EntityCrudPanel } from "@/components/master-data/EntityCrudPanel";

const FIELDS = [
  { key: "name", label: "Nom / Raison sociale", required: true },
  { key: "representative", label: "Personne représentée" },
  { key: "ice", label: "ICE" },
  { key: "city", label: "Ville" },
  { key: "address", label: "Adresse" },
  { key: "phone", label: "Téléphone" },
  { key: "email", label: "Email" },
];

type ClientRow = {
  _id: string;
  name: string;
  ice: string;
  city: string;
  address: string;
  phone: string;
  email: string;
  representative: string;
};

export default function ClientsPageClient() {
  const searchParams = useSearchParams();
  const clients = useQuery(api.clients.list, {}) as ClientRow[] | undefined;
  const create = useMutation(api.clients.create);
  const update = useMutation(api.clients.update);
  const remove = useMutation(api.clients.remove);

  return (
    <EntityCrudPanel<ClientRow>
      title="Clients"
      items={clients}
      fields={FIELDS}
      emptyLabel="Aucun client enregistré."
      getLabel={(c) => c.name}
      initialOpen={searchParams.get("new") === "1"}
      onCreate={async (values) => {
        await create({
          name: values.name,
          representative: values.representative,
          ice: values.ice,
          city: values.city,
          address: values.address,
          phone: values.phone,
          email: values.email,
        });
      }}
      onUpdate={async (id, values) => {
        await update({
          id: id as Id<"clients">,
          name: values.name,
          representative: values.representative,
          ice: values.ice,
          city: values.city,
          address: values.address,
          phone: values.phone,
          email: values.email,
        });
      }}
      onRemove={async (id) => {
        await remove({ id: id as Id<"clients"> });
      }}
    />
  );
}
