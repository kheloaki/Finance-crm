import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { documentColorValidator, documentTemplateValidator } from "./schema";
import { requireOrg } from "./lib/auth";

export const get = query({
  args: {},
  handler: async (ctx) => {
    const { organizationId } = await requireOrg(ctx);
    const row = await ctx.db
      .query("companySettings")
      .withIndex("by_org", (q) => q.eq("organizationId", organizationId))
      .first();

    if (!row) return null;

    let logoUrl = row.logoUrl;
    if (row.logoStorageId) {
      const storedUrl = await ctx.storage.getUrl(row.logoStorageId);
      if (storedUrl) logoUrl = storedUrl;
    }

    let cachetUrl = row.cachetUrl;
    if (row.cachetStorageId) {
      const storedUrl = await ctx.storage.getUrl(row.cachetStorageId);
      if (storedUrl) cachetUrl = storedUrl;
    }

    return { ...row, logoUrl, cachetUrl };
  },
});

export const upsert = mutation({
  args: {
    sellerName: v.string(),
    sellerActivity: v.optional(v.string()),
    sellerAddress: v.optional(v.string()),
    sellerPhone: v.optional(v.string()),
    sellerWebsite: v.optional(v.string()),
    sellerEmail: v.optional(v.string()),
    sellerIce: v.optional(v.string()),
    sellerIf: v.optional(v.string()),
    sellerRc: v.optional(v.string()),
    sellerCnss: v.optional(v.string()),
    sellerLegal: v.optional(v.string()),
    sellerContact: v.optional(v.string()),
    logoUrl: v.optional(v.string()),
    logoStorageId: v.optional(v.id("_storage")),
    removeLogo: v.optional(v.boolean()),
    cachetUrl: v.optional(v.string()),
    cachetStorageId: v.optional(v.id("_storage")),
    removeCachet: v.optional(v.boolean()),
    documentTemplate: v.optional(documentTemplateValidator),
    documentColor: v.optional(documentColorValidator),
  },
  handler: async (ctx, args) => {
    const { organizationId } = await requireOrg(ctx);
    const now = Date.now();
    const existing = await ctx.db
      .query("companySettings")
      .withIndex("by_org", (q) => q.eq("organizationId", organizationId))
      .first();

    if (args.removeLogo && existing?.logoStorageId) {
      await ctx.storage.delete(existing.logoStorageId);
    }

    if (
      args.logoStorageId &&
      existing?.logoStorageId &&
      existing.logoStorageId !== args.logoStorageId
    ) {
      await ctx.storage.delete(existing.logoStorageId);
    }

    if (args.removeCachet && existing?.cachetStorageId) {
      await ctx.storage.delete(existing.cachetStorageId);
    }

    if (
      args.cachetStorageId &&
      existing?.cachetStorageId &&
      existing.cachetStorageId !== args.cachetStorageId
    ) {
      await ctx.storage.delete(existing.cachetStorageId);
    }

    const data = {
      sellerName: args.sellerName.trim(),
      sellerActivity: args.sellerActivity?.trim() ?? "",
      sellerAddress: args.sellerAddress?.trim() ?? "",
      sellerPhone: args.sellerPhone?.trim() ?? "",
      sellerWebsite: args.sellerWebsite?.trim() ?? "",
      sellerEmail: args.sellerEmail?.trim() ?? "",
      sellerIce: args.sellerIce?.trim() ?? "",
      sellerIf: args.sellerIf?.trim() ?? "",
      sellerRc: args.sellerRc?.trim() ?? "",
      sellerCnss: args.sellerCnss?.trim() ?? "",
      sellerLegal: args.sellerLegal?.trim() ?? "",
      sellerContact: args.sellerContact?.trim() ?? "",
      logoUrl: args.removeLogo ? undefined : args.logoUrl?.trim() || undefined,
      logoStorageId: args.removeLogo ? undefined : args.logoStorageId ?? existing?.logoStorageId,
      cachetUrl: args.removeCachet ? undefined : args.cachetUrl?.trim() || undefined,
      cachetStorageId: args.removeCachet
        ? undefined
        : args.cachetStorageId ?? existing?.cachetStorageId,
      documentTemplate: args.documentTemplate ?? existing?.documentTemplate ?? "ruby",
      documentColor: args.documentColor ?? existing?.documentColor ?? "crimson",
      updatedAt: now,
    };

    if (existing) {
      await ctx.db.patch(existing._id, data);
      return existing._id;
    }

    return await ctx.db.insert("companySettings", {
      organizationId,
      ...data,
    });
  },
});
