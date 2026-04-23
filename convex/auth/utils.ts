import { MutationCtx, QueryCtx } from "../_generated/server"

export async function getUserByAuthKitId(
  ctx: QueryCtx | MutationCtx,
  workOSAuthKitId: string
) {
  return await ctx.db
    .query("users")
    .withIndex("by_workOSAuthKitId", (q) =>
      q.eq("workOSAuthKitId", workOSAuthKitId)
    )
    .first()
}

export async function getUser(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity()
  if (!identity) {
    return null
  }
  return getUserByAuthKitId(ctx, identity.subject)
}

export async function requireUser(ctx: QueryCtx | MutationCtx) {
  const user = await getUser(ctx)
  if (!user) {
    throw new Error("User not found")
  }
  return user
}
