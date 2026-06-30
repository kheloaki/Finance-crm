import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export const documentTypeValidator = v.union(
  v.literal("devis"),
  v.literal("bon_commande"),
  v.literal("bon_livraison"),
  v.literal("facture"),
  v.literal("bon_retour"),
);

export const documentStatusValidator = v.union(
  v.literal("draft"),
  v.literal("issued"),
  v.literal("cancelled"),
);

export const memberRoleValidator = v.union(
  v.literal("owner"),
  v.literal("admin"),
  v.literal("member"),
);

export const catalogKindValidator = v.union(v.literal("article"), v.literal("service"));

export const documentTemplateValidator = v.union(
  v.literal("classic"),
  v.literal("modern"),
  v.literal("minimal"),
  v.literal("executive"),
  v.literal("corporate"),
  v.literal("fresh"),
  v.literal("warm"),
  v.literal("ocean"),
  v.literal("slate"),
  v.literal("royal"),
  v.literal("geometric"),
  v.literal("stripe"),
  v.literal("gradient"),
  v.literal("interim"),
  v.literal("bluepro"),
  v.literal("studio"),
);

export const documentColorValidator = v.union(
  v.literal("navy"),
  v.literal("blue"),
  v.literal("sky"),
  v.literal("teal"),
  v.literal("emerald"),
  v.literal("amber"),
  v.literal("orange"),
  v.literal("rose"),
  v.literal("violet"),
  v.literal("slate"),
  v.literal("charcoal"),
  v.literal("crimson"),
);

export default defineSchema({
  ...authTables,

  organizations: defineTable({
    name: v.string(),
    slug: v.string(),
    createdAt: v.number(),
  }).index("by_slug", ["slug"]),

  members: defineTable({
    userId: v.id("users"),
    organizationId: v.id("organizations"),
    role: memberRoleValidator,
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_org", ["organizationId"])
    .index("by_org_user", ["organizationId", "userId"]),

  userPreferences: defineTable({
    userId: v.id("users"),
    activeOrganizationId: v.optional(v.id("organizations")),
  }).index("by_user", ["userId"]),

  clients: defineTable({
    organizationId: v.id("organizations"),
    name: v.string(),
    ice: v.string(),
    city: v.string(),
    address: v.string(),
    phone: v.string(),
    email: v.string(),
    representative: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_org", ["organizationId"])
    .index("by_org_name", ["organizationId", "name"]),

  suppliers: defineTable({
    organizationId: v.id("organizations"),
    name: v.string(),
    ice: v.string(),
    city: v.string(),
    address: v.string(),
    contact: v.string(),
    representative: v.optional(v.string()),
    bankName: v.string(),
    rib: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_org", ["organizationId"])
    .index("by_org_name", ["organizationId", "name"]),

  catalogItems: defineTable({
    organizationId: v.id("organizations"),
    kind: catalogKindValidator,
    reference: v.string(),
    designation: v.string(),
    unit: v.string(),
    unitPriceHt: v.number(),
    category: v.optional(v.string()),
    active: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_org", ["organizationId"])
    .index("by_org_kind", ["organizationId", "kind"]),

  documentFolders: defineTable({
    organizationId: v.id("organizations"),
    name: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_org", ["organizationId"])
    .index("by_org_name", ["organizationId", "name"]),

  companySettings: defineTable({
    organizationId: v.id("organizations"),
    sellerName: v.string(),
    sellerActivity: v.string(),
    sellerAddress: v.string(),
    sellerPhone: v.optional(v.string()),
    sellerWebsite: v.optional(v.string()),
    sellerEmail: v.optional(v.string()),
    sellerIce: v.optional(v.string()),
    sellerIf: v.optional(v.string()),
    sellerRc: v.optional(v.string()),
    sellerCnss: v.optional(v.string()),
    sellerLegal: v.string(),
    sellerContact: v.string(),
    logoUrl: v.optional(v.string()),
    logoStorageId: v.optional(v.id("_storage")),
    cachetUrl: v.optional(v.string()),
    cachetStorageId: v.optional(v.id("_storage")),
    documentTemplate: v.optional(documentTemplateValidator),
    documentColor: v.optional(documentColorValidator),
    updatedAt: v.number(),
  }).index("by_org", ["organizationId"]),

  documents: defineTable({
    organizationId: v.id("organizations"),
    folderId: v.optional(v.id("documentFolders")),
    documentType: documentTypeValidator,
    number: v.string(),
    reference: v.string(),
    date: v.string(),
    dueDate: v.optional(v.string()),
    clientId: v.optional(v.id("clients")),
    supplierId: v.optional(v.id("suppliers")),
    vatRate: v.number(),
    discount: v.number(),
    deposit: v.number(),
    notes: v.string(),
    showCachet: v.optional(v.boolean()),
    linkedDocumentId: v.optional(v.id("documents")),
    status: documentStatusValidator,
    totalHt: v.number(),
    totalTtc: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_org", ["organizationId"])
    .index("by_org_folder", ["organizationId", "folderId"])
    .index("by_org_type_date", ["organizationId", "documentType", "date"])
    .index("by_org_number", ["organizationId", "number"])
    .index("by_org_status", ["organizationId", "status"]),

  documentLines: defineTable({
    documentId: v.id("documents"),
    organizationId: v.id("organizations"),
    catalogItemId: v.optional(v.id("catalogItems")),
    reference: v.string(),
    designation: v.string(),
    unit: v.string(),
    qty: v.number(),
    unitPriceHt: v.number(),
    sortOrder: v.number(),
    isNote: v.optional(v.boolean()),
  }).index("by_document", ["documentId"]),
});
