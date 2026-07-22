import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation, query } from "./_generated/server";
import { getOrgOptional, requireOrg, setActiveOrganization } from "./lib/auth";
import { ensureCompanySettings } from "./lib/companySettingsDefaults";
import type { Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";

function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48) || "org";
}

async function createOrganizationForUser(
  ctx: MutationCtx,
  userId: Id<"users">,
  name: string,
) {
  const baseSlug = slugify(name);
  let slug = baseSlug;
  let i = 1;
  while (
    await ctx.db
      .query("organizations")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .first()
  ) {
    slug = `${baseSlug}-${i++}`;
  }

  const now = Date.now();
  const organizationId = await ctx.db.insert("organizations", {
    name,
    slug,
    createdAt: now,
  });

  await ctx.db.insert("members", {
    userId,
    organizationId,
    role: "owner",
    createdAt: now,
  });

  await ctx.db.insert("companySettings", {
    organizationId,
    sellerName: name,
    sellerActivity: "",
    sellerAddress: "",
    sellerPhone: "",
    sellerWebsite: "",
    sellerEmail: "",
    sellerIce: "",
    sellerIf: "",
    sellerRc: "",
    sellerCnss: "",
    sellerLegal: "",
    sellerContact: "",
    documentTemplate: "quill",
    documentColor: "navy",
    updatedAt: now,
  });

  await setActiveOrganization(ctx, userId, organizationId);
  return organizationId;
}

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const memberships = await ctx.db
      .query("members")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const activeOrg = await getOrgOptional(ctx);
    const activeId = activeOrg?.organizationId;

    const projects = await Promise.all(
      memberships.map(async (m) => {
        const org = await ctx.db.get(m.organizationId);
        if (!org) return null;
        return {
          _id: org._id,
          name: org.name,
          slug: org.slug,
          role: m.role,
          isActive: org._id === activeId,
        };
      }),
    );

    return projects
      .filter(Boolean)
      .sort((a, b) => a!.name.localeCompare(b!.name, "fr")) as Array<{
      _id: Id<"organizations">;
      name: string;
      slug: string;
      role: "owner" | "admin" | "member";
      isActive: boolean;
    }>;
  },
});

export const current = query({
  args: {},
  handler: async (ctx) => {
    const org = await getOrgOptional(ctx);
    if (!org) return null;

    const organization = await ctx.db.get(org.organizationId);
    if (!organization) return null;

    return {
      ...organization,
      role: org.role,
    };
  },
});

export const needsBootstrap = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return false;

    const member = await ctx.db
      .query("members")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    return !member;
  },
});

export const bootstrap = mutation({
  args: {
    organizationName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Non autorisé");

    const existing = await ctx.db
      .query("members")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    if (existing) {
      await setActiveOrganization(ctx, userId, existing.organizationId);
      return existing.organizationId;
    }

    const name = args.organizationName?.trim() || "My company";
    return await createOrganizationForUser(ctx, userId, name);
  },
});

export const create = mutation({
  args: {
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Non autorisé");

    const name = args.name.trim();
    if (!name) throw new Error("Company name required");

    return await createOrganizationForUser(ctx, userId, name);
  },
});

export const switchActive = mutation({
  args: {
    organizationId: v.id("organizations"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Non autorisé");

    const member = await ctx.db
      .query("members")
      .withIndex("by_org_user", (q) =>
        q.eq("organizationId", args.organizationId).eq("userId", userId),
      )
      .first();

    if (!member) throw new Error("Company not found");

    await ensureCompanySettings(ctx, args.organizationId);
    await setActiveOrganization(ctx, userId, args.organizationId);
    return args.organizationId;
  },
});
