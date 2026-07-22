import type { Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";

export async function ensureCompanySettings(
  ctx: MutationCtx,
  organizationId: Id<"organizations">,
) {
  const existing = await ctx.db
    .query("companySettings")
    .withIndex("by_org", (q) => q.eq("organizationId", organizationId))
    .first();

  if (existing) return existing._id;

  const org = await ctx.db.get(organizationId);
  const now = Date.now();

  return await ctx.db.insert("companySettings", {
    organizationId,
    sellerName: org?.name ?? "My company",
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
    currency: "MAD",
    documentLanguage: "fr",
    updatedAt: now,
  });
}
