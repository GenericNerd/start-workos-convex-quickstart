import { type AuthFunctions, AuthKit } from "@convex-dev/workos-authkit"
import { components, internal } from "./_generated/api"
import type { DataModel } from "./_generated/dataModel"
import { log, logChange, maskEmail } from "./audit/audit"
import { internalAction, MutationCtx, QueryCtx } from "./_generated/server"
import { v } from "convex/values"

export const authKit: AuthKit<DataModel> = new AuthKit<DataModel>(
  components.workOSAuthKit,
  {
    authFunctions: internal.auth as AuthFunctions,
    additionalEventTypes: ["session.created", "session.revoked"],
  }
)

export const updateUserExternalId = internalAction({
  args: v.object({
    userId: v.string(),
    externalId: v.id("users"),
  }),
  handler: async (ctx, args) => {
    await authKit.workos.userManagement.updateUser({
      userId: args.userId,
      externalId: args.externalId,
    })
  },
})

async function workOSAuthKitIdToUser(
  ctx: QueryCtx | MutationCtx,
  workOSAuthKitId: string
) {
  // TODO: Replace with index later
  return await ctx.db
    .query("users")
    .filter((q) => q.eq(q.field("workOSAuthKitId"), workOSAuthKitId))
    .first()
}

async function emailToUser(ctx: QueryCtx | MutationCtx, email: string) {
  // TODO: Replace with index later
  return await ctx.db
    .query("users")
    .filter((q) => q.eq(q.field("email"), email))
    .first()
}

export const { authKitEvent } = authKit.events({
  "user.created": async (ctx, event) => {
    const user = await ctx.db.insert("users", {
      workOSAuthKitId: event.data.id,
      firstName: event.data.firstName,
      lastName: event.data.lastName,
      email: event.data.email,
      emailVerified: event.data.emailVerified,
      profilePictureUrl: event.data.profilePictureUrl,
    })
    ctx.scheduler.runAfter(0, internal.auth.updateUserExternalId, {
      userId: event.data.id,
      externalId: user,
    })
    await log(ctx, {
      occurredAt: new Date(event.data.createdAt).getTime(),
      actor: {
        id: user,
        type: "system",
      },
      event: "user.create",
      status: "success",
      data: {
        target: {
          id: user,
          type: "user",
          displayName: maskEmail(event.data.email),
        },
        metadata: {
          provider: "workos",
          emailVerified: event.data.emailVerified,
          workOSAuthKitId: event.data.id,
        },
      },
    })
    return
  },
  "user.updated": async (ctx, event) => {
    return
  },
  "user.deleted": async (ctx, event) => {
    const user = await workOSAuthKitIdToUser(ctx, event.data.id)
    if (!user) {
      throw new Error("User not found")
    }
    await logChange(ctx, {
      occurredAt: new Date(event.data.createdAt).getTime(),
      actor: {
        id: user._id,
        type: "user",
      },
      event: "user.delete",
      status: "success",
      data: {
        target: {
          id: user._id,
          type: "user",
          displayName: maskEmail(event.data.email),
        },
        changes: {
          before: {
            provider: "workos",
            emailVerified: event.data.emailVerified,
            workOSAuthKitId: event.data.id,
          },
          after: {
            provider: null,
            emailVerified: null,
            workOSAuthKitId: null,
          },
        },
        reason: "User requested deletion",
      },
    })
    await ctx.db.delete(user._id)
    return
  },
  "session.created": async (ctx, event) => {
    const target = await workOSAuthKitIdToUser(ctx, event.data.userId)
    if (!target) {
      throw new Error("User not found")
    }
    let actor = target
    let reason = undefined
    if (event.data.impersonator) {
      const impersonator = await emailToUser(ctx, event.data.impersonator.email)
      if (!impersonator) {
        throw new Error("Impersonator not found")
      }
      actor = impersonator
      reason = event.data.impersonator.reason ?? undefined
    }

    await log(ctx, {
      occurredAt: new Date(event.data.createdAt).getTime(),
      actor: {
        id: actor._id,
        type: "user",
      },
      event: "session.create",
      status: "success",
      data: {
        target: {
          id: event.data.id,
          type: "session",
          userId: target._id,
        },
        metadata: {
          reason: reason ?? "Logged in",
        },
        context: {
          ipAddress: event.data.ipAddress ?? "Unknown",
          userAgent: event.data.userAgent ?? "Unknown",
        },
      },
    })
    return
  },
  "session.revoked": async (ctx, event) => {
    const target = await workOSAuthKitIdToUser(ctx, event.data.userId)
    if (!target) {
      throw new Error("User not found")
    }
    let actor = target
    let reason = undefined
    if (event.data.impersonator) {
      const impersonator = await emailToUser(ctx, event.data.impersonator.email)
      if (!impersonator) {
        throw new Error("Impersonator not found")
      }
      actor = impersonator
      reason = event.data.impersonator.reason ?? undefined
    }

    await logChange(ctx, {
      occurredAt: new Date(event.data.createdAt).getTime(),
      actor: {
        id: actor._id,
        type: "user",
      },
      event: "session.revoke",
      status: "success",
      data: {
        target: {
          id: event.data.id,
          type: "session",
          userId: target._id,
        },
        metadata: {
          reason: reason ?? "Logged out",
        },
        changes: {
          before: {
            sessionId: event.data.id,
          },
          after: {
            sessionId: null,
          },
        },
        context: {
          ipAddress: event.data.ipAddress ?? "Unknown",
          userAgent: event.data.userAgent ?? "Unknown",
        },
      },
    })
    return
  },
})
