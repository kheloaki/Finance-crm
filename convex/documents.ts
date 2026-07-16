import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";
import { documentStatusValidator, documentTypeValidator } from "./schema";
import { requireOrg } from "./lib/auth";
import { computeNextDocumentNumber, yearFromDate } from "./lib/documentNumber";
import { computeDocumentTotals, DEFAULT_VAT_RATE } from "./lib/money";

const lineInput = v.object({
  catalogItemId: v.optional(v.id("catalogItems")),
  reference: v.string(),
  designation: v.string(),
  unit: v.string(),
  qty: v.number(),
  unitPriceHt: v.number(),
  sortOrder: v.number(),
  isNote: v.optional(v.boolean()),
});

function isSupplierDocument(type: string) {
  return type === "bon_commande";
}

async function getDocumentLines(ctx: { db: QueryCtx["db"] }, documentId: Id<"documents">) {
  return await ctx.db
    .query("documentLines")
    .withIndex("by_document", (q) => q.eq("documentId", documentId))
    .collect();
}

async function enrichDocument(ctx: QueryCtx, doc: Doc<"documents">) {
  const lines = await getDocumentLines(ctx, doc._id);
  const sortedLines = lines.sort((a, b) => a.sortOrder - b.sortOrder);

  let client = null;
  let supplier = null;
  if (doc.clientId) client = await ctx.db.get(doc.clientId);
  if (doc.supplierId) supplier = await ctx.db.get(doc.supplierId);

  let folderName: string | undefined;
  if (doc.folderId) {
    const folder = await ctx.db.get(doc.folderId);
    folderName = folder?.name;
  }

  return {
    ...doc,
    lines: sortedLines,
    client,
    supplier,
    counterpartyName: client?.name ?? supplier?.name ?? "—",
    projectId: doc.folderId,
    projectName: folderName,
  };
}

export const listByType = query({
  args: {
    documentType: documentTypeValidator,
    search: v.optional(v.string()),
    status: v.optional(documentStatusValidator),
  },
  handler: async (ctx, args) => {
    const { organizationId } = await requireOrg(ctx);
    let docs = await ctx.db
      .query("documents")
      .withIndex("by_org_type_date", (q) =>
        q.eq("organizationId", organizationId).eq("documentType", args.documentType),
      )
      .collect();

    if (args.status) {
      docs = docs.filter((d) => d.status === args.status);
    }

    const search = args.search?.trim().toLowerCase();
    const enriched = await Promise.all(
      docs
        .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt)
        .map((doc) => enrichDocument(ctx, doc)),
    );

    if (search) {
      return enriched.filter(
        (d) =>
          d.number.toLowerCase().includes(search) ||
          d.counterpartyName.toLowerCase().includes(search),
      );
    }

    return enriched;
  },
});

export const listAll = query({
  args: {
    folderId: v.optional(v.id("documentFolders")),
    unfiledOnly: v.optional(v.boolean()),
    documentType: v.optional(documentTypeValidator),
    search: v.optional(v.string()),
    status: v.optional(documentStatusValidator),
  },
  handler: async (ctx, args) => {
    const { organizationId } = await requireOrg(ctx);
    let docs = await ctx.db
      .query("documents")
      .withIndex("by_org", (q) => q.eq("organizationId", organizationId))
      .collect();

    if (args.folderId) {
      docs = docs.filter((d) => d.folderId === args.folderId);
    } else if (args.unfiledOnly) {
      docs = docs.filter((d) => !d.folderId);
    }

    if (args.documentType) {
      docs = docs.filter((d) => d.documentType === args.documentType);
    }
    if (args.status) {
      docs = docs.filter((d) => d.status === args.status);
    }

    const search = args.search?.trim().toLowerCase();
    const enriched = await Promise.all(
      docs
        .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt)
        .map((doc) => enrichDocument(ctx, doc)),
    );

    if (search) {
      return enriched.filter(
        (d) =>
          d.number.toLowerCase().includes(search) ||
          d.counterpartyName.toLowerCase().includes(search) ||
          (d.projectName?.toLowerCase().includes(search) ?? false),
      );
    }

    return enriched;
  },
});

export const get = query({
  args: { id: v.id("documents") },
  handler: async (ctx, args) => {
    const { organizationId } = await requireOrg(ctx);
    const doc = await ctx.db.get(args.id);
    if (!doc || doc.organizationId !== organizationId) return null;
    return enrichDocument(ctx, doc);
  },
});

export const getNextNumber = query({
  args: {
    documentType: documentTypeValidator,
    date: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { organizationId } = await requireOrg(ctx);
    const year = yearFromDate(args.date);
    const docs = await ctx.db
      .query("documents")
      .withIndex("by_org_type_date", (q) =>
        q.eq("organizationId", organizationId).eq("documentType", args.documentType),
      )
      .collect();

    const sameYear = docs.filter((d) => yearFromDate(d.date) === year);
    return computeNextDocumentNumber(
      sameYear.map((d) => d.number),
      year,
    );
  },
});

export const recent = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const { organizationId } = await requireOrg(ctx);
    const limit = args.limit ?? 10;
    const docs = await ctx.db
      .query("documents")
      .withIndex("by_org", (q) => q.eq("organizationId", organizationId))
      .collect();

    const sorted = docs.sort((a, b) => b.updatedAt - a.updatedAt).slice(0, limit);
    return Promise.all(sorted.map((doc) => enrichDocument(ctx, doc)));
  },
});

export const dashboardStats = query({
  args: {},
  handler: async (ctx) => {
    const { organizationId } = await requireOrg(ctx);
    const now = new Date();
    const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;

    const docs = await ctx.db
      .query("documents")
      .withIndex("by_org", (q) => q.eq("organizationId", organizationId))
      .collect();

    const thisMonth = docs.filter((d) => d.date >= monthStart);
    const drafts = docs.filter((d) => d.status === "draft");
    const facturesThisMonth = thisMonth.filter(
      (d) => d.documentType === "facture" && d.status === "issued",
    );
    const totalFactureTtc = facturesThisMonth.reduce((sum, d) => sum + d.totalTtc, 0);

    const byType: Record<string, number> = {};
    for (const doc of thisMonth) {
      byType[doc.documentType] = (byType[doc.documentType] ?? 0) + 1;
    }

    const clients = await ctx.db
      .query("clients")
      .withIndex("by_org", (q) => q.eq("organizationId", organizationId))
      .collect();

    const last6Months: { month: string; count: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const count = docs.filter((doc) => doc.date.startsWith(key)).length;
      last6Months.push({
        month: d.toLocaleDateString("fr-FR", { month: "short", year: "2-digit" }),
        count,
      });
    }

    return {
      documentsThisMonth: thisMonth.length,
      draftCount: drafts.length,
      totalFactureTtc,
      activeClients: clients.length,
      byType,
      last6Months,
    };
  },
});

async function replaceLines(
  ctx: MutationCtx,
  documentId: Id<"documents">,
  organizationId: Id<"organizations">,
  lines: Array<{
    catalogItemId?: Id<"catalogItems">;
    reference: string;
    designation: string;
    unit: string;
    qty: number;
    unitPriceHt: number;
    sortOrder: number;
    isNote?: boolean;
  }>,
) {
  const existing = await ctx.db
    .query("documentLines")
    .withIndex("by_document", (q) => q.eq("documentId", documentId))
    .collect();
  for (const line of existing) {
    await ctx.db.delete(line._id);
  }
  for (const line of lines) {
    await ctx.db.insert("documentLines", {
      documentId,
      organizationId,
      ...line,
    });
  }
}

type DocumentInput = {
  documentType: "devis" | "bon_commande" | "bon_livraison" | "facture" | "bon_retour";
  date: string;
  clientId?: Id<"clients">;
  supplierId?: Id<"suppliers">;
  lines: Array<{
    catalogItemId?: Id<"catalogItems">;
    reference: string;
    designation: string;
    unit: string;
    qty: number;
    unitPriceHt: number;
    sortOrder: number;
    isNote?: boolean;
  }>;
};

function validateCounterparty(input: DocumentInput) {
  if (isSupplierDocument(input.documentType)) {
    if (!input.supplierId) throw new Error("Fournisseur requis pour un bon de commande");
  } else {
    if (!input.clientId) throw new Error("Client requis pour ce document");
  }
}

async function resolveNumber(
  ctx: MutationCtx,
  organizationId: Id<"organizations">,
  input: DocumentInput,
  existingNumber?: string,
) {
  if (existingNumber) return existingNumber;
  const year = yearFromDate(input.date);
  const docs = await ctx.db
    .query("documents")
    .withIndex("by_org_type_date", (q) =>
      q.eq("organizationId", organizationId).eq("documentType", input.documentType),
    )
    .collect();
  const sameYear = docs.filter((d) => yearFromDate(d.date) === year);
  return computeNextDocumentNumber(
    sameYear.map((d) => d.number),
    year,
  );
}

export const create = mutation({
  args: {
    folderId: v.optional(v.id("documentFolders")),
    documentType: documentTypeValidator,
    number: v.optional(v.string()),
    reference: v.optional(v.string()),
    date: v.string(),
    dueDate: v.optional(v.string()),
    clientId: v.optional(v.id("clients")),
    supplierId: v.optional(v.id("suppliers")),
    vatRate: v.optional(v.number()),
    discount: v.optional(v.number()),
    deposit: v.optional(v.number()),
    notes: v.optional(v.string()),
    showCachet: v.optional(v.boolean()),
    amountDisplay: v.optional(v.union(v.literal("ht"), v.literal("ht_ttc"))),
    linkedDocumentId: v.optional(v.id("documents")),
    lines: v.array(lineInput),
  },
  handler: async (ctx, args) => {
    const { organizationId } = await requireOrg(ctx);
    if (args.folderId) {
      const folder = await ctx.db.get(args.folderId);
      if (!folder || folder.organizationId !== organizationId) {
        throw new Error("Project not found");
      }
    }
    validateCounterparty(args);

    const vatRate = args.vatRate ?? DEFAULT_VAT_RATE;
    const totals = computeDocumentTotals(args.lines, vatRate, args.discount ?? 0, args.deposit ?? 0);
    const number = await resolveNumber(ctx, organizationId, args);
    const now = Date.now();

    const documentId = await ctx.db.insert("documents", {
      organizationId,
      folderId: args.folderId,
      documentType: args.documentType,
      number,
      reference: args.reference?.trim() ?? "",
      date: args.date,
      dueDate: args.dueDate,
      clientId: args.clientId,
      supplierId: args.supplierId,
      vatRate,
      discount: args.discount ?? 0,
      deposit: args.deposit ?? 0,
      notes: args.notes?.trim() ?? "",
      showCachet: args.showCachet ?? false,
      amountDisplay: args.amountDisplay === "ht" ? "ht" : "ht_ttc",
      linkedDocumentId: args.linkedDocumentId,
      status: "draft",
      totalHt: totals.totalHt,
      totalTtc: totals.totalTtc,
      createdAt: now,
      updatedAt: now,
    });

    await replaceLines(ctx, documentId, organizationId, args.lines);
    return documentId;
  },
});

export const update = mutation({
  args: {
    id: v.id("documents"),
    folderId: v.optional(v.union(v.id("documentFolders"), v.null())),
    reference: v.optional(v.string()),
    date: v.string(),
    dueDate: v.optional(v.string()),
    clientId: v.optional(v.id("clients")),
    supplierId: v.optional(v.id("suppliers")),
    vatRate: v.optional(v.number()),
    discount: v.optional(v.number()),
    deposit: v.optional(v.number()),
    notes: v.optional(v.string()),
    showCachet: v.optional(v.boolean()),
    amountDisplay: v.optional(v.union(v.literal("ht"), v.literal("ht_ttc"))),
    linkedDocumentId: v.optional(v.id("documents")),
    lines: v.array(lineInput),
  },
  handler: async (ctx, args) => {
    const { organizationId } = await requireOrg(ctx);
    const doc = await ctx.db.get(args.id);
    if (!doc || doc.organizationId !== organizationId) {
      throw new Error("Document introuvable");
    }
    if (doc.status === "cancelled") {
      throw new Error("Document annulé — modification impossible");
    }

    if (args.folderId) {
      const folder = await ctx.db.get(args.folderId);
      if (!folder || folder.organizationId !== organizationId) {
        throw new Error("Project not found");
      }
    }

    validateCounterparty({
      documentType: doc.documentType,
      date: args.date,
      clientId: args.clientId,
      supplierId: args.supplierId,
      lines: args.lines,
    });

    const vatRate = args.vatRate ?? doc.vatRate;
    const totals = computeDocumentTotals(args.lines, vatRate, args.discount ?? 0, args.deposit ?? 0);

    await ctx.db.patch(args.id, {
      ...(args.folderId !== undefined ? { folderId: args.folderId ?? undefined } : {}),
      reference: args.reference?.trim() ?? doc.reference,
      date: args.date,
      dueDate: args.dueDate,
      clientId: args.clientId,
      supplierId: args.supplierId,
      vatRate,
      discount: args.discount ?? 0,
      deposit: args.deposit ?? 0,
      notes: args.notes?.trim() ?? "",
      linkedDocumentId: args.linkedDocumentId,
      showCachet: args.showCachet ?? doc.showCachet ?? false,
      amountDisplay:
        args.amountDisplay === "ht" || args.amountDisplay === "ht_ttc"
          ? args.amountDisplay
          : doc.amountDisplay === "ht"
            ? "ht"
            : "ht_ttc",
      totalHt: totals.totalHt,
      totalTtc: totals.totalTtc,
      updatedAt: Date.now(),
    });

    await replaceLines(ctx, args.id, organizationId, args.lines);
  },
});

export const issue = mutation({
  args: { id: v.id("documents") },
  handler: async (ctx, args) => {
    const { organizationId } = await requireOrg(ctx);
    const doc = await ctx.db.get(args.id);
    if (!doc || doc.organizationId !== organizationId) {
      throw new Error("Document introuvable");
    }
    if (doc.status === "cancelled") {
      throw new Error("Document annulé");
    }
    await ctx.db.patch(args.id, { status: "issued", updatedAt: Date.now() });
  },
});

export const cancel = mutation({
  args: { id: v.id("documents") },
  handler: async (ctx, args) => {
    const { organizationId } = await requireOrg(ctx);
    const doc = await ctx.db.get(args.id);
    if (!doc || doc.organizationId !== organizationId) {
      throw new Error("Document introuvable");
    }
    await ctx.db.patch(args.id, { status: "cancelled", updatedAt: Date.now() });
  },
});

export const duplicate = mutation({
  args: { id: v.id("documents") },
  handler: async (ctx, args) => {
    const { organizationId } = await requireOrg(ctx);
    const doc = await ctx.db.get(args.id);
    if (!doc || doc.organizationId !== organizationId) {
      throw new Error("Document introuvable");
    }

    const lines = await getDocumentLines(ctx, args.id);
    const today = new Date().toISOString().slice(0, 10);
    const number = await resolveNumber(ctx, organizationId, {
      documentType: doc.documentType,
      date: today,
      lines: lines.map((l) => ({
        reference: l.reference,
        designation: l.designation,
        unit: l.unit,
        qty: l.qty,
        unitPriceHt: l.unitPriceHt,
        sortOrder: l.sortOrder,
        isNote: l.isNote,
        catalogItemId: l.catalogItemId,
      })),
    });

    const now = Date.now();
    const newId = await ctx.db.insert("documents", {
      organizationId,
      folderId: doc.folderId,
      documentType: doc.documentType,
      number,
      reference: doc.reference,
      date: today,
      dueDate: doc.dueDate,
      clientId: doc.clientId,
      supplierId: doc.supplierId,
      vatRate: doc.vatRate,
      discount: doc.discount,
      deposit: doc.deposit,
      notes: doc.notes,
      showCachet: doc.showCachet ?? false,
      amountDisplay: doc.amountDisplay === "ht" ? "ht" : "ht_ttc",
      linkedDocumentId: doc.linkedDocumentId,
      status: "draft",
      totalHt: doc.totalHt,
      totalTtc: doc.totalTtc,
      createdAt: now,
      updatedAt: now,
    });

    await replaceLines(
      ctx,
      newId,
      organizationId,
      lines.map((l) => ({
        catalogItemId: l.catalogItemId,
        reference: l.reference,
        designation: l.designation,
        unit: l.unit,
        qty: l.qty,
        unitPriceHt: l.unitPriceHt,
        sortOrder: l.sortOrder,
        isNote: l.isNote,
      })),
    );

    return newId;
  },
});

export const remove = mutation({
  args: { id: v.id("documents") },
  handler: async (ctx, args) => {
    const { organizationId } = await requireOrg(ctx);
    const doc = await ctx.db.get(args.id);
    if (!doc || doc.organizationId !== organizationId) {
      throw new Error("Document introuvable");
    }
    if (doc.status === "issued") {
      throw new Error("Impossible de supprimer un document émis — annulez-le d'abord");
    }
    const lines = await getDocumentLines(ctx, args.id);
    for (const line of lines) {
      await ctx.db.delete(line._id);
    }
    await ctx.db.delete(args.id);
  },
});
