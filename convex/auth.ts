import { AuthKit } from "@convex-dev/workos-authkit"
import { v } from "convex/values"
import { log, logChange, maskEmail } from "./audit/audit"
import { components, internal } from "./_generated/api"
import { internalAction } from "./_generated/server"
import { getUserByAuthKitId } from "./auth/utils"
import type { vUserUpdateEvent } from "./audit/events/user"
import type { DataModel } from "./_generated/dataModel"
import type { AuthFunctions } from "@convex-dev/workos-authkit"
import type { MutationCtx, QueryCtx } from "./_generated/server"
import type { Infer } from "convex/values"

type UserUpdateAuditEvent = Infer<typeof vUserUpdateEvent>

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
  handler: async (_ctx, args) => {
    await authKit.workos.userManagement.updateUser({
      userId: args.userId,
      externalId: args.externalId,
    })
  },
})

async function emailToUser(ctx: QueryCtx | MutationCtx, email: string) {
  return await ctx.db
    .query("users")
    .withIndex("by_email", (q) => q.eq("email", email))
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
    await ctx.scheduler.runAfter(0, internal.auth.updateUserExternalId, {
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
    const user = await getUserByAuthKitId(ctx, event.data.id)
    if (!user) {
      console.warn(`User not found: ${event.data.id}`)
      return
    }

    const newFirstName = event.data.firstName ?? ""
    const newLastName = event.data.lastName ?? ""
    const newProfilePictureUrl = event.data.profilePictureUrl ?? ""

    const before: {
      emailVerified?: boolean
      firstName?: string
      lastName?: string
      profilePictureUrl?: string
    } = {}
    const after: {
      emailVerified?: boolean
      firstName?: string
      lastName?: string
      profilePictureUrl?: string
    } = {}

    if (user.emailVerified !== event.data.emailVerified) {
      before.emailVerified = user.emailVerified
      after.emailVerified = event.data.emailVerified
    }
    if ((user.firstName ?? "") !== newFirstName) {
      before.firstName = user.firstName ?? ""
      after.firstName = newFirstName
    }
    if ((user.lastName ?? "") !== newLastName) {
      before.lastName = user.lastName ?? ""
      after.lastName = newLastName
    }
    if ((user.profilePictureUrl ?? "") !== newProfilePictureUrl) {
      before.profilePictureUrl = user.profilePictureUrl ?? ""
      after.profilePictureUrl = newProfilePictureUrl
    }

    await ctx.db.patch("users", user._id, {
      firstName: event.data.firstName,
      lastName: event.data.lastName,
      email: event.data.email,
      emailVerified: event.data.emailVerified,
      profilePictureUrl: event.data.profilePictureUrl,
    })

    if (Object.keys(after).length === 0) {
      return
    }

    await logChange(ctx, {
      occurredAt: new Date(event.data.updatedAt).getTime(),
      actor: {
        id: user._id,
        type: "user",
      },
      event: "user.update",
      status: "success",
      data: {
        target: {
          id: user._id,
          type: "user",
          displayName: maskEmail(event.data.email),
        },
        changes: { before, after },
        reason: "Profile updated",
      },
    } as UserUpdateAuditEvent)
    return
  },
  "user.deleted": async (ctx, event) => {
    const user = await getUserByAuthKitId(ctx, event.data.id)
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
    await ctx.db.delete("users", user._id)
    return
  },
  "session.created": async (ctx, event) => {
    const target = await getUserByAuthKitId(ctx, event.data.userId)
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
    const target = await getUserByAuthKitId(ctx, event.data.userId)
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
