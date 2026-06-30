import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";
import { requireOrg } from "./lib/auth";

async function assertFolderInOrg(
  ctx: QueryCtx | MutationCtx,
  folderId: Id<"documentFolders">,
  organizationId: Id<"organizations">,
) {
  const folder = await ctx.db.get(folderId);
  if (!folder || folder.organizationId !== organizationId) {
    throw new Error("Project not found");
  }
  return folder;
}

export const list = query({
  args: {},
  handler: async (ctx) => {
    const { organizationId } = await requireOrg(ctx);
    const folders = await ctx.db
      .query("documentFolders")
      .withIndex("by_org", (q) => q.eq("organizationId", organizationId))
      .collect();

    return folders.sort((a, b) => a.name.localeCompare(b.name, "fr"));
  },
});

export const listWithStats = query({
  args: {},
  handler: async (ctx) => {
    const { organizationId } = await requireOrg(ctx);
    const folders = await ctx.db
      .query("documentFolders")
      .withIndex("by_org", (q) => q.eq("organizationId", organizationId))
      .collect();

    const docs = await ctx.db
      .query("documents")
      .withIndex("by_org", (q) => q.eq("organizationId", organizationId))
      .collect();

    const unfiled = docs.filter((d) => !d.folderId);

    const withStats = await Promise.all(
      folders.map(async (folder) => {
        const folderDocs = docs.filter((d) => d.folderId === folder._id);
        const lastUpdated = folderDocs.reduce(
          (max, d) => Math.max(max, d.updatedAt),
          folder.updatedAt,
        );
        return {
          _id: folder._id,
          name: folder.name,
          documentCount: folderDocs.length,
          draftCount: folderDocs.filter((d) => d.status === "draft").length,
          lastUpdated,
        };
      }),
    );

    return {
      folders: withStats.sort((a, b) => b.lastUpdated - a.lastUpdated),
      unfiledCount: unfiled.length,
      unfiledDraftCount: unfiled.filter((d) => d.status === "draft").length,
    };
  },
});

export const create = mutation({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    const { organizationId } = await requireOrg(ctx);
    const name = args.name.trim();
    if (!name) throw new Error("Project name required");

    const existing = await ctx.db
      .query("documentFolders")
      .withIndex("by_org_name", (q) => q.eq("organizationId", organizationId).eq("name", name))
      .first();
    if (existing) throw new Error("A project with this name already exists");

    const now = Date.now();
    return await ctx.db.insert("documentFolders", {
      organizationId,
      name,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("documentFolders"),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const { organizationId } = await requireOrg(ctx);
    await assertFolderInOrg(ctx, args.id, organizationId);

    const name = args.name.trim();
    if (!name) throw new Error("Project name required");

    const duplicate = await ctx.db
      .query("documentFolders")
      .withIndex("by_org_name", (q) => q.eq("organizationId", organizationId).eq("name", name))
      .first();
    if (duplicate && duplicate._id !== args.id) {
      throw new Error("A project with this name already exists");
    }

    await ctx.db.patch(args.id, { name, updatedAt: Date.now() });
  },
});

export const remove = mutation({
  args: { id: v.id("documentFolders") },
  handler: async (ctx, args) => {
    const { organizationId } = await requireOrg(ctx);
    await assertFolderInOrg(ctx, args.id, organizationId);

    const docs = await ctx.db
      .query("documents")
      .withIndex("by_org_folder", (q) =>
        q.eq("organizationId", organizationId).eq("folderId", args.id),
      )
      .collect();

    for (const doc of docs) {
      await ctx.db.patch(doc._id, { folderId: undefined, updatedAt: Date.now() });
    }

    await ctx.db.delete(args.id);
  },
});
