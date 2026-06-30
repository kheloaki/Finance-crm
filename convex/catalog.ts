import { v } from "convex/values";
import { catalogKindValidator } from "./schema";
import { mutation, query } from "./_generated/server";
import { requireOrg } from "./lib/auth";

export const list = query({
  args: {
    kind: v.optional(catalogKindValidator),
    search: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { organizationId } = await requireOrg(ctx);
    let items = args.kind
      ? await ctx.db
          .query("catalogItems")
          .withIndex("by_org_kind", (q) =>
            q.eq("organizationId", organizationId).eq("kind", args.kind!),
          )
          .collect()
      : await ctx.db
          .query("catalogItems")
          .withIndex("by_org", (q) => q.eq("organizationId", organizationId))
          .collect();

    const search = args.search?.trim().toLowerCase();
    if (search) {
      items = items.filter(
        (item) =>
          item.reference.toLowerCase().includes(search) ||
          item.designation.toLowerCase().includes(search),
      );
    }

    return items
      .filter((item) => item.active)
      .sort((a, b) => b.updatedAt - a.updatedAt);
  },
});

export const listAll = query({
  args: { kind: v.optional(catalogKindValidator) },
  handler: async (ctx, args) => {
    const { organizationId } = await requireOrg(ctx);
    const items = args.kind
      ? await ctx.db
          .query("catalogItems")
          .withIndex("by_org_kind", (q) =>
            q.eq("organizationId", organizationId).eq("kind", args.kind!),
          )
          .collect()
      : await ctx.db
          .query("catalogItems")
          .withIndex("by_org", (q) => q.eq("organizationId", organizationId))
          .collect();

    return items.sort((a, b) => b.updatedAt - a.updatedAt);
  },
});

export const get = query({
  args: { id: v.id("catalogItems") },
  handler: async (ctx, args) => {
    const { organizationId } = await requireOrg(ctx);
    const item = await ctx.db.get(args.id);
    if (!item || item.organizationId !== organizationId) return null;
    return item;
  },
});

export const create = mutation({
  args: {
    kind: catalogKindValidator,
    reference: v.optional(v.string()),
    designation: v.string(),
    unit: v.optional(v.string()),
    unitPriceHt: v.optional(v.number()),
    category: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { organizationId } = await requireOrg(ctx);
    const now = Date.now();
    return await ctx.db.insert("catalogItems", {
      organizationId,
      kind: args.kind,
      reference: args.reference?.trim() || "REF",
      designation: args.designation.trim(),
      unit: args.unit?.trim() || "u",
      unitPriceHt: args.unitPriceHt ?? 0,
      category: args.category?.trim(),
      active: true,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("catalogItems"),
    reference: v.optional(v.string()),
    designation: v.string(),
    unit: v.optional(v.string()),
    unitPriceHt: v.optional(v.number()),
    category: v.optional(v.string()),
    active: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { organizationId } = await requireOrg(ctx);
    const item = await ctx.db.get(args.id);
    if (!item || item.organizationId !== organizationId) {
      throw new Error("Article introuvable");
    }
    await ctx.db.patch(args.id, {
      reference: args.reference?.trim() || item.reference,
      designation: args.designation.trim(),
      unit: args.unit?.trim() || item.unit,
      unitPriceHt: args.unitPriceHt ?? item.unitPriceHt,
      category: args.category?.trim(),
      active: args.active ?? item.active,
      updatedAt: Date.now(),
    });
  },
});

export const remove = mutation({
  args: { id: v.id("catalogItems") },
  handler: async (ctx, args) => {
    const { organizationId } = await requireOrg(ctx);
    const item = await ctx.db.get(args.id);
    if (!item || item.organizationId !== organizationId) {
      throw new Error("Article introuvable");
    }
    await ctx.db.patch(args.id, { active: false, updatedAt: Date.now() });
  },
});
