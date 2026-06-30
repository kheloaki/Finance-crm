import type { Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export type OrgContext = {
  userId: Id<"users">;
  organizationId: Id<"organizations">;
  role: "owner" | "admin" | "member";
};

type Ctx = QueryCtx | MutationCtx;

export async function listUserMemberships(ctx: Ctx, userId: Id<"users">) {
  return await ctx.db
    .query("members")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .collect();
}

async function getActiveOrganizationId(
  ctx: Ctx,
  userId: Id<"users">,
): Promise<Id<"organizations"> | null> {
  const prefs = await ctx.db
    .query("userPreferences")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .first();

  if (prefs?.activeOrganizationId) {
    const member = await ctx.db
      .query("members")
      .withIndex("by_org_user", (q) =>
        q.eq("organizationId", prefs.activeOrganizationId!).eq("userId", userId),
      )
      .first();
    if (member) return prefs.activeOrganizationId;
  }

  const first = await ctx.db
    .query("members")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .first();

  return first?.organizationId ?? null;
}

export async function setActiveOrganization(
  ctx: MutationCtx,
  userId: Id<"users">,
  organizationId: Id<"organizations">,
) {
  const existing = await ctx.db
    .query("userPreferences")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .first();

  if (existing) {
    await ctx.db.patch(existing._id, { activeOrganizationId: organizationId });
    return;
  }

  await ctx.db.insert("userPreferences", {
    userId,
    activeOrganizationId: organizationId,
  });
}

export async function requireOrg(ctx: Ctx): Promise<OrgContext> {
  const userId = await getAuthUserId(ctx);
  if (!userId) {
    throw new Error("Non autorisé");
  }

  const organizationId = await getActiveOrganizationId(ctx, userId);
  if (!organizationId) {
    throw new Error("No company linked");
  }

  return requireOrgMembership(ctx, userId, organizationId);
}

export async function requireOrgMembership(
  ctx: Ctx,
  userId: Id<"users">,
  organizationId: Id<"organizations">,
): Promise<OrgContext> {
  const member = await ctx.db
    .query("members")
    .withIndex("by_org_user", (q) => q.eq("organizationId", organizationId).eq("userId", userId))
    .first();

  if (!member) {
    throw new Error("Access denied to this company");
  }

  return {
    userId,
    organizationId: member.organizationId,
    role: member.role,
  };
}

export async function requireUserId(ctx: Ctx): Promise<Id<"users">> {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error("Non autorisé");
  return userId;
}

export async function getOrgOptional(ctx: Ctx): Promise<OrgContext | null> {
  try {
    return await requireOrg(ctx);
  } catch {
    return null;
  }
}
