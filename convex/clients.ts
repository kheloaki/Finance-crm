import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireOrg } from "./lib/auth";

export const list = query({
  args: { search: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const { organizationId } = await requireOrg(ctx);
    const clients = await ctx.db
      .query("clients")
      .withIndex("by_org", (q) => q.eq("organizationId", organizationId))
      .collect();

    const search = args.search?.trim().toLowerCase();
    const filtered = search
      ? clients.filter(
          (c) =>
            c.name.toLowerCase().includes(search) ||
            c.ice.toLowerCase().includes(search) ||
            c.city.toLowerCase().includes(search),
        )
      : clients;

    return filtered.sort((a, b) => b.updatedAt - a.updatedAt);
  },
});

export const get = query({
  args: { id: v.id("clients") },
  handler: async (ctx, args) => {
    const { organizationId } = await requireOrg(ctx);
    const client = await ctx.db.get(args.id);
    if (!client || client.organizationId !== organizationId) return null;
    return client;
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    ice: v.optional(v.string()),
    city: v.optional(v.string()),
    address: v.optional(v.string()),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    representative: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { organizationId } = await requireOrg(ctx);
    const now = Date.now();
    return await ctx.db.insert("clients", {
      organizationId,
      name: args.name.trim(),
      ice: args.ice?.trim() ?? "",
      city: args.city?.trim() ?? "",
      address: args.address?.trim() ?? "",
      phone: args.phone?.trim() ?? "",
      email: args.email?.trim() ?? "",
      representative: args.representative?.trim() ?? "",
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("clients"),
    name: v.string(),
    ice: v.optional(v.string()),
    city: v.optional(v.string()),
    address: v.optional(v.string()),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    representative: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { organizationId } = await requireOrg(ctx);
    const client = await ctx.db.get(args.id);
    if (!client || client.organizationId !== organizationId) {
      throw new Error("Client introuvable");
    }
    await ctx.db.patch(args.id, {
      name: args.name.trim(),
      ice: args.ice?.trim() ?? "",
      city: args.city?.trim() ?? "",
      address: args.address?.trim() ?? "",
      phone: args.phone?.trim() ?? "",
      email: args.email?.trim() ?? "",
      representative: args.representative?.trim() ?? "",
      updatedAt: Date.now(),
    });
  },
});

export const remove = mutation({
  args: { id: v.id("clients") },
  handler: async (ctx, args) => {
    const { organizationId } = await requireOrg(ctx);
    const client = await ctx.db.get(args.id);
    if (!client || client.organizationId !== organizationId) {
      throw new Error("Client introuvable");
    }
    await ctx.db.delete(args.id);
  },
});

export const count = query({
  args: {},
  handler: async (ctx) => {
    const { organizationId } = await requireOrg(ctx);
    const clients = await ctx.db
      .query("clients")
      .withIndex("by_org", (q) => q.eq("organizationId", organizationId))
      .collect();
    return clients.length;
  },
});
