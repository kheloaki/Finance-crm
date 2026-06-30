import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireOrg } from "./lib/auth";

export const list = query({
  args: { search: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const { organizationId } = await requireOrg(ctx);
    const suppliers = await ctx.db
      .query("suppliers")
      .withIndex("by_org", (q) => q.eq("organizationId", organizationId))
      .collect();

    const search = args.search?.trim().toLowerCase();
    const filtered = search
      ? suppliers.filter(
          (s) =>
            s.name.toLowerCase().includes(search) ||
            s.ice.toLowerCase().includes(search) ||
            s.city.toLowerCase().includes(search),
        )
      : suppliers;

    return filtered.sort((a, b) => b.updatedAt - a.updatedAt);
  },
});

export const get = query({
  args: { id: v.id("suppliers") },
  handler: async (ctx, args) => {
    const { organizationId } = await requireOrg(ctx);
    const supplier = await ctx.db.get(args.id);
    if (!supplier || supplier.organizationId !== organizationId) return null;
    return supplier;
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    ice: v.optional(v.string()),
    city: v.optional(v.string()),
    address: v.optional(v.string()),
    contact: v.optional(v.string()),
    representative: v.optional(v.string()),
    bankName: v.optional(v.string()),
    rib: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { organizationId } = await requireOrg(ctx);
    const now = Date.now();
    return await ctx.db.insert("suppliers", {
      organizationId,
      name: args.name.trim(),
      ice: args.ice?.trim() ?? "",
      city: args.city?.trim() ?? "",
      address: args.address?.trim() ?? "",
      contact: args.contact?.trim() ?? "",
      representative: args.representative?.trim() ?? "",
      bankName: args.bankName?.trim() ?? "",
      rib: args.rib?.trim() ?? "",
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("suppliers"),
    name: v.string(),
    ice: v.optional(v.string()),
    city: v.optional(v.string()),
    address: v.optional(v.string()),
    contact: v.optional(v.string()),
    representative: v.optional(v.string()),
    bankName: v.optional(v.string()),
    rib: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { organizationId } = await requireOrg(ctx);
    const supplier = await ctx.db.get(args.id);
    if (!supplier || supplier.organizationId !== organizationId) {
      throw new Error("Fournisseur introuvable");
    }
    await ctx.db.patch(args.id, {
      name: args.name.trim(),
      ice: args.ice?.trim() ?? "",
      city: args.city?.trim() ?? "",
      address: args.address?.trim() ?? "",
      contact: args.contact?.trim() ?? "",
      representative: args.representative?.trim() ?? "",
      bankName: args.bankName?.trim() ?? "",
      rib: args.rib?.trim() ?? "",
      updatedAt: Date.now(),
    });
  },
});

export const remove = mutation({
  args: { id: v.id("suppliers") },
  handler: async (ctx, args) => {
    const { organizationId } = await requireOrg(ctx);
    const supplier = await ctx.db.get(args.id);
    if (!supplier || supplier.organizationId !== organizationId) {
      throw new Error("Fournisseur introuvable");
    }
    await ctx.db.delete(args.id);
  },
});
