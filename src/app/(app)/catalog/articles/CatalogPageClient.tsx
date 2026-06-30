"use client";

import { useMutation, useQuery } from "convex/react";
import { useSearchParams } from "next/navigation";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { EntityCrudPanel } from "@/components/master-data/EntityCrudPanel";

const FIELDS = [
  { key: "reference", label: "Référence" },
  { key: "designation", label: "Désignation", required: true },
  { key: "unit", label: "Unité", placeholder: "u" },
  { key: "unitPriceHt", label: "Prix HT / TTC", type: "htTtc" as const },
  { key: "category", label: "Catégorie" },
];

type CatalogItemRow = {
  _id: string;
  designation: string;
  unitPriceHt: number;
  reference: string;
  unit: string;
  category?: string;
};

export default function CatalogPageClient({ kind }: { kind: "article" | "service" }) {
  const searchParams = useSearchParams();
  const items = useQuery(api.catalog.listAll, { kind }) as CatalogItemRow[] | undefined;
  const create = useMutation(api.catalog.create);
  const update = useMutation(api.catalog.update);
  const remove = useMutation(api.catalog.remove);

  const title = kind === "article" ? "Articles" : "Services";
  const description =
    kind === "article"
      ? "Catalogue articles pour vos lignes de documents."
      : "Catalogue services pour vos prestations.";

type CatalogDisplayRow = Omit<CatalogItemRow, "unitPriceHt"> & {
  name: string;
  unitPriceHt: string;
};

  return (
    <EntityCrudPanel<CatalogDisplayRow>
      title={title}
      description={description}
      items={items?.map((item) => ({
        ...item,
        name: item.designation,
        unitPriceHt: String(item.unitPriceHt),
      }))}
      fields={FIELDS}
      emptyLabel={`Aucun ${kind === "article" ? "article" : "service"} enregistré.`}
      getLabel={(item) => item.designation}
      initialOpen={searchParams.get("new") === "1"}
      onCreate={async (values) => {
        await create({
          kind,
          reference: values.reference,
          designation: values.designation,
          unit: values.unit || "u",
          unitPriceHt: parseFloat(values.unitPriceHt) || 0,
          category: values.category,
        });
      }}
      onUpdate={async (id, values) => {
        await update({
          id: id as Id<"catalogItems">,
          reference: values.reference,
          designation: values.designation,
          unit: values.unit,
          unitPriceHt: parseFloat(values.unitPriceHt) || 0,
          category: values.category,
        });
      }}
      onRemove={async (id) => {
        await remove({ id: id as Id<"catalogItems"> });
      }}
    />
  );
}
