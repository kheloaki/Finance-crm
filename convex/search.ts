import { v } from "convex/values";
import type { Doc } from "./_generated/dataModel";
import type { QueryCtx } from "./_generated/server";
import { query } from "./_generated/server";
import { requireOrg } from "./lib/auth";

const categoryValidator = v.union(
  v.literal("document"),
  v.literal("project"),
  v.literal("client"),
  v.literal("supplier"),
  v.literal("catalog"),
);

export type SearchResultItem = {
  id: string;
  category: "document" | "project" | "client" | "supplier" | "catalog";
  title: string;
  subtitle: string;
  href: string;
  badge?: string;
};

const DOCUMENT_SLUG: Record<Doc<"documents">["documentType"], string> = {
  devis: "devis",
  bon_commande: "bon-commande",
  bon_livraison: "bon-livraison",
  facture: "facture",
  bon_retour: "bon-retour",
};

const DOCUMENT_LABEL: Record<Doc<"documents">["documentType"], string> = {
  devis: "Devis",
  bon_commande: "Bon de commande",
  bon_livraison: "Bon de livraison",
  facture: "Facture",
  bon_retour: "Bon de retour",
};

async function counterpartyName(ctx: QueryCtx, doc: Doc<"documents">) {
  if (doc.clientId) {
    const c = await ctx.db.get(doc.clientId);
    return c?.name ?? "";
  }
  if (doc.supplierId) {
    const s = await ctx.db.get(doc.supplierId);
    return s?.name ?? "";
  }
  return "";
}

export const global = query({
  args: {
    q: v.string(),
    category: v.optional(categoryValidator),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { organizationId } = await requireOrg(ctx);
    const q = args.q.trim().toLowerCase();
    const max = args.limit ?? 24;
    const perGroup = args.category ? max : 6;

    if (q.length < 1) {
      return { results: [] as SearchResultItem[] };
    }

    const results: SearchResultItem[] = [];
    const cat = args.category;

    if (!cat || cat === "document") {
      const docs = await ctx.db
        .query("documents")
        .withIndex("by_org", (query) => query.eq("organizationId", organizationId))
        .collect();

      const matches = await Promise.all(
        docs.map(async (doc) => {
          const party = await counterpartyName(ctx, doc);
          const matchesDoc =
            doc.number.toLowerCase().includes(q) ||
            doc.reference.toLowerCase().includes(q) ||
            doc.notes.toLowerCase().includes(q) ||
            party.toLowerCase().includes(q);
          if (!matchesDoc) return null;

          let projectName = "";
          if (doc.folderId) {
            const folder = await ctx.db.get(doc.folderId);
            projectName = folder?.name ?? "";
          }
          const slug = DOCUMENT_SLUG[doc.documentType];
          return {
            id: doc._id,
            category: "document" as const,
            title: `${DOCUMENT_LABEL[doc.documentType]} ${doc.number}`,
            subtitle: [party, projectName].filter(Boolean).join(" · ") || doc.date,
            href: `/documents/${slug}/${doc._id}`,
            badge: DOCUMENT_LABEL[doc.documentType],
          };
        }),
      );
      results.push(...(matches.filter(Boolean).slice(0, perGroup) as SearchResultItem[]));
    }

    if (!cat || cat === "project") {
      const folders = await ctx.db
        .query("documentFolders")
        .withIndex("by_org", (query) => query.eq("organizationId", organizationId))
        .collect();

      for (const folder of folders.filter((f) => f.name.toLowerCase().includes(q)).slice(0, perGroup)) {
        results.push({
          id: folder._id,
          category: "project",
          title: folder.name,
          subtitle: "Projet / dossier documents",
          href: `/documents?project=${folder._id}`,
          badge: "Projet",
        });
      }
    }

    if (!cat || cat === "client") {
      const clients = await ctx.db
        .query("clients")
        .withIndex("by_org", (query) => query.eq("organizationId", organizationId))
        .collect();

      for (const client of clients
        .filter(
          (c) =>
            c.name.toLowerCase().includes(q) ||
            c.ice.toLowerCase().includes(q) ||
            c.city.toLowerCase().includes(q),
        )
        .slice(0, perGroup)) {
        results.push({
          id: client._id,
          category: "client",
          title: client.name,
          subtitle: [client.ice, client.city].filter(Boolean).join(" · ") || "Client",
          href: "/clients",
          badge: "Client",
        });
      }
    }

    if (!cat || cat === "supplier") {
      const suppliers = await ctx.db
        .query("suppliers")
        .withIndex("by_org", (query) => query.eq("organizationId", organizationId))
        .collect();

      for (const supplier of suppliers
        .filter(
          (s) =>
            s.name.toLowerCase().includes(q) ||
            s.ice.toLowerCase().includes(q) ||
            s.city.toLowerCase().includes(q),
        )
        .slice(0, perGroup)) {
        results.push({
          id: supplier._id,
          category: "supplier",
          title: supplier.name,
          subtitle: [supplier.ice, supplier.city].filter(Boolean).join(" · ") || "Fournisseur",
          href: "/fournisseurs",
          badge: "Fournisseur",
        });
      }
    }

    if (!cat || cat === "catalog") {
      const items = await ctx.db
        .query("catalogItems")
        .withIndex("by_org", (query) => query.eq("organizationId", organizationId))
        .collect();

      for (const item of items
        .filter(
          (i) =>
            i.active &&
            (i.reference.toLowerCase().includes(q) || i.designation.toLowerCase().includes(q)),
        )
        .slice(0, perGroup)) {
        results.push({
          id: item._id,
          category: "catalog",
          title: item.designation,
          subtitle: `${item.reference} · ${item.unitPriceHt} MAD HT`,
          href: item.kind === "service" ? "/catalog/services" : "/catalog/articles",
          badge: item.kind === "service" ? "Service" : "Article",
        });
      }
    }

    return { results: results.slice(0, max) };
  },
});
